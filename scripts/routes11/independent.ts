import {combineAudit} from './partialAudit';
/** Final acceptance uses the original stage08 auditor unchanged, not the search's turn functions. */
import {readFileSync,writeFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createNetwork,type RoadGraph} from '../../src/world/roads/model';
import {restrictions,DEFAULT_VAN,type PlannedRoadRoute} from '../routes08/routing';
import {makeRouteAuditor} from '../routes08/audit';
const graph=JSON.parse(gunzipSync(readFileSync('public/roads/demo/graph.json.gz')).toString()) as RoadGraph;
graph.snaps=graph.snaps.map(s=>s.cityId==='geonames:3089658'?{...s,nodeId:599998162}:s);
const network=createNetwork(graph),audit=makeRouteAuditor(network,restrictions(graph,DEFAULT_VAN).diagnostics);
const routes=JSON.parse(readFileSync('/tmp/11-full-routes.json','utf8')) as PlannedRoadRoute[];
const result=[];for(const r of routes){const check=combineAudit(graph,r,audit(r));result.push({id:r.id,from:r.fromCityId,to:r.toCityId,...check});if(result.length%20===0)console.log('Original independent audit',result.length,'/',routes.length);}
writeFileSync('/tmp/11-independent-certificates.json',JSON.stringify(result));const failed=result.filter(r=>r.errors.length);console.log('Independent audit',result.length,'failed',failed.length);if(failed.length)process.exitCode=1;
