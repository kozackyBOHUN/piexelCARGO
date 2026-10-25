#!/usr/bin/env python3
"""Generate local 04A data from checksum-pinned sources; requires Shapely 2.1.2.
See docs/MAP_DATA.md for download commands and licensing. Never fetch during gameplay.
"""
import argparse
import hashlib
import json
from pathlib import Path
import zipfile
from shapely import make_valid
from shapely.geometry import shape, mapping, Point
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parents[1]
BOUNDARY_SHA = '0a4ffcd220604124b3170c496b3a02f6d7f8d867e46f0b23f7ac0ef9798d2a2d'
CITIES_SHA = 'b830e8942f2d58c7e68782dcf4dff2ffe8c4104a35ee881ed1ad4023cefcdba4'
TERYT = {'dolnośląskie':'02','kujawsko-pomorskie':'04','lubelskie':'06','lubuskie':'08','łódzkie':'10','małopolskie':'12','mazowieckie':'14','opolskie':'16','podkarpackie':'18','podlaskie':'20','pomorskie':'22','śląskie':'24','świętokrzyskie':'26','warmińsko-mazurskie':'28','wielkopolskie':'30','zachodniopomorskie':'32'}
DEMO = {755889,757026,761258,763523,763534,764917,766301,771804,773569,775183,775758,3080866,3082722,3084300,3089658,3090146,3091256,3094802,3101547}

def verified(path, expected):
    data = Path(path).read_bytes()
    if hashlib.sha256(data).hexdigest() != expected:
        raise ValueError(f'Checksum mismatch: {path}')
    return data

def rounded(value):
    if isinstance(value, float): return round(value, 5)
    if isinstance(value, (list, tuple)): return [rounded(x) for x in value]
    if isinstance(value, dict): return {k: rounded(v) for k,v in value.items()}
    return value

def save(name, value):
    (ROOT / 'src/world/data' / name).write_text(json.dumps(rounded(value), ensure_ascii=False, separators=(',',':'))+'\n', encoding='utf-8')

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--boundaries', required=True)
    parser.add_argument('--cities-wheel', required=True)
    args=parser.parse_args()
    raw=json.loads(verified(args.boundaries, BOUNDARY_SHA))
    assert len(raw['features']) == 16
    features=[]; shapes=[]; demo_shape=None
    for f in raw['features']:
        name=f['properties']['nazwa']; geom=shape(f['geometry'])
        if not geom.is_valid:
            print(f'Repairing source topology: {name}')
            geom=make_valid(geom)
            if geom.geom_type=='GeometryCollection':
                geom=unary_union([g for g in geom.geoms if g.geom_type in ('Polygon','MultiPolygon')])
        assert geom.is_valid, name
        shapes.append(geom)
        if name=='małopolskie': demo_shape=geom
        features.append({'type':'Feature','id':f'PL-{TERYT[name]}','properties':{'name':name},'geometry':mapping(geom)})
    union=unary_union(shapes)
    assert union.is_valid
    save('voivodeships.json', {'type':'FeatureCollection','features':sorted(features,key=lambda x:x['id'])})
    save('poland.json', {'type':'Feature','id':'PL','properties':{'name':'Polska'},'geometry':mapping(union)})
    verified(args.cities_wheel, CITIES_SHA)
    with zipfile.ZipFile(args.cities_wheel) as wheel:
        cities=json.loads(wheel.read('geonamescache/data/cities500.json'))
        license_name=next(n for n in wheel.namelist() if n.endswith('/licenses/LICENSE'))
        (ROOT/'public/licenses/geonamescache-MIT.txt').write_bytes(wheel.read(license_name))
    selected=[]
    for c in cities.values():
        if c['geonameid'] not in DEMO: continue
        assert c['countrycode']=='PL' and c['admin1code']=='77'
        assert demo_shape.covers(Point(c['longitude'], c['latitude'])), c['name']
        selected.append({'id':f"geonames:{c['geonameid']}",'name':c['name'],'voivodeshipId':'PL-12','coordinates':[c['longitude'],c['latitude']]})
    assert len(selected)==len(DEMO)
    save('cities-demo.json', sorted(selected,key=lambda x:x['id']))
    print(f'Generated {len(features)} voivodeships, national union ({union.geom_type}), {len(selected)} demo cities.')

if __name__=='__main__': main()
