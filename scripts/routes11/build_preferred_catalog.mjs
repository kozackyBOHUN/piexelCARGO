/**
 * PixelCargo Route Recovery 11: prefer the shortest *previously audited* route.
 * Only consumes artifacts from the checked-out PixelCargo project and the optional
 * newly audited stage11 alternatives. Never uses original unverified candidates.
 *
 * Examples:
 * node scripts/build_preferred_catalog.mjs --project /workspace/piexelCARGO --strict19
 * node scripts/build_preferred_catalog.mjs --project . --allow-18-regression-fix
 */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,join,dirname} from 'node:path';
import {createHash} from 'node:crypto';
const args=process.argv.slice(2);
const opt=(flag,otherwise)=>{const i=args.indexOf(flag);return i===-1?otherwise:args[i+1]};
const cwd=resolve(opt('--project','.'));
const partial=args.includes('--allow-18-regression-fix');
const strict19=args.includes('--strict19')||!partial;
const read=(p)=>JSON.parse(readFileSync(join(cwd,p),'utf8'));
const cityFile='src/world/data/cities-demo.json';
const cities=read(cityFile), names=new Map(cities.map(c=>[c.id,c.name]));
const assert=(v,msg)=>{if(!v)throw Error(`CHECK FAILED: ${msg}`)};
assert(cities.length===19&&names.size===19,'expected exact set of 19 seats');
const graphSHA='e67a4d18e39c2894edcab59e7ef776a01ce0d6251a00618ff7b262d330e42c9f';
const fileHash=createHash('sha256').update(readFileSync(join(cwd,'public/roads/demo/graph.json.gz'))).digest('hex');
assert(fileHash===graphSHA,'underlying OSM graph snapshot changed - regenerate and re-audit all routes');
const r8=read('docs/reports/08-routes.json'),r9=read('docs/reports/09-routes.json');
assert(r8.graphSha256===graphSHA,'08 report graph mismatch');
assert(r8.verified.length===135,'08 must certify exactly 135 pairs');
assert(r9.routeCount===306&&r9.routes.length===306&&r9.accepted===75,'09 audit requirements failed');
assert(r9.cities.length===18&&!r9.cities.includes('geonames:771804'),'09 source expected to exclude Gorlice');
const preview=read('public/roads/preview/routes.json');
const links=read('public/roads/county/links.json');
const certifiedOld=new Map(r8.verified.map(x=>[x.id,x]));
const certified9=new Map(links.map(x=>[x.id,x]));
assert(preview.length===135&&new Set(preview.map(x=>x.id)).size===135,'08 repo catalog mismatch');
assert(links.length===75&&certified9.size===75,'09 links catalog mismatch');
const tolerance=.06; // 6cm for float formatting / accumulated distances
const close=(a,b)=>Math.abs(a-b)<tolerance;
const key=(a,b)=>a+'|'+b;
const pair=x=>key(x.fromCityId,x.toCityId);
const finite=x=>Number.isFinite(x)&&x>=0;
function valid(r,label){
 assert(r&&typeof r.id==='string'&&r.id.length>0,`${label}: id`);
 assert(names.has(r.fromCityId)&&names.has(r.toCityId),`${label}: unknown city`);
 assert(r.fromCityId!==r.toCityId,`${label}: same-city pair`);
 assert(finite(r.meters)&&finite(r.seconds),`${label}: nonnumeric distance/duration`);
 assert(Array.isArray(r.geometry)&&r.geometry.length>=2,`${label}: missing actual OSM geometry`);
 for(const p of [r.geometry[0],r.geometry.at(-1)]) assert(Array.isArray(p)&&p.length===2&&p.every(Number.isFinite),`${label}: invalid geometry endpoint`);
}
const byPair=new Map(), oldByPair=new Map(), sourceCounts={stage08:0,stage09:0,stage11:0};
function put(r,src){valid(r,src);const k=pair(r), cur=byPair.get(k);sourceCounts[src]++;
 if(!cur||r.meters<cur.meters-1e-7)byPair.set(k,{...r,provenance:src});
}
for(const r of preview){
 const a=certifiedOld.get(r.id);assert(a,`Stage08 route ${r.id} not certified`);
 assert(a.fromCityId===r.fromCityId&&a.toCityId===r.toCityId&&close(a.meters,r.meters),`Stage08 certificate mismatch: ${r.id}`);
 const k=pair(r);assert(!oldByPair.has(k),'duplicated stage08 pair');oldByPair.set(k,r);
 put(r,'stage08');
}
assert(oldByPair.size===135,'not all 08 pairs accounted for');
// Stage09's full 306 route CHAIN was independently audited including junctions.
// It is important NOT to run a naive Dijkstra of 75 links here: that can violate
// via-way restrictions at concatenation points.
const p9=new Set();
for(const r of r9.routes){
 assert(Array.isArray(r.segmentIds)&&r.segmentIds.length>0,'stage09 route missing approved chain');
 assert(!p9.has(pair(r)),'09 duplicate pair');p9.add(pair(r));
 let geometry=[],metres=0,seconds=0;
 for(const id of r.segmentIds){
  const leg=certified9.get(id);assert(leg,`stage09 route contains non-audited link: ${id}`);
  valid(leg,'stage09 link');metres+=leg.meters;seconds+=leg.seconds;
  if(geometry.length){
   const a=geometry.at(-1),b=leg.geometry[0];
   assert(a[0]===b[0]&&a[1]===b[1],`geometry discontinuity in ${pair(r)} around ${id}`);
   geometry.push(...leg.geometry.slice(1));
  }else geometry=[...leg.geometry];
 }
 assert(close(metres,r.meters)&&close(seconds,r.seconds),`reconstructed 09 chain does not match audited length ${pair(r)}`);
 const full={id:`preferred09:${r.segmentIds.join('+')}`,fromCityId:r.fromCityId,toCityId:r.toCityId,meters:metres,seconds,geometry};
 put(full,'stage09');
}
assert(p9.size===306,'09 must have all 306 ordered pair routes');
// If FULL Gorlice reachability is requested, import ONLY externally audited 11
// alternatives, verified with an independent edge/turn auditor and evidence hash.
const extraPath=opt('--audited11',null);
if(extraPath){
 const meta=JSON.parse(readFileSync(resolve(extraPath),'utf8'));
 assert(meta.graphSha256===graphSHA,'11 audit OSM checksum does not match');
 assert(meta.auditor==='verify-routes08-independent','11 alternatives require independently checked auditor');
 assert(Array.isArray(meta.routes)&&meta.routes.length>0,'11 audit does not contain verified routes');
 for(const x of meta.routes){
   assert(x.audit?.passed===true&&x.audit?.errors?.length===0,`unverified stage11 item ${x.id}`);
   valid(x,'stage11 certified path');put({id:x.id,fromCityId:x.fromCityId,toCityId:x.toCityId,meters:x.meters,seconds:x.seconds,geometry:x.geometry},'stage11');
 }
}
const ids=[...names.keys()], all=[];let missing=[];
for(const a of ids)for(const b of ids){if(a===b)continue;const r=byPair.get(key(a,b));if(!r){missing.push({fromCityId:a,toCityId:b,from:names.get(a),to:names.get(b)});continue}
 const before=oldByPair.get(key(a,b));
 assert(!before||r.meters<=before.meters+.06,`regression: ${names.get(a)} -> ${names.get(b)}`);
 all.push(r);
}
const stats={citiesTotal:19,orderedPairsRequired:342,orderedPairsSelected:all.length,missingCount:missing.length,available18:all.filter(r=>r.fromCityId!=='geonames:771804'&&r.toCityId!=='geonames:771804').length,sourcesSelected:Object.fromEntries(['stage08','stage09','stage11'].map(s=>[s,all.filter(r=>r.provenance===s).length])),sourceCandidates:sourceCounts,missing};
const directory=join(cwd,'tmp','route-recovery11');mkdirSync(directory,{recursive:true});
const save=(name,value)=>writeFileSync(join(directory,name),JSON.stringify(value,null,2)+'\n');
save('selection-report.json',stats);save('selected-routes.json',all);
console.log(`RECOVERY-11: ${stats.orderedPairsSelected}/342, 18-city coverage ${stats.available18}/306, certified old ${stats.sourcesSelected.stage08}, county ${stats.sourcesSelected.stage09}, 11 ${stats.sourcesSelected.stage11}`);
console.log(`REPORT: ${join(directory,'selection-report.json')}`);
if(strict19)assert(missing.length===0,`${missing.length} origin-destination pairs not certified. DO NOT RELEASE 19-city game; fix Gorlice using audited OSM graph.`);
else assert(stats.available18===306&&missing.length===36,'18-city regression repair expected exact gap of 36 Gorlice pairs');
console.log('PASS: all selected routes are from independently audited stage08/09 certificates (and optionally 11).');
