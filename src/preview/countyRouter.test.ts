import {describe,it,expect,vi} from 'vitest';
import links from '../../public/roads/county/links.json';
import network from '../../public/roads/county/network.json';
import report from '../../docs/reports/09-routes.json';
import legacy from '../../public/roads/preview/routes.json';
import {loadGameRoutes,makeCountyRouter,type CountyLink} from './countyRouter';
describe('09 certified county network',()=>{
 const router=makeCountyRouter(links as unknown as CountyLink[],network),catalog=router.catalog();
 it('activates only 75 independently audited directional links and all 306 legal composed pairs',()=>{
  expect(links).toHaveLength(75);expect(report.accepted).toBe(75);expect(report.rejected).toHaveLength(11);expect(report.failed).toEqual([]);expect(catalog).toHaveLength(306);
  expect(new Set(catalog.map(r=>r.fromCityId)).size).toBe(18);
  for(const r of links){expect(r.geometry.length).toBeGreaterThan(2);expect(r.meters).toBeGreaterThan(0);expect(r.seconds).toBeGreaterThan(0);expect(report.rejected.some(x=>x.id===r.id)).toBe(false)}
 });
 it('matches the independently audited shortest stateful chains, with exact geographic joins and sums',()=>{
  for(const cert of report.routes){const r=router.routeBetween(cert.fromCityId,cert.toCityId)!;
   expect(r.id).toBe(`county:${cert.segmentIds.join('+')}`);expect(r.meters).toBeCloseTo(cert.meters,4);expect(r.seconds).toBeCloseTo(cert.seconds,4);
   const legs=cert.segmentIds.map(id=>links.find(l=>l.id===id)!);expect(r.geometry[0]).toEqual(legs[0].geometry[0]);expect(r.geometry.at(-1)).toEqual(legs.at(-1)!.geometry.at(-1));
   for(let i=1;i<legs.length;i++){expect(legs[i].fromCityId).toBe(legs[i-1].toCityId);expect(legs[i].geometry[0]).toEqual(legs[i-1].geometry.at(-1))}
   expect(r.geometry.length).toBe(legs.reduce((n,l)=>n+l.geometry.length,0)-legs.length+1);
  }
  expect(report.routes.some(r=>r.segmentIds.length>=4)).toBe(true);
 });
 it('validates Oświęcim through the proposed actual road node and excludes Gorlice',()=>{
  expect(network.snapOverride.nodeId).toBe(599998162);expect(router.routeBetween('geonames:3094802','geonames:3089658')).not.toBeNull();
  expect(router.routeBetween('geonames:3094802','geonames:771804')).toBeNull();expect(report.gorlice).toBe('disabled');
 });
 it('retains all previous 135 approved directions as a separate fallback, and covers their cities',()=>{
  expect(legacy).toHaveLength(135);for(const r of legacy)expect(router.routeBetween(r.fromCityId,r.toCityId)).not.toBeNull();
 });
 it('rejects corrupted automaton transitions rather than inventing a road',()=>{
  expect(()=>makeCountyRouter(links as unknown as CountyLink[],{...network,transitions:[[{linkId:'unknown',to:0}],...network.transitions.slice(1)]})).toThrow();
 });
});

it('loads the unchanged approved fallback when county assets are unavailable, without requesting a full graph',async()=>{
 const calls:string[]=[];vi.stubGlobal('fetch',vi.fn(async(url:string)=>{calls.push(url);return url.endsWith('/preview/routes.json')?{ok:true,json:async()=>legacy}:{ok:false}}));
 try{expect(await loadGameRoutes('/piexelCARGO/')).toEqual(legacy);expect(calls).toEqual(['/piexelCARGO/roads/county/links.json','/piexelCARGO/roads/county/network.json','/piexelCARGO/roads/preview/routes.json']);expect(calls.some(p=>p.includes('graph'))).toBe(false)}finally{vi.unstubAllGlobals()}
});
