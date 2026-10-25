import {it,expect} from 'vitest';
import {advancePreview,buyVan,createPreviewState,establishCompany,hireDriver,startEmptyTrip,type PreviewState,type TransportRoute} from './gameplay';
import {dispatchReadiness} from './dispatchReadiness';
import {tutorialStep} from './tutorial';
import {mapState,scheduleActivities} from './transport';
import {ensureMarket} from './market';
import data from '../../public/roads/preview/routes.json';
const routes=data as unknown as TransportRoute[];
const road={id:'osm-test',fromCityId:'K',toCityId:'T',meters:10000,seconds:600,geometry:[[19,50],[19.1,50]] as const};
const offer={id:'o',fromCityId:'K',toCityId:'T',cargo:'Książki',massKg:300,volumeM3:2,pallets:1,payoutGrosze:50000,expiresAt:86400000};
const ready=()=>hireDriver(buyVan(establishCompany(createPreviewState(21600000),'Test','K')));
it('reports actual blocking conditions independently and uses exact fuel requirement',()=>{
 const s=ready();expect(dispatchReadiness({...s,van:null},offer,[road])).toMatch(/Brak samochodu/);expect(dispatchReadiness({...s,driverHiredAt:null},offer,[road])).toMatch(/Brak zatrudnionego/);
 expect(dispatchReadiness(s,{...offer,massKg:1300},[road])).toMatch(/ładowność/);expect(dispatchReadiness(s,{...offer,volumeM3:13},[road])).toMatch(/m³/);expect(dispatchReadiness(s,{...offer,pallets:5},[road])).toMatch(/palet/);
 expect(dispatchReadiness({...s,van:{...s.van!,fuelMillilitres:1}},offer,[road])).toMatch(/paliwa/);expect(dispatchReadiness({...s,van:{...s.van!,cityId:'X'}},offer,[road])).toMatch(/załadunku/);expect(dispatchReadiness(s,offer,[road])).toBe('');
});
it('empty reposition drives real geometry, burns only empty fuel and never pays or completes a cargo job',()=>{
 const s=ready(),depart=startEmptyTrip(s,'T',[road]);expect(depart.active?.emptyOnly).toBe(true);expect(scheduleActivities(depart).map(a=>a.phase)).toEqual(['empty']);
 const midway=advancePreview(depart,s.time+300000);expect(mapState(midway,[road]).vehicle!.coordinates![0]).toBeCloseTo(19.05,2);
 const end=advancePreview(JSON.parse(JSON.stringify(midway)),s.time+600000);expect(end.active).toBeNull();expect(end.van!.cityId).toBe('T');expect(end.van!.fuelMillilitres).toBe(19000);expect(end.completedOfferIds).toEqual([]);expect(end.company!.balanceGrosze).toBe(s.company!.balanceGrosze);expect(end.events.some(e=>e.message.startsWith('Dostarczono'))).toBe(false);expect(scheduleActivities(end).at(-1)?.phase).toBe('waiting');
 expect(advancePreview(end,end.time)).toEqual(end);
});
it('tutorial derives steps from real saved actions, supports skipping and does not restart old saves',()=>{
 let s=establishCompany(createPreviewState(21600000),'Nowa','K');expect(tutorialStep(s)).toBe(1);s=buyVan(s);expect(tutorialStep(s)).toBe(2);s=hireDriver(s);expect(tutorialStep(s)).toBe(3);
 const orders={seed:1,sequence:1,offers:[],routes:[],orders:[{offer,acceptedAt:s.time,deadline:s.time+86400000,penaltyGrosze:0,penalized:false,completedAt:null}]};s={...s,market:orders};expect(tutorialStep(s)).toBe(4);expect(tutorialStep(s,true)).toBe(5);expect(tutorialStep(JSON.parse(JSON.stringify(s)))).toBe(4);expect(tutorialStep({...s,tutorial:{skipped:true,seenJourney:false}})).toBe(0);const {tutorial:_,...legacy}=s;expect(tutorialStep(legacy)).toBe(0);
});
it('migrates an old market once, preserves accepted prices/IDs and adds offers in every launched city',()=>{
 const current=ensureMarket({...ready(),company:{...ready().company!,baseCityId:routes[0].fromCityId}},routes);
 const old={...current,market:{...current.market!,routes:current.market!.routes.slice(0,5),offers:current.market!.offers.slice(0,10)}} as PreviewState;
 const restored=ensureMarket(old,routes);expect(restored.market!.seed).not.toBe(old.market!.seed);expect(restored.market!.offers[0]).toEqual(old.market!.offers[0]);expect(new Set(restored.market!.offers.map(o=>o.fromCityId)).size).toBe(17);expect(ensureMarket(restored,routes)).toBe(restored);
});
it('launches only the audited bidirectional component, including an actual Zakopane return',()=>{
 expect(routes).toHaveLength(135);expect(new Set(routes.flatMap(r=>[r.fromCityId,r.toCityId])).size).toBe(17);
 const back=routes.find(r=>r.fromCityId==='geonames:3080866'&&r.toCityId==='geonames:3094802')!;expect(back.meters).toBeGreaterThan(100000);expect(back.geometry.length).toBeGreaterThan(1000);expect(routes.some(r=>r.toCityId==='geonames:3089658')).toBe(false);
 for(const id of new Set(routes.map(r=>r.toCityId)))expect(routes.some(r=>r.fromCityId===id)).toBe(true);
});
