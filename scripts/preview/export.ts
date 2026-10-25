/** Export only audited paths. No OSM regeneration and no browser routing dependency. */
import {readFileSync,writeFileSync,mkdirSync,renameSync} from 'node:fs';
import {gunzipSync,gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {createNetwork,type RoadGraph} from '../../src/world/roads/model';
import {makeRoadRouter,type PlannedRoadRoute} from '../../src/world/roads/routing';
import {makeRouteAuditor} from './audit';
// Exact structural contract: feat/preview-gameplay-core, gameplay.ts at f09d861.
interface TransportRoute {
 readonly id:string;readonly fromCityId:string;readonly toCityId:string;
 readonly meters:number;readonly seconds:number;readonly geometry:readonly (readonly [number,number])[];
}
const compressed=readFileSync('public/roads/demo/graph.json.gz');
const manifest=JSON.parse(readFileSync('public/roads/demo/manifest.json','utf8'));
if(createHash('sha256').update(compressed).digest('hex')!==manifest.graphSha256)throw new Error('Graph SHA-256 mismatch');
const graph=JSON.parse(gunzipSync(compressed).toString('utf8')) as RoadGraph;
const network=createNetwork(graph),router=makeRoadRouter(network),audit=makeRouteAuditor(network,router.diagnostics);
const cities=JSON.parse(readFileSync('src/world/data/cities-demo.json','utf8')) as {id:string;name:string}[];
const pairs=[['Kraków','Tarnów'],['Tarnów','Kraków'],['Kraków','Zakopane'],['Kraków','Bochnia'],['Bochnia','Kraków']];
const accepted:TransportRoute[]=[],originals:PlannedRoadRoute[]=[],reports:unknown[]=[];
const skipped:{from:string;to:string;reason:string;restrictionIds?:number[]}[]=[{
 from:'Zakopane',to:'Kraków',reason:'Direction intentionally omitted: prior audit found incomplete OSM relations; no assumption about missing members.',restrictionIds:[16545970,16545971],
}];
for(const [from,to] of pairs){
 const a=cities.find(c=>c.name===from)!,b=cities.find(c=>c.name===to)!,result=router.findBetweenCities(a.id,b.id),route=result.route;
 if(!route){skipped.push({from,to,reason:'No route found'});continue}
 const check=audit(route);
 if(check.errors.length){skipped.push({from,to,reason:check.errors.join('; '),restrictionIds:check.unsupportedExposure});console.log(JSON.stringify({from,to,skipped:check.errors}));continue}
 const exported:TransportRoute={id:route.id,fromCityId:a.id,toCityId:b.id,meters:route.meters,seconds:route.seconds,geometry:route.geometry};
 accepted.push(exported);originals.push(route);
 reports.push({from,to,id:route.id,fromCityId:a.id,toCityId:b.id,meters:route.meters,seconds:route.seconds,geometryPoints:route.geometry.length,...check});
 console.log(JSON.stringify({from,to,meters:route.meters,seconds:route.seconds,geometryPoints:route.geometry.length,verified:true}));
}
if(!accepted.length)throw new Error('No verified route: refusing to export');
// Minification only. No rounding, simplification, inferred members or straight connectors.
const text=JSON.stringify(accepted)+'\n',decoded:TransportRoute[]=JSON.parse(text);
const required=['fromCityId','geometry','id','meters','seconds','toCityId'];const ids=new Set<string>(),directions=new Set<string>();
for(let i=0;i<decoded.length;i++){
 const route=decoded[i],source=originals[i];
 if(JSON.stringify(Object.keys(route).sort())!==JSON.stringify(required)||!route.id||ids.has(route.id)||directions.has(`${route.fromCityId}:${route.toCityId}`))throw new Error('Invalid TransportRoute keys/IDs');
 if(!Number.isFinite(route.meters)||route.meters<=0||!Number.isFinite(route.seconds)||route.seconds<=0||route.geometry.length<2)throw new Error('Invalid length/time/geometry');
 if(!route.geometry.every(p=>p.length===2&&p.every(Number.isFinite)&&p[0]>=-180&&p[0]<=180&&p[1]>=-90&&p[1]<=90))throw new Error('Invalid WGS84 point');
 if(JSON.stringify(route.geometry)!==JSON.stringify(source.geometry)||route.meters!==source.meters||route.seconds!==source.seconds||route.fromCityId!==source.fromCityId||route.toCityId!==source.toCityId)throw new Error('Export changed original geometry/direction/totals');
 const rechecked=audit({...source,...route});if(rechecked.errors.length)throw new Error(rechecked.errors.join('; '));
 ids.add(route.id);directions.add(`${route.fromCityId}:${route.toCityId}`);
}
mkdirSync('public/roads/preview',{recursive:true});mkdirSync('docs/reports',{recursive:true});
writeFileSync('public/roads/preview/routes.json.tmp',text);renameSync('public/roads/preview/routes.json.tmp','public/roads/preview/routes.json');
const report={format:'TransportRoute[]',routingBaseCommit:'6fe984e6e5b554bd90689ebf9cfa1eb1104d2844',consumerCommit:'f09d86100e187feaed5d37b7531a132316109bc7',
 graphVersion:graph.version,graphSha256:manifest.graphSha256,source:manifest.source.resolvedUrl,osmTimestamp:manifest.osmTimestamp,
 license:'ODbL-1.0',attribution:'© OpenStreetMap contributors',profileId:'van-default-v1',geometrySimplification:false,
 bytes:Buffer.byteLength(text),gzipBytes:gzipSync(text).length,sha256:createHash('sha256').update(text).digest('hex'),routes:reports,skipped};
writeFileSync('docs/reports/05b-preview-export.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({exported:accepted.length,bytes:report.bytes,gzipBytes:report.gzipBytes,sha256:report.sha256,skipped}));
