import { describe, expect, it } from 'vitest';
import previewRoutes from '../../public/roads/preview/routes.json';
import { createPreviewState, establishCompany, buyVan, buyUsedVan, listUsedVans, hireDriver, refuelAtCity, dispatchTransport, advancePreview, repayLoan, type TransportRoute, type PreviewOffer } from './gameplay';
const H = 3_600_000;
const route = (from: string, to: string, meters: number, seconds: number): TransportRoute => ({id:`osm:${from}:${to}`,fromCityId:from,toCityId:to,meters,seconds,geometry:[[19.93658,50.06143],[20.98698,50.01381]]});
const offer: PreviewOffer = {id:'job-001',fromCityId:'K',toCityId:'T',cargo:'książki',massKg:300,volumeM3:3,pallets:1,payoutGrosze:65000,expiresAt:5*24*H};
function ready(time=0){let s=createPreviewState(time);s=establishCompany(s,'Transport Test','K');s=buyVan(s);s=hireDriver(s);return s;}
describe('preview playable transport domain',()=>{
 it('takes loan openly, purchases single van and hires single driver',()=>{
  const s=ready();expect(s.company?.balanceGrosze).toBe(800000);expect(s.company?.debtGrosze).toBe(2000000);expect(s.van?.fuelMillilitres).toBe(20000);expect(()=>buyVan(s)).toThrow();expect(()=>hireDriver(s)).toThrow();
 });
 it('cannot depart with fictional route or overloaded cargo',()=>{
  const s=ready();expect(()=>dispatchTransport(s,offer,route('T','K',1000,100),route('K','T',1000,100))).toThrow(/trasy/);
  expect(()=>dispatchTransport(s,{...offer,massKg:1201},route('K','K',0,0),route('K','T',1000,100))).toThrow(/Ładunek/);
 });
 it('works across a full real-time simulation tick and pays once after delivery',()=>{
  let s=ready();s=dispatchTransport(s,offer,route('K','K',0,0),route('K','T',82810,3600));
  s=advancePreview(s,H/2);expect(s.active?.phase).toBe('loaded');expect(s.company?.balanceGrosze).toBe(800000);
  s=advancePreview(s,H+31*60_000);expect(s.active).toBeNull();expect(s.completedOfferIds).toContain('job-001');
  expect(s.van?.cityId).toBe('T');expect(s.van!.mileageMeters).toBeCloseTo(82810);const bank=s.company!.balanceGrosze;
  expect(advancePreview(s,s.time).company?.balanceGrosze).toBe(bank);
 });
 it('uses identical fuel for coarse and fine simulation increments',()=>{
  const run = (increment: number) => {
    let s=ready();
    const actualMeters=82810.25;
    s=dispatchTransport(s,offer,route('K','K',0,0),route('K','T',actualMeters,3600));
    const finishAt = 90 * 60_000;
    for(let time=increment;time<=finishAt;time+=increment)
      s=advancePreview(s,time);
    if (s.time < finishAt) s=advancePreview(s,finishAt);
    expect(s.active).toBeNull();
    return s;
  };
  const coarse=run(90 * 60_000);
  const fine=run(15_000);
  const expectedMl=Math.ceil(82810.25 * 0.12);
  expect(coarse.van!.fuelMillilitres).toBe(20_000-expectedMl);
  expect(fine.van!.fuelMillilitres).toBe(coarse.van!.fuelMillilitres);
  expect(fine.van!.mileageMeters).toBeCloseTo(coarse.van!.mileageMeters,6);
  expect(fine.company!.balanceGrosze).toBe(coarse.company!.balanceGrosze);
 });
 it('keeps real-route fuel, mileage and settlement identical across steps and a serialized mid-trip save',()=>{
  const real=previewRoutes.find(r=>r.fromCityId==='geonames:3094802'&&r.toCityId==='geonames:757026')! as unknown as TransportRoute;
  const start=6*H,finish=start+1_800_000+Math.round(real.seconds*1000);
  const job:PreviewOffer={...offer,fromCityId:real.fromCityId,toCityId:real.toCityId};
  const run=(increment:number)=>{
    let s=createPreviewState(start);s=establishCompany(s,'Fuel test',real.fromCityId);s=buyVan(s);s=hireDriver(s);
    s=dispatchTransport(s,job,{id:'stationary',fromCityId:real.fromCityId,toCityId:real.fromCityId,meters:0,seconds:0,geometry:[real.geometry[0]]},real);
    let serialized=false,minFuel=s.van!.fuelMillilitres;
    while(s.time<finish){
      s=advancePreview(s,Math.min(finish,s.time+increment));minFuel=Math.min(minFuel,s.van!.fuelMillilitres);
      if(!serialized&&s.active?.phase==='loaded'&&s.active.phaseProgressMs>100000){s=JSON.parse(JSON.stringify(s));serialized=true;}
    }
    expect(s.active).toBeNull();expect(s.completedOfferIds).toEqual([job.id]);expect(minFuel).toBeGreaterThanOrEqual(0);
    expect(s.events.filter(e=>e.message.startsWith('Dostarczono'))).toHaveLength(1);
    expect(advancePreview(JSON.parse(JSON.stringify(s)),finish)).toEqual(s);
    return s;
  };
  const baseline=run(finish-start);
  expect(baseline.van!.fuelMillilitres).toBe(20000-Math.ceil(real.meters*.12));
  for(const increment of [15000,1000,250,17003]){
    const fine=run(increment);
    expect(fine.van!.fuelMillilitres).toBe(baseline.van!.fuelMillilitres);
    expect(fine.van!.mileageMeters).toBeCloseTo(baseline.van!.mileageMeters,6);
    expect(fine.company!.balanceGrosze).toBe(baseline.company!.balanceGrosze);
    expect(fine.paidWagesGrosze).toBe(baseline.paidWagesGrosze);
  }
 });
 it('pays the driver exactly every completed game hour, including after restoring a save',()=>{
  const hire=6*H+17*60_000;
  let s=ready(hire);
  const initial=s.company!.balanceGrosze;
  s=advancePreview(s,hire+H-1);
  expect(s.company!.balanceGrosze).toBe(initial);
  expect(s.events.filter(e=>e.message.startsWith('Pensja'))).toHaveLength(0);
  s=advancePreview(JSON.parse(JSON.stringify(s)),hire+H);
  expect(s.company!.balanceGrosze).toBe(initial-2500);
  expect(s.events.filter(e=>e.message.startsWith('Pensja'))).toHaveLength(1);
  s=advancePreview(s,hire+H+1);
  expect(s.company!.balanceGrosze).toBe(initial-2500);
  s=advancePreview(JSON.parse(JSON.stringify(s)),hire+4*H);
  expect(s.company!.balanceGrosze).toBe(initial-4*2500);
  expect(s.events.filter(e=>e.message.startsWith('Pensja'))).toHaveLength(4);
 });
 it('seeds five varied used vans and preserves listing and chosen specs',()=>{
   let s=createPreviewState(0);
   s=establishCompany(s,'Kozacky Cargo','K');
   const market=listUsedVans(s);
   expect(market).toHaveLength(5);
   expect(market.every(v=>v.priceGrosze>=500000)).toBe(true);
   expect(new Set(market.map(v=>v.priceGrosze)).size).toBe(5);
   expect(new Set(market.map(v=>v.mileageMeters)).size).toBe(5);
   expect(listUsedVans(JSON.parse(JSON.stringify(s)))).toEqual(market);
   const affordable=market.find(v=>v.priceGrosze<=s.company!.balanceGrosze)!;
   const remaining=s.company!.balanceGrosze-affordable.priceGrosze;
   s=buyUsedVan(s,affordable.id);
   expect(s.company!.balanceGrosze).toBe(remaining);
   expect(s.van?.specs?.id).toBe(affordable.id);
   expect(s.van?.mileageMeters).toBe(affordable.mileageMeters);
   expect(listUsedVans(s)).toHaveLength(4);
   expect(()=>buyUsedVan(s,market[1].id)).toThrow(/jed(en|nym) pojazd|mieści/);
 });
 it('charges daily interest only once and supports manual debt repayment',()=>{
  const s=ready();const t=advancePreview(s,24*H);expect(t.company?.debtGrosze).toBe(2000000);
  expect(t.events.filter(e=>e.message.startsWith('Odsetki'))).toHaveLength(1);
  const reduced=repayLoan(t);expect(reduced.company?.debtGrosze).toBe(1900000);
 });
 it('blocks unsupported fuel loads, expiry, repeated jobs and bad clock',()=>{
  const s=ready();expect(()=>refuelAtCity(s,70)).toThrow();expect(()=>advancePreview(s,-1)).toThrow();
  expect(()=>dispatchTransport(s,{...offer,expiresAt:0},route('K','K',0,0),route('K','T',1000,100))).toThrow(/niedostępna/);
 });
});
