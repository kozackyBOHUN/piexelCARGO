import {it,expect,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {preferredRoutes,loadPreferredRoutes,type Catalog11} from './preferredRoutes11';
import {ensureMarket,acceptOrder,startOrder} from './market';
import {createPreviewState,establishCompany,buyVan,hireDriver,advancePreview,refuelAtCity,startEmptyTrip,phaseDuration,type PreviewState,type TransportRoute} from './gameplay';
const raw=readFileSync('public/roads/preferred/catalog.json'),catalog=JSON.parse(raw.toString()) as Catalog11,manifest=JSON.parse(readFileSync('public/roads/preferred/manifest.json','utf8')),report=JSON.parse(readFileSync('docs/reports/11-route-acceptance.json','utf8'));
const routes=preferredRoutes(catalog),old=JSON.parse(readFileSync('public/roads/preview/routes.json','utf8')),priority=JSON.parse(readFileSync('docs/etap11/priority_route_baselines.json','utf8'));
const K='geonames:3094802',G='geonames:771804';
it('accepts exactly 342 source-certified routes over 19 cities, including 36 Gorlice and 36 Oświęcim directions',()=>{
 expect(routes).toHaveLength(342);expect(report.unresolved).toEqual([]);expect(report.independent_audited_count).toBe(342);expect(new Set(routes.map(r=>r.fromCityId)).size).toBe(19);expect(routes.filter(r=>[r.fromCityId,r.toCityId].includes(G))).toHaveLength(36);expect(report.oswiecim_inbound_outbound).toBe(36);
 expect(createHash('sha256').update(raw).digest('hex')).toBe(manifest.catalogSha256);expect(report.route_catalog_sha256).toBe(manifest.catalogSha256);expect(report.source_safety_archive_sha256).toBe(createHash('sha256').update(readFileSync('data/sources/etap11-safety.json.gz')).digest('hex'));
 for(const r of routes){const c=report.certificates.find((c:any)=>c.id===r.id);expect(c.audit.passed).toBe(true);expect(c.pbfSafety.passed).toBe(true);expect(c.pbfSafety.errors).toEqual([]);expect(c.audit.errors).toEqual([]);expect(c.referencePassed).toBe(true);expect(c.stretch).toBeLessThanOrEqual(1.05);expect(c.edgeIdsSha256).toBe(createHash('sha256').update(JSON.stringify(c.edgeIds)).digest('hex'));expect(c.geometrySha256).toBe(createHash('sha256').update(JSON.stringify(r.geometry)).digest('hex'));expect(r.geometry.length).toBeGreaterThan(2)}
});
it('improves or equals all 135 certified 08 routes and all 12 priority directions',()=>{
 for(const before of old){const r=routes.find(r=>r.fromCityId===before.fromCityId&&r.toCityId===before.toCityId)!;expect(r.meters).toBeLessThanOrEqual(before.meters+.06)}
 for(const p of priority){const before=old.find((r:any)=>r.fromCityId===p.fromCityId&&r.toCityId===p.toCityId)!;expect(before).toBeDefined();expect(routes.find(r=>r.fromCityId===p.fromCityId&&r.toCityId===p.toCityId)!.meters).toBeLessThanOrEqual(before.meters+.06)}
 expect(routes.find(r=>r.fromCityId===K&&r.toCityId==='geonames:755889')!.meters).toBeLessThan(14200);
});
it('does not overwrite a saved active old route, its fuel, progress or accepted price when updating market metadata',()=>{
 const original=old.find((r:any)=>r.fromCityId===K&&r.toCityId==='geonames:757026');let s=ensureMarket(hireDriver(buyVan(establishCompany(createPreviewState(21600000),'Stary kurs',K))),[original]);const o=s.market!.offers[0];s=acceptOrder(s,o.id);s=startOrder(s,o.id,[original]);s=advancePreview(s,s.time+1000000);
 const saved:PreviewState=JSON.parse(JSON.stringify(s)),updated=ensureMarket(saved,routes);expect(updated.active).toEqual(saved.active);expect(updated.van).toEqual(saved.van);expect(updated.market!.orders[0].offer.payoutGrosze).toBe(saved.market!.orders[0].offer.payoutGrosze);
});
it('delivers and returns from every one of 19 cities over real approved routes, with one settlement',()=>{
 for(const city of new Set(routes.map(r=>r.fromCityId))){const target=city===K?G:K;const outward=routes.find(r=>r.fromCityId===city&&r.toCityId===target)!,back=routes.find(r=>r.fromCityId===target&&r.toCityId===city)!;
  let s=hireDriver(buyVan(establishCompany(createPreviewState(21600000),'Miasto '+city,city)));s=refuelAtCity(s,60);s=advancePreview(s,s.time+900000);s=ensureMarket(s,[outward,back]);const offer={...s.market!.offers[0],fromCityId:city,toCityId:target,massKg:50,volumeM3:.5,pallets:0,units:{kind:'karton' as const,count:10}};s={...s,market:{...s.market!,offers:[offer]}};s=acceptOrder(s,offer.id);s=startOrder(s,offer.id,[outward,back]);s=advancePreview(s,s.time+Math.round(outward.seconds*1000)+1800000);expect(s.active).toBeNull();expect(s.van!.cityId).toBe(target);expect(s.events.filter(e=>e.message.startsWith('Dostarczono')&&e.changeGrosze>0)).toHaveLength(1);
  s=startEmptyTrip(s,city,[outward,back]);s=advancePreview(JSON.parse(JSON.stringify(s)),s.time+Math.round(back.seconds*1000));expect(s.active).toBeNull();expect(s.van!.cityId).toBe(city);expect(s.van!.fuelMillilitres).toBeGreaterThanOrEqual(0);expect(s.events.filter(e=>e.message.startsWith('Dostarczono')&&e.changeGrosze>0)).toHaveLength(1);
 }
});
it('validates cache version and fails closed on a stale/tampered catalog',async()=>{
 vi.stubGlobal('fetch',vi.fn(async(url:string,options:any)=>{expect(options.cache).toBe('no-store');return url.endsWith('manifest.json')?{ok:true,json:async()=>manifest}:{ok:true,arrayBuffer:async()=>new Uint8Array(raw).buffer}}));
 try{expect(await loadPreferredRoutes('/piexelCARGO/')).toHaveLength(342);expect(vi.mocked(fetch).mock.calls[1][0]).toContain(manifest.catalogSha256)}finally{vi.unstubAllGlobals()}
 vi.stubGlobal('fetch',vi.fn(async(url:string)=>url.endsWith('manifest.json')?{ok:true,json:async()=>manifest}:{ok:true,arrayBuffer:async()=>new TextEncoder().encode('{}').buffer}));try{await expect(loadPreferredRoutes('/')).rejects.toThrow(/wersja/)}finally{vi.unstubAllGlobals()}
});
