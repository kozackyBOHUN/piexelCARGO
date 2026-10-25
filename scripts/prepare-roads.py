#!/usr/bin/env python3
"""OSM topology importer. No geometric joining, no synthetic connecting roads."""
import argparse
from collections import Counter, defaultdict, deque
import gzip
import hashlib
import json
from math import radians, sin, cos, asin, sqrt
from pathlib import Path
import time
import osmium
import numpy as np
from shapely.geometry import shape, LineString
from shapely.prepared import prep

ROOT = Path(__file__).resolve().parents[1]
CLASSES = {'motorway','trunk','primary','secondary','tertiary','unclassified','residential','living_street','service'}
CLASSES |= {x+'_link' for x in list(CLASSES)}
TAGS = {'highway','name','ref','oneway','junction','access','vehicle','motor_vehicle','motorcar','goods',
        'maxspeed','maxspeed:forward','maxspeed:backward','maxweight','maxheight','maxwidth',
        'bridge','tunnel','layer','surface','smoothness','service','toll'}

def meters(a,b):
    x,y = radians(b[0]-a[0]), radians(b[1]-a[1])
    return 6371008.8*2*asin(min(1,sqrt(sin(y/2)**2+cos(radians(a[1]))*cos(radians(b[1]))*sin(x/2)**2)))

def policy(tags):
    if tags.get('highway') not in CLASSES: return 0
    # Ordinary van on unrestricted public roads, no destination/private permits.
    access = next((tags[k] for k in ('goods','motorcar','motor_vehicle','vehicle','access') if k in tags), 'yes')
    if access not in {'yes','permissive','designated'}: return 0
    if any(':conditional' in k and k.split(':')[0] in {'access','vehicle','motor_vehicle','motorcar','goods','oneway'} for k in tags): return 0
    if tags.get('impassable') == 'yes' or tags.get('smoothness') == 'impassable': return 0
    direction = tags.get('oneway', 'yes' if tags.get('junction') == 'roundabout' or tags.get('highway') == 'motorway' else 'no')
    if direction in ('yes','1','true'): result=1
    elif direction == '-1': result=2
    elif direction in ('no','0','false'): result=3
    else: return 0  # unknown/reversible/alternating cannot promise ordinary access
    for label,bit in [('forward',1),('backward',2)]:
        access=next((tags[k+':'+label] for k in ('goods','motorcar','motor_vehicle','vehicle','access') if k+':'+label in tags), 'yes')
        if access not in {'yes','permissive','designated'}: result &= ~bit
    return result

class Importer(osmium.SimpleHandler):
    def __init__(self, boundary):
        super().__init__()
        self.boundary=prep(boundary)
        self.ways=[]; self.restrictions=[]; self.excluded=Counter(); self.barriers=set()
    def node(self,n):
        t=dict(n.tags)
        if t.get('barrier') and t.get('barrier') not in {'cattle_grid','entrance','toll_booth','border_control'}:
            access=next((t[k] for k in ('goods','motorcar','motor_vehicle','vehicle','access') if k in t),'no')
            if access not in {'yes','permissive','designated'}: self.barriers.add(n.id)
    def way(self,w):
        tags=dict(w.tags); directions=policy(tags)
        if not directions:
            if tags.get('highway'): self.excluded['policy']+=1
            return
        refs=[]; coords=[]
        for n in w.nodes:
            if not n.location.valid():
                raise ValueError(f'Missing location in way {w.id}')
            refs.append(n.ref);coords.append([n.lon,n.lat])
        if len(coords)<2: return
        # Real border clipping: retain only actual adjacent source nodes/segments.
        # No intersection points inserted and no road reconnected across a gap.
        start=0
        for i in range(len(coords)-1):
            allowed=(refs[i] not in self.barriers and refs[i+1] not in self.barriers
                     and self.boundary.covers(LineString(coords[i:i+2])))
            if not allowed:
                if i-start>=1: self.ways.append((w.id,start,refs[start:i+1],coords[start:i+1],tags,directions))
                start=i+1;self.excluded['borderOrBarrierSegments']+=1
        if len(coords)-1-start>=1:
            self.ways.append((w.id,start,refs[start:],coords[start:],tags,directions))
    def relation(self,r):
        t=dict(r.tags)
        if t.get('type')=='restriction':
            self.restrictions.append({'id':r.id,'tags':t,'members':[[m.type,m.ref,m.role] for m in r.members]})


def build(importer,cities,version,candidates=None,source_refs=None):
    occurrences=Counter();coordinates={}; ends=set()
    for _,_,refs,coords,_,_ in importer.ways:
        occurrences.update(refs); coordinates.update(zip(refs,coords));ends.update((refs[0],refs[-1]))
    for r in importer.restrictions:
        ends.update(ref for kind,ref,role in r['members'] if kind=='n' and role=='via')
    snaps=[]
    snap_coordinates=coordinates if candidates is None else {n:coordinates[n] for n in candidates}
    if cities:
        snap_ids=sorted(snap_coordinates)
        snap_array=np.radians(np.array([snap_coordinates[n] for n in snap_ids]))
    for c in cities:
        lon,lat=np.radians(c['coordinates'])
        metric=np.sin((snap_array[:,1]-lat)/2)**2+np.cos(lat)*np.cos(snap_array[:,1])*np.sin((snap_array[:,0]-lon)/2)**2
        nearest=snap_ids[int(np.argmin(metric))]
        ends.add(nearest)
        snaps.append({'cityId':c['id'],'nodeId':nearest,'gapMeters':meters(c['coordinates'],coordinates[nearest])})
    ends.update(n for n,count in occurrences.items() if count>1)
    ids=sorted(ends & coordinates.keys()); index={n:i for i,n in enumerate(ids)}
    nodes=[[n,*coordinates[n]] for n in ids]; ways=[]; way_index={};segments=[]
    for wid,offset,refs,coords,tags,direction in sorted(importer.ways,key=lambda x:(x[0],x[1])):
        if wid not in way_index:
            way_index[wid]=len(ways)
            ways.append({'id':wid,'tags':{k:v for k,v in tags.items() if k in TAGS or ':conditional' in k or k.endswith((':forward',':backward'))}})
        start=0
        for i in range(1,len(refs)):
            if refs[i] in ends:
                geometry=coords[start:i+1]
                length=sum(meters(a,b) for a,b in zip(geometry,geometry[1:]))
                if length>0:
                    segment_id=f'{wid}:{offset+start}:{offset+i}'
                    segments.append([segment_id,index[refs[start]],index[refs[i]],way_index[wid],length,direction,geometry])
                    if source_refs is not None:source_refs[segment_id]=refs[start:i+1]
                start=i
    relevant=[]
    for r in importer.restrictions:
        if any(kind=='w' and ref in way_index for kind,ref,_ in r['members']): relevant.append(r)
    return {'format':1,'version':version,'nodes':nodes,'ways':ways,'segments':segments,
            'restrictions':relevant,'snaps':snaps}


def main_component(graph):
    """Iterative Kosaraju: snapping cannot choose an isolated car park/service stub."""
    size=len(graph['nodes']);out=[[] for _ in range(size)];back=[[] for _ in range(size)]
    for _,a,b,_,_,d,_ in graph['segments']:
        if d&1:out[a].append(b);back[b].append(a)
        if d&2:out[b].append(a);back[a].append(b)
    seen=bytearray(size);order=[]
    for root in range(size):
        if seen[root]:continue
        pending=[(root,False)]
        while pending:
            node,exit=pending.pop()
            if exit:order.append(node);continue
            if seen[node]:continue
            seen[node]=1;pending.append((node,True))
            pending.extend((n,False) for n in out[node] if not seen[n])
    seen=bytearray(size);largest=set()
    for root in reversed(order):
        if seen[root]:continue
        pending=[root];seen[root]=1;component=set()
        while pending:
            node=pending.pop();component.add(node)
            for n in back[node]:
                if not seen[n]:seen[n]=1;pending.append(n)
        if len(component)>len(largest):largest=component
    return largest


def check_connections(graph,cities):
    adjacency=defaultdict(list)
    for _,a,b,_,_,d,_ in graph['segments']:
        if d&1: adjacency[a].append(b)
        if d&2: adjacency[b].append(a)
    indices={n[0]:i for i,n in enumerate(graph['nodes'])}
    snaps={s['cityId']:indices[s['nodeId']] for s in graph['snaps']}
    names={c['name']:c['id'] for c in cities}
    pairs=[('Kraków','Tarnów'),('Kraków','Zakopane'),('Kraków','Nowy Sącz'),('Kraków','Oświęcim'),('Tarnów','Nowy Sącz'),('Nowy Targ','Zakopane')]
    # Every catalog city must be reachable to/from Kraków, not only six fixtures.
    reverse=defaultdict(list)
    for a,targets in adjacency.items():
        for b in targets:reverse[b].append(a)
    root=snaps[names['Kraków']]
    for directions in [adjacency,reverse]:
        pending=deque([root]);visited={root}
        while pending:
            for n in directions[pending.popleft()]:
                if n not in visited:visited.add(n);pending.append(n)
        for name,city_id in names.items():
            if snaps[city_id] not in visited:raise ValueError(f'City not mutually connected: {name}')
    result=[]
    for origin,target in pairs:
        pending=deque([snaps[names[origin]]]);visited=set(pending);end=snaps[names[target]]
        while pending and end not in visited:
            for n in adjacency[pending.popleft()]:
                if n not in visited:visited.add(n);pending.append(n)
        if end not in visited:raise ValueError(f'No directed connection {origin} -> {target}; do not invent links')
        result.append([origin,target,True])
    return result


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--pbf',required=True);parser.add_argument('--lock',required=True)
    parser.add_argument('--border',required=True);parser.add_argument('--output',default='public/roads/demo')
    args=parser.parse_args();started=time.perf_counter()
    lock=json.loads(Path(args.lock).read_text())
    sha=hashlib.sha256()
    with Path(args.pbf).open('rb') as f:
        for block in iter(lambda:f.read(1024*1024),b''):sha.update(block)
    if sha.hexdigest()!=lock['sha256']:raise ValueError('PBF SHA-256 mismatch')
    boundary=shape(json.loads(Path(args.border).read_text())['geometry'])
    if not boundary.is_valid:raise ValueError('Invalid source border')
    importer=Importer(boundary)
    locations=osmium.NodeLocationsForWays(osmium.index.create_map('flex_mem'))
    locations.ignore_errors()
    with osmium.io.Reader(args.pbf) as reader:
        osmium.apply(reader,locations,osmium.filter.KeyFilter('barrier','highway','type'),importer)
    with osmium.io.Reader(args.pbf) as reader:timestamp=reader.header().get('osmosis_replication_timestamp')
    border_sha=hashlib.sha256(Path(args.border).read_bytes()).hexdigest()
    version='05A-v1-'+lock['sha256'][:16]+'-'+border_sha[:8]
    print('Imported source fragments:',len(importer.ways),flush=True)
    source_refs={};base=build(importer,[],version,source_refs=source_refs)
    component=main_component(base)
    candidates=set()
    for segment in base['segments']:
        if segment[1] in component and segment[2] in component:
            candidates.update(source_refs[segment[0]])
    print('Main strongly connected component:',len(component),'eligible source nodes:',len(candidates),flush=True)
    del source_refs,base
    graph=build(importer,json.loads((ROOT/'src/world/data/cities-demo.json').read_text()),version,candidates=candidates)
    pairs=check_connections(graph,json.loads((ROOT/'src/world/data/cities-demo.json').read_text()))
    output=Path(args.output);output.mkdir(parents=True,exist_ok=True)
    raw=json.dumps(graph,ensure_ascii=False,separators=(',',':')).encode()
    compressed=gzip.compress(raw,mtime=0)
    (output/'graph.json.gz').write_bytes(compressed)
    (output/'border.json.gz').write_bytes(gzip.compress(Path(args.border).read_bytes(),mtime=0))
    summary={'version':graph['version'],'source':lock,'osmTimestamp':timestamp,
       'nodes':len(graph['nodes']),'ways':len(graph['ways']),'segments':len(graph['segments']),
       'directedEdges':sum(bool(s[5]&1)+bool(s[5]&2) for s in graph['segments']),
       'restrictions':len(graph['restrictions']),'snaps':graph['snaps'],'connections':pairs,
       'excluded':dict(importer.excluded),'jsonBytes':len(raw),'gzipBytes':len(compressed),'graphSha256':hashlib.sha256(compressed).hexdigest(),
       'generationSeconds':time.perf_counter()-started,
       'borderSha256':hashlib.sha256(Path(args.border).read_bytes()).hexdigest(),
       'license':'ODbL-1.0','attribution':'© OpenStreetMap contributors'}
    (output/'manifest.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(summary,ensure_ascii=False,indent=2))

if __name__=='__main__':main()
