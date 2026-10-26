"""Read the cached matching PBF for missing safety tags/barriers; never generate road geometry."""
import osmium,json,hashlib,argparse
from pathlib import Path
parser=argparse.ArgumentParser();parser.add_argument('--pbf',default='/tmp/pixelcargo-roads/demo.osm.pbf');parser.add_argument('--output',default='/tmp/11-source-safety.json');args=parser.parse_args();src=Path(args.pbf)
expected='a0575a3f5bd99f190923818d79bbce882935809bf229792385392a9fa4262cbc'
assert hashlib.sha256(src.read_bytes()).hexdigest()==expected
keys={'access','vehicle','motor_vehicle','motorcar','goods','hgv','oneway','junction','impassable','smoothness','maxweight','maxheight','maxwidth','maxlength','maxaxleload','maxweightrating','maxgvweightrating','maxgcweightrating','maxgcweight','barrier','highway'}
class Safety(osmium.SimpleHandler):
 def __init__(self):super().__init__();self.ways={};self.nodes=[];self.relations=[]
 def way(self,w):
  tags={k:v for k,v in dict(w.tags).items() if k.split(':')[0] in keys or ':conditional' in k}
  if 'highway' in tags:self.ways[str(w.id)]=tags
 def node(self,n):
  tags=dict(n.tags)
  if any(k.split(':')[0] in keys-{'highway','junction','oneway','impassable','smoothness'} for k in tags):
   self.nodes.append({'id':n.id,'coordinates':[n.location.lon,n.location.lat],'tags':tags})
 def relation(self,r):
  if r.tags.get('type')=='restriction':self.relations.append({'id':r.id,'tags':dict(r.tags),'members':[[m.type,m.ref,m.role] for m in r.members]})
s=Safety();reader=osmium.io.Reader(str(src));osmium.apply(reader,osmium.filter.KeyFilter(*sorted(keys|{'type'})),s);reader.close();out={'sourceSha256':expected,'ways':s.ways,'nodes':s.nodes,'restrictions':s.relations}
Path(args.output).write_text(json.dumps(out,separators=(',',':')))
print('Source PBF safety metadata',len(s.ways),'ways',len(s.nodes),'nodes',len(s.relations),'restrictions')
