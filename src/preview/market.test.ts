import {describe,it,expect} from 'vitest';
import data from '../../public/roads/preview/routes.json';
import {createPreviewState,establishCompany,buyVan,hireDriver,advancePreview,type TransportRoute,type PreviewState} from './gameplay';
import {ensureMarket,acceptOrder,startOrder,cargoFits,GOODS,MARKET_CONFIG} from './market';
const routes=data as unknown as TransportRoute[],K='geonames:3094802',T='geonames:757026',D=86400000;
function ready(){return ensureMarket(hireDriver(buyVan(establishCompany(createPreviewState(0),'Rynek test',K))),routes)}
function fitting(s:PreviewState){return s.market!.offers.filter(o=>cargoFits(s,o)&&o.fromCityId===K&&o.toCityId===T)}
describe('persistent freight market',()=>{
 it('generates ten independent realistic dry-cargo profiles on approved routes only',()=>{
  const s=ready();expect(GOODS).toHaveLength(10);expect(new Set(s.market!.offers.map(o=>o.cargo)).size).toBe(10);
  for(const o of s.market!.offers){expect(routes.some(r=>r.fromCityId===o.fromCityId&&r.toCityId===o.toCityId)).toBe(true);expect(o.massKg).toBeGreaterThan(0);expect(o.volumeM3).toBeGreaterThan(0);expect(Number.isInteger(o.pallets)).toBe(true);expect(o.payoutGrosze).toBeGreaterThan(0);expect(o.expiresAt).toBe(5*D)}
  expect(s.market).toEqual(ready().market);expect(ensureMarket(JSON.parse(JSON.stringify(s)),routes)).toEqual(s);
 });
 it('expires at exactly five days and replenishes deterministically across time steps and reload',()=>{
  const s=ready(),id=s.market!.offers[0].id;
  expect(advancePreview(s,5*D-1).market!.offers.some(o=>o.id===id)).toBe(true);
  const coarse=advancePreview(s,10*D);let fine=s;
  for(let time=D;time<=10*D;time+=D)fine=advancePreview(JSON.parse(JSON.stringify(fine)),time);
  expect(coarse.market).toEqual(fine.market);expect(coarse.market!.offers).toHaveLength(s.market!.offers.length);
  expect(coarse.market!.offers.every(o=>o.expiresAt===15*D)).toBe(true);
 });
 it('rejects expired or oversize offers without mutating the market',()=>{
  const s=ready(),o=s.market!.offers[0];expect(()=>acceptOrder({...s,time:o.expiresAt},o.id)).toThrow(/wygasła/);
  const huge={...o,massKg:1201};expect(()=>acceptOrder({...s,market:{...s.market!,offers:[huge]}},o.id)).toThrow(/wielu kursów/);
  for(const change of [{volumeM3:13},{pallets:5}])expect(cargoFits(s,{...o,...change})).toBe(false);
 });
 it('reserves three jobs while driving, replaces public slots, rejects duplicate/fourth and lets player choose order',()=>{
  let s=ready();const offers=fitting(s).slice(0,3);expect(offers).toHaveLength(3);
  s=acceptOrder(s,offers[0].id);s=startOrder(s,offers[0].id,routes);
  s=acceptOrder(s,offers[1].id);s=acceptOrder(s,offers[2].id);
  expect(s.market!.orders).toHaveLength(3);expect(s.market!.offers).toHaveLength(ready().market!.offers.length);
  expect(()=>acceptOrder(s,offers[0].id)).toThrow();expect(()=>acceptOrder(s,fitting(s)[0].id)).toThrow(/Limit/);
  expect(()=>startOrder(s,offers[1].id,routes)).toThrow(/gotowa/);
  let manual=ready();manual=acceptOrder(manual,offers[0].id);manual=acceptOrder(manual,offers[1].id);manual=startOrder(manual,offers[1].id,routes);expect(manual.active!.offer.id).toBe(offers[1].id);
 });
 it('starts the three-day deadline at acceptance, charges half once, retains overdue order and pays full value once after delivery',()=>{
  let s=ready();const o=fitting(s)[0];s=acceptOrder(s,o.id);
  expect(s.market!.orders[0].deadline).toBe(MARKET_CONFIG.deliveryMs);
  s=advancePreview(s,3*D);expect(s.market!.orders[0].penalized).toBe(false);
  s=advancePreview(s,3*D+1);expect(s.market!.orders[0].penaltyGrosze).toBe(Math.round(o.payoutGrosze*.5));
  s=advancePreview(JSON.parse(JSON.stringify(s)),6*D);expect(s.market!.orders[0].completedAt).toBeNull();
  expect(s.events.filter(e=>e.message.startsWith('Kara'))).toHaveLength(1);
  s=startOrder(s,o.id,routes);s=advancePreview(s,s.time+4*3600000);
  expect(s.completedOfferIds).toEqual([o.id]);expect(s.market!.orders[0].completedAt).not.toBeNull();
  expect(s.events.filter(e=>e.message.startsWith('Dostarczono')).map(e=>e.changeGrosze)).toEqual([o.payoutGrosze]);
  s=advancePreview(JSON.parse(JSON.stringify(s)),s.time+D);expect(s.events.filter(e=>e.message.startsWith('Kara'))).toHaveLength(1);expect(s.events.filter(e=>e.message.startsWith('Dostarczono'))).toHaveLength(1);
 });
 it('delivery exactly on the deadline has no penalty, one millisecond late does',()=>{
  const initial=ready(),o=fitting(initial)[0];let s=acceptOrder(initial,o.id);
  const duration=1800000+Math.round(routes.find(r=>r.fromCityId===K&&r.toCityId===T)!.seconds*1000);
  s=advancePreview(s,3*D-duration);s=startOrder(s,o.id,routes);
  const exact=advancePreview(s,3*D+1);expect(exact.market!.orders[0].penalized).toBe(false);
  const late=advancePreview({...s,market:{...s.market!,orders:s.market!.orders.map(o=>({...o,deadline:o.deadline-1}))}},3*D+1);
  expect(late.market!.orders[0].penalized).toBe(true);
 });
 it('migrates a legacy in-flight save without restarting transport or fabricating earlier penalties',()=>{
  const s=ready(),o=fitting(s)[0];let active=acceptOrder(s,o.id);active=startOrder(active,o.id,routes);active=advancePreview(active,1000000);
  const {market:_,...legacy}=active;const migrated=ensureMarket(legacy,routes);
  expect(migrated.active).toEqual(active.active);expect(migrated.market!.orders[0].acceptedAt).toBe(active.active!.startedAt);
  expect(advancePreview(migrated,4*3600000).events.filter(e=>e.message.startsWith('Dostarczono'))).toHaveLength(1);
 });
});
