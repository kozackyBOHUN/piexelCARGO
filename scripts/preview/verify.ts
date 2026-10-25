/** Reproducible offline gate. Stops on an uncertain/illegal route, never exports it. */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {createNetwork,type RoadGraph} from '../../src/world/roads/model';
import {makeRoadRouter} from '../../src/world/roads/routing';
import {makeRouteAuditor} from './audit';
const compressed=readFileSync('public/roads/demo/graph.json.gz');
const manifest=JSON.parse(readFileSync('public/roads/demo/manifest.json','utf8'));
if(createHash('sha256').update(compressed).digest('hex')!==manifest.graphSha256)throw new Error('Graph SHA-256 mismatch');
const graph=JSON.parse(gunzipSync(compressed).toString('utf8')) as RoadGraph;
const network=createNetwork(graph),router=makeRoadRouter(network),audit=makeRouteAuditor(network,router.diagnostics);
const cities=JSON.parse(readFileSync('src/world/data/cities-demo.json','utf8')) as {id:string;name:string}[];
const pairs=[['Kraków','Tarnów'],['Kraków','Zakopane'],['Tarnów','Kraków'],['Zakopane','Kraków'],['Kraków','Bochnia'],['Bochnia','Kraków']];
const results:unknown[]=[],blockingIds=new Set<number>();let blocked=false;
for(const [from,to] of pairs){
 const a=cities.find(c=>c.name===from)!,b=cities.find(c=>c.name===to)!,start=performance.now();
 const result=router.findBetweenCities(a.id,b.id),calculationMs=performance.now()-start,route=result.route;
 if(!route)throw new Error(`No route ${from} → ${to}`);
 const check=audit(route),report={from,to,routeId:route.id,meters:route.meters,seconds:route.seconds,calculationMs,legs:route.legs.length,geometryPoints:route.geometry.length,...check};
 console.log(JSON.stringify(report));results.push(report);
 if(check.errors.length){check.unsupportedExposure.forEach(id=>blockingIds.add(id));blocked=true;break;}
}
const report={baseCommit:'fd234a10d7d0d13f62a5f47cfd8ebf33b9f776b4',graphVersion:graph.version,graphSha256:manifest.graphSha256,
 taskA:'Two forward routes pass topology, geometry and applicable restriction checks',previewExported:false,blocked,
 diagnostics:Object.fromEntries(Object.entries(router.diagnostics).map(([k,v])=>[k,v.length])),routes:results,
 blockers:graph.restrictions.filter(r=>blockingIds.has(r.id)),
 sourceConfirmation:{url:'https://download.geofabrik.de/europe/poland-261024.osm.pbf',sha256:'4d9f766c3e6cbdc4a333608a67058f617ac53c5e89707a606542b46f3ba546cb',osmTimestamp:'2026-10-24T20:20:51Z',note:'Read-only PyOsmium extraction confirmed the same incomplete members in the national source, not only the regional graph.'},
 process:{node:process.version,maxRssMiB:process.resourceUsage().maxRSS/1024,heapUsedMiB:process.memoryUsage().heapUsed/1048576}};
mkdirSync('docs/reports',{recursive:true});writeFileSync('docs/reports/05b-routing-check.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({blocked,diagnostics:report.diagnostics,blockers:report.blockers}));
if(blocked)process.exitCode=1;
