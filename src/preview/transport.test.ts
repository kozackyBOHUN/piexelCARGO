import {describe,it,expect} from 'vitest';
import {pointOnRoute,mapState,scheduleActivities} from './transport';
import {createPreviewState,establishCompany,buyVan,hireDriver,dispatchTransport,advancePreview} from './gameplay';
const road={id:'source',fromCityId:'K',toCityId:'T',meters:1000,seconds:60,geometry:[[19,50],[19.01,50],[19.02,50]] as const};
function active(){let s=hireDriver(buyVan(establishCompany(createPreviewState(21600000),'Test','K')));return dispatchTransport(s,{id:'job',fromCityId:'K',toCityId:'T',cargo:'Książki',massKg:100,volumeM3:1,pallets:0,payoutGrosze:50000,expiresAt:86400000},{id:'park',fromCityId:'K',toCityId:'K',meters:0,seconds:0,geometry:[road.geometry[0]]},road)}
describe('actual transport presentation',()=>{
 it('samples the real polyline by distance and clamps endpoints',()=>{
  expect(pointOnRoute(road,0)).toEqual(road.geometry[0]);expect(pointOnRoute(road,1)).toEqual(road.geometry[2]);
  expect(pointOnRoute(road,.5)[0]).toBeCloseTo(19.01,8);expect(pointOnRoute(road,.5)[1]).toBe(50);
 });
 it('shows exact planned times and keeps vehicle at the destination after delivery and reload',()=>{
  const start=active(),plan=scheduleActivities(start);expect(plan.map(a=>a.phase)).toEqual(['empty','loading','loaded','unloading']);
  expect(plan.map(a=>a.end-a.start)).toEqual([0,900000,60000,900000]);
  const driving=advancePreview(start,start.time+930000);const marker=mapState(driving,[road]).vehicle!;
  expect(marker.status).toBe('Jazda z ładunkiem');expect(marker.coordinates![0]).toBeCloseTo(19.01,8);
  const end=advancePreview(driving,start.time+1860000+60000);const restored=JSON.parse(JSON.stringify(end));
  expect(mapState(restored,[road]).vehicle!.coordinates).toEqual(road.geometry[2]);
  const completed=scheduleActivities(restored);expect(completed.at(-1)?.phase).toBe('waiting');expect(completed.at(-1)!.end-completed.at(-1)!.start).toBe(60000);
  expect(restored.lastTransport.completedAt).toBe(start.time+1860000);
 });
});
