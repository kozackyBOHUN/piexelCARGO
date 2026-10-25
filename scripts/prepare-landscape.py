#!/usr/bin/env python3
"""Build real, quantized forest/DEM rasters from public sources. See MAP_DATA.
First acquisition: --initialize-lock. Later runs verify the committed source lock.
TLS and checksums remain enabled. No random geometry or synthetic mountain heights.
"""
import argparse, concurrent.futures, hashlib, io, json, math, urllib.request
from collections import deque
from pathlib import Path
import numpy as np
import rasterio
from rasterio.enums import Resampling
from rasterio.features import rasterize
from rasterio.transform import from_bounds, from_origin
from rasterio.warp import reproject, transform_bounds, transform_geom
from PIL import Image
from shapely.geometry import shape, box

ROOT=Path(__file__).resolve().parents[1]
LOCK=ROOT/'scripts/landscape-sources.json'
OUT=ROOT/'public/landscape'
HALF=20037508.342789244
RES=800

def digest(data): return hashlib.sha256(data).hexdigest()
def request(url, method='GET'):
    return urllib.request.urlopen(urllib.request.Request(url,method=method),timeout=45)
def remove_small_islands(mask, minimum):
    """Only omit source-covered small components at distant LODs; never invent tree pixels."""
    if minimum <= 1: return mask
    result=mask.copy();seen=np.zeros(mask.shape,dtype=bool);height,width=mask.shape
    for row,column in zip(*np.nonzero(mask)):
        if seen[row,column]:continue
        queue=deque([(int(row),int(column))]);seen[row,column]=True;component=[]
        while queue:
            y,x=queue.popleft();component.append((y,x))
            for yy,xx in [(y-1,x),(y+1,x),(y,x-1),(y,x+1)]:
                if 0<=yy<height and 0<=xx<width and mask[yy,xx] and not seen[yy,xx]:
                    seen[yy,xx]=True;queue.append((yy,xx))
        if len(component)<minimum:
            for y,x in component:result[y,x]=False
    assert not np.any(result & ~mask)
    return result

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--cache-dir',default='/tmp/pixelcargo-landscape/raster');parser.add_argument('--initialize-lock',action='store_true');args=parser.parse_args()
    cache=Path(args.cache_dir);cache.mkdir(parents=True,exist_ok=True);OUT.mkdir(parents=True,exist_ok=True)
    if args.initialize_lock and LOCK.exists(): raise ValueError('Source lock exists; do not silently replace it.')
    expected={} if args.initialize_lock else json.loads(LOCK.read_text())
    acquired={}
    geo=json.loads((ROOT/'src/world/data/poland.json').read_text())['geometry'];country=shape(geo)
    west,south,east,north=country.bounds
    left,bottom,right,top=transform_bounds('EPSG:4326','EPSG:3857',west,south,east,north)
    left=math.floor(left/RES)*RES;bottom=math.floor(bottom/RES)*RES;right=math.ceil(right/RES)*RES;top=math.ceil(top/RES)*RES
    width=round((right-left)/RES);height=round((top-bottom)/RES);transform=from_origin(left,top,RES,RES)
    mask=rasterize([(transform_geom('EPSG:4326','EPSG:3857',geo),1)],out_shape=(height,width),transform=transform,dtype='uint8').astype(bool)
    classes=np.zeros((height,width),dtype=np.uint8)
    for lat in range(math.floor(south/3)*3,math.floor(north/3)*3+1,3):
      for lon in range(math.floor(west/3)*3,math.floor(east/3)*3+1,3):
        if not country.intersects(box(lon,lat,lon+3,lat+3)): continue
        key=f'ESA_WorldCover_10m_2021_v200_N{lat:02d}E{lon:03d}_Map.tif'
        url=f'https://esa-worldcover.s3.eu-central-1.amazonaws.com/v200/2021/map/{key}'
        with request(url,'HEAD') as response: headers=dict(response.headers)
        etag=next(v for k,v in headers.items() if k.lower()=='etag')
        if not args.initialize_lock and etag!=expected[key]['etag']:raise ValueError(f'Changed ESA source ETag: {key}')
        sample_path=cache/(key+'.npy')
        if sample_path.exists(): sample=np.load(sample_path)
        else:
          with rasterio.Env(GDAL_DISABLE_READDIR_ON_OPEN='EMPTY_DIR',GDAL_HTTP_TIMEOUT=45,GDAL_HTTP_CA_BUNDLE='/etc/ssl/certs/ca-certificates.crt'):
            with rasterio.open(url) as source:sample=source.read(1,out_shape=(600,600),resampling=Resampling.nearest)
          np.save(sample_path,sample)
        sha=digest(sample.tobytes())
        if sample.shape!=(600,600) or (not args.initialize_lock and sha!=expected[key]['sampleSha256']):raise ValueError(f'Changed ESA sample: {key}')
        acquired[key]={'url':url,'etag':etag,'sampleSha256':sha,'sampleShape':[600,600]}
        temporary=np.zeros_like(classes)
        reproject(sample,temporary,src_transform=from_bounds(lon,lat,lon+3,lat+3,600,600),src_crs='EPSG:4326',dst_transform=transform,dst_crs='EPSG:3857',resampling=Resampling.nearest)
        classes[temporary!=0]=temporary[temporary!=0]
        print('WorldCover',key,'tree pixels',int((temporary==10).sum()),flush=True)
    forests=(classes==10)&mask
    # z8 Terrarium sources, keeping provenance/checksums for every downloaded tile.
    zoom=8;span=HALF*2/(2**zoom)
    x0=math.floor((left+HALF)/span);x1=math.floor((right+HALF)/span)
    y0=math.floor((HALF-top)/span);y1=math.floor((HALF-bottom)/span)
    mosaic=np.zeros(((y1-y0+1)*256,(x1-x0+1)*256),dtype=np.float32)
    def get_tile(position):
      x,y=position;key=f'terrarium-{zoom}-{x}-{y}.png';url=f'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{zoom}/{x}/{y}.png';path=cache/key
      if path.exists() and key in expected:
        content=path.read_bytes();entry=expected[key]
      else:
        with request(url) as response:
          content=response.read();headers={k.lower():v for k,v in response.headers.items()}
        entry={'url':url,'sha256':digest(content),'imagerySources':headers.get('x-amz-meta-x-imagery-sources',''),'versionId':headers.get('x-amz-version-id'),'lastModified':headers.get('last-modified')}
        path.write_bytes(content)
      if not args.initialize_lock and digest(content)!=expected[key]['sha256']:raise ValueError(f'Changed terrain source: {key}')
      pixels=np.asarray(Image.open(io.BytesIO(content)).convert('RGB'),dtype=np.float32)
      elevation=pixels[:,:,0]*256+pixels[:,:,1]+pixels[:,:,2]/256-32768
      return x,y,key,entry,elevation
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
      for x,y,key,entry,elevation in pool.map(get_tile,[(x,y) for x in range(x0,x1+1) for y in range(y0,y1+1)]):
        acquired[key]=entry;mosaic[(y-y0)*256:(y-y0+1)*256,(x-x0)*256:(x-x0+1)*256]=elevation
    heights=np.zeros((height,width),dtype=np.float32)
    reproject(mosaic,heights,src_transform=from_origin(-HALF+x0*span,HALF-y0*span,span/256,span/256),src_crs='EPSG:3857',dst_transform=transform,dst_crs='EPSG:3857',resampling=Resampling.bilinear)
    bands=np.digitize(heights,[100,200,300,500,800,1200,1600,2200])
    palette=np.array([[43,61,61],[48,67,65],[56,73,64],[67,79,66],[83,88,71],[98,96,79],[116,114,97],[138,135,118],[170,161,138]],dtype=float)
    gy,gx=np.gradient(heights,RES)
    light=np.maximum(0,(-gx*.5-gy*.5+0.707)/np.sqrt(gx*gx+gy*gy+1))
    rgb=np.clip(np.round(palette[bands]*(.92+.15*(light[:,:,None]-.707))/4)*4,0,255).astype(np.uint8)
    rgba=np.dstack([rgb,mask.astype(np.uint8)*255])
    terrain_image=Image.fromarray(rgba)
    levels=[]
    for factor in [4,2,1]:
      size=(math.ceil(width/factor),math.ceil(height/factor))
      terrain=terrain_image.resize(size,Image.Resampling.NEAREST);terrain.save(OUT/f'terrain-{factor}.png',optimize=True)
      coverage=Image.fromarray(forests.astype(np.uint8)*255).resize(size,Image.Resampling.BOX)
      selected=np.asarray(coverage)>=(140 if factor==4 else 100 if factor==2 else 128)
      minimum=25 if factor==4 else 6 if factor==2 else 1
      selected=remove_small_islands(selected,minimum)
      yy,xx=np.indices(selected.shape);texture=((xx+yy)%4==0).astype(np.uint8)*3
      color=np.stack([18+texture,48+texture,33+texture,selected.astype(np.uint8)*175],axis=2).astype(np.uint8)
      Image.fromarray(color).save(OUT/f'forests-{factor}.png',optimize=True)
      levels.append({'factor':factor,'width':size[0],'height':size[1],'terrain':f'/landscape/terrain-{factor}.png','forests':f'/landscape/forests-{factor}.png','forestPixelCount':int(selected.sum()),'minForestComponentCells':minimum})
    samples=[]
    for name,lon,lat in [('Tatry',20.02,49.23),('Beskidy',19.25,49.57),('Bieszczady',22.70,49.10),('Sudety',15.74,50.74),('Wyżyna Krakowsko-Częstochowska',19.60,50.50),('Nizina Mazowiecka',21,52.2)]:
      x,y=transform_bounds('EPSG:4326','EPSG:3857',lon,lat,lon,lat)[:2];row=int((top-y)/RES);col=int((x-left)/RES)
      samples.append({'name':name,'coordinates':[lon,lat],'elevationMeters':round(float(heights[row,col]))})
    forest_regions=[]
    for name,lon,lat in [('Bory Tucholskie',17.9,53.7),('Puszcza Białowieska',23.8,52.7),('Puszcza Notecka',16.0,52.7),('Puszcza Kampinoska',20.5,52.3),('Bory Dolnośląskie',15.4,51.5)]:
      fx,fy=transform_bounds('EPSG:4326','EPSG:3857',lon,lat,lon,lat)[:2];r=int((top-fy)/RES);c=int((fx-left)/RES)
      region=forests[max(0,r-10):r+11,max(0,c-10):c+11]
      forest_regions.append({'name':name,'coordinates':[lon,lat],'treeCoverShareNearPoint':round(float(region.mean()),4)})
    metadata={'schemaVersion':1,'crs':'EPSG:3857','origin':[left,-top],'pixelSize':RES,'width':width,'height':height,'levels':levels,'forestClass':10,'forestShare':round(float(forests.sum()/mask.sum()),4),'landCoverage':round(float(((classes>0)&mask).sum()/mask.sum()),4),'heightRange':[round(float(heights[mask].min())),round(float(heights[mask].max()))],'heightSamples':samples,'sources':{'forestTiles':sum(k.startswith('ESA') for k in acquired),'heightTiles':sum(k.startswith('terrarium') for k in acquired)},'heightGridSha256':digest(heights.tobytes()),'forestRegions':forest_regions}
    (OUT/'manifest.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2)+'\n')
    if args.initialize_lock:LOCK.write_text(json.dumps(acquired,ensure_ascii=False,indent=2,sort_keys=True)+'\n')
    print(json.dumps(metadata,ensure_ascii=False,indent=2))
if __name__=='__main__':main()
