import { describe, expect, it } from 'vitest';
import { createPreviewState, establishCompany, buyVan, hireDriver, refuelAtCity, dispatchTransport, advancePreview, repayLoan, type TransportRoute, type PreviewOffer } from './gameplay';
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
  s=advancePreview(s,H/2);expect(s.active?.phase).toBe('loaded');expect(s.company?.balanceGrosze).toBeLessThan(800000);
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
