import {simulatePreview,beginCityFuel} from './simulation09';
import type {DriverState,PlannedStop,ServicePause,ActivityRecord} from './mechanics09';
import {dispatchReadiness} from './dispatchReadiness';
import {refreshMarket,type FreightMarket} from './market';
/** Independent, deterministic preview domain. No React, global timers, APIs or implicit simulation. */
export type Grosze = number;
export type GameMs = number;
export type Phase = 'empty' | 'loading' | 'loaded' | 'unloading';

export interface TransportRoute {
  readonly id: string;
  readonly fromCityId: string;
  readonly toCityId: string;
  readonly meters: number;
  readonly seconds: number;
  /** Real OSM polyline. Never substitute a straight-line connection. */
  readonly geometry: readonly (readonly [number, number])[];
}
export interface PreviewOffer {
  readonly id: string;
  readonly fromCityId: string;
  readonly toCityId: string;
  readonly cargo: string;
  readonly massKg: number;
  readonly volumeM3: number;
  readonly pallets: number;
  readonly payoutGrosze: Grosze;
  readonly expiresAt: GameMs;
}
export interface ActiveTransport {
  readonly offer: PreviewOffer;
  readonly routeEmpty: TransportRoute;
  readonly routeLoaded: TransportRoute;
  readonly startedAt: GameMs;
  readonly phase: Phase;
  readonly phaseProgressMs: number;
  readonly emptyOnly?:boolean;
}
export interface RecordedPlan {readonly start:number;readonly end:number;readonly phases:readonly {phase:Phase;durationMs:number}[]}
export function recordedPlan(job:ActiveTransport,end:number):RecordedPlan {return {start:job.startedAt,end,phases:(job.emptyOnly?['empty'] as const:['empty','loading','loaded','unloading'] as const).map(phase=>({phase,durationMs:phaseDuration({...job,phase})}))}}
export interface CompletedTransport extends ActiveTransport {
  readonly completedAt: GameMs;
}
export interface PreviewCompany {
  readonly name: string;
  readonly baseCityId: string;
  readonly balanceGrosze: Grosze;
  readonly debtGrosze: Grosze;
}
export interface UsedVanOffer {
  readonly id: string;
  readonly model: string;
  readonly priceGrosze: number;
  readonly mileageMeters: number;
  readonly conditionPercent: number;
  readonly engineLitres: number;
  readonly horsepower: number;
  readonly engine: 'diesel';
  readonly capacityKg: number;
  readonly volumeM3: number;
  readonly pallets: number;
  readonly emptyLitresPer100Km: number;
  readonly loadedLitresPer100Km: number;
  readonly color: string;
}
export interface PreviewVan {
  readonly cityId: string;
  readonly fuelMillilitres: number;
  /** Lifetime odometer, including the mileage on the used vehicle at purchase. */
  readonly mileageMeters: number;
  /** Undefined only in legacy saves / older automated fixtures. */
  readonly specs?: UsedVanOffer;
}
export interface PreviewEvent {
  readonly id: string;
  readonly at: GameMs;
  readonly message: string;
  readonly changeGrosze: Grosze;
}
export interface PreviewState {
  readonly time: GameMs;
  readonly driverState?:DriverState;
  readonly stops?:readonly PlannedStop[];
  readonly service?:ServicePause;
  readonly activityLog?:readonly ActivityRecord[];
  readonly stopSequence?:number;
  readonly haltedReason?:string;
  readonly market?: FreightMarket;
  readonly company: PreviewCompany | null;
  readonly van: PreviewVan | null;
  /** Market is rolled once at company formation and saved across reloads. */
  readonly usedVanMarket?: readonly UsedVanOffer[];
  readonly driverHiredAt: GameMs | null;
  readonly paidWagesGrosze: Grosze;
  readonly wagesLoggedGrosze: Grosze;
  readonly active: ActiveTransport | null;
  readonly completedOfferIds: readonly string[];
  /** Optional so every existing preview save remains valid. */
  readonly lastTransport?: CompletedTransport;
  readonly tutorial?:{skipped:boolean;seenJourney:boolean;mapShown?:boolean};
  readonly completedPlans?:readonly RecordedPlan[];
  readonly events: readonly PreviewEvent[];
}
const DAY = 86_400_000;
const HOUR = 3_600_000;
const VAN_PRICE = 1_200_000;
const LOAN = 2_000_000;
const WAGE_PER_HOUR = 2500;
const CAPACITY_KG = 1200;
const CAPACITY_M3 = 12;
const CAPACITY_PALLETS = 4;
const MAX_FUEL_ML = 80_000;
const START_FUEL_ML = 20_000;
const HANDLING_GAME_MS = 15 * 60_000;
const PRICE_PER_LITRE_GROSZE = 750;

function assertNatural(n: number, label: string) {
  if (!Number.isSafeInteger(n) || n < 0) throw new Error(`Niepoprawna wartość: ${label}`);
}
/** Five deterministically randomized listings. Persisted at company formation. */
export function makeUsedVanMarket(companyName: string, baseCityId: string): UsedVanOffer[] {
  let seed=2166136261;
  for(const char of companyName + '|' + baseCityId) {
    seed = Math.imul(seed ^ char.charCodeAt(0), 16777619) >>> 0;
  }
  const rand=()=>{ seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296; };
  const models=['Vektor F90','Żubr Dostawczy','Nord Cargo','Atlas D-210','Vektor ProMax'];
  const prices=[6000,10500,16500,41500,96000];
  const mileages=[480000,310000,190000,65000,9500];
  const conditions=[17,41,62,86,97];
  const engines=[1.6,1.9,2,2.2,2.3];
  const colors=['#be845c','#8da5bc','#7fa78e','#bca876','#8ea9ce'];
  return models.map((model,i)=>{
    const variance=0.88+rand()*0.24;
    const engineLitres=engines[i];
    const horsepower=[78,95,122,148,178][i]+Math.floor(rand()*15);
    return {
      id:`van-used-${i+1}`, model, priceGrosze:Math.max(500000,Math.round(prices[i]*variance)*100),
      mileageMeters:(mileages[i]+Math.floor(rand()*15000))*1000,
      conditionPercent:Math.min(99,conditions[i]+Math.floor(rand()*9)),
      engineLitres,horsepower,engine:'diesel' as const,
      capacityKg:[850,1000,1200,1350,1500][i],
      volumeM3:[9,10,12,13,15][i],
      pallets:[3,3,4,4,4][i],
      emptyLitresPer100Km:Number((9.1+engineLitres*.65+rand()*.65).toFixed(1)),
      loadedLitresPer100Km:Number((11+engineLitres*.55+rand()*.7).toFixed(1)),
      color:colors[i],
    };
  });
}
export function listUsedVans(state: PreviewState): readonly UsedVanOffer[] {
  return state.usedVanMarket ?? (state.company ?
    makeUsedVanMarket(state.company.name,state.company.baseCityId) : []);
}
export function buyUsedVan(state: PreviewState, offerId: string): PreviewState {
  if(!state.company || state.van) throw new Error('Parking poziom 1 mieści tylko jeden pojazd.');
  const listing=listUsedVans(state).find(v=>v.id===offerId);
  if(!listing) throw new Error('Wybrany pojazd nie jest już dostępny.');
  if(state.company.balanceGrosze < listing.priceGrosze) throw new Error('Brak środków na wybrany pojazd.');
  return record({...state,
    company:{...state.company,balanceGrosze:state.company.balanceGrosze-listing.priceGrosze},
    van:{cityId:state.company.baseCityId,fuelMillilitres:START_FUEL_ML,
      mileageMeters:listing.mileageMeters,specs:listing},
    usedVanMarket:listUsedVans(state).filter(v=>v.id!==offerId),
  },`Kupiono ${listing.model} na giełdzie aut używanych.`,-listing.priceGrosze);
}
function record(state: PreviewState, message: string, changeGrosze: number): PreviewState {
  return { ...state, events: [...state.events, { id: `preview:${state.events.length + 1}`, at: state.time, message, changeGrosze }] };
}
export function createPreviewState(time: GameMs): PreviewState {
  assertNatural(time, 'czas');
  return { time, company: null, van: null, driverHiredAt: null, paidWagesGrosze: 0, wagesLoggedGrosze: 0,
    active: null, completedOfferIds: [], events: [] };
}
export function establishCompany(state: PreviewState, name: string, baseCityId: string): PreviewState {
  if (state.company) throw new Error('Firma już istnieje.');
  if (!name.trim() || !baseCityId) throw new Error('Podaj nazwę firmy i miasto bazy.');
  return record({ ...state, company: { name: name.trim(), baseCityId,
    balanceGrosze: LOAN, debtGrosze: LOAN },
    tutorial:{skipped:false,seenJourney:false},usedVanMarket: makeUsedVanMarket(name.trim(),baseCityId) }, 'Utworzono firmę i zaciągnięto kredyt 20 000 zł.', LOAN);
}
export function buyVan(state: PreviewState): PreviewState {
  if (!state.company || state.van) throw new Error('Nie można kupić furgonu.');
  if (state.company.balanceGrosze < VAN_PRICE) throw new Error('Brak środków na zakup furgonu.');
  return record({ ...state, company: { ...state.company, balanceGrosze: state.company.balanceGrosze - VAN_PRICE },
    van: { cityId: state.company.baseCityId, fuelMillilitres: START_FUEL_ML, mileageMeters: 0 } },
    'Kupiono używany furgon.', -VAN_PRICE);
}
export function hireDriver(state: PreviewState): PreviewState {
  if (!state.company || !state.van || state.driverHiredAt !== null) throw new Error('Nie można zatrudnić kierowcy.');
  return record({ ...state, driverHiredAt: state.time,driverState:{drivingMs:0,satisfaction:100,overtimeHoursCharged:0,paidWorkMs:0} }, 'Zatrudniono kierowcę.', 0);
}
export function refuelAtCity(state:PreviewState,litres:number):PreviewState{return beginCityFuel(state,litres)}
function validRoute(route: TransportRoute, from: string, to: string): boolean {
  return route.fromCityId === from && route.toCityId === to &&
    Number.isFinite(route.meters) && route.meters >= 0 &&
    Number.isFinite(route.seconds) && route.seconds >= 0 &&
    route.geometry.length > 0 && Boolean(route.id);
}
export function dispatchTransport(state: PreviewState, offer: PreviewOffer,
  emptyRoute: TransportRoute, loadedRoute: TransportRoute): PreviewState {
  const reason=dispatchReadiness(state,offer,[emptyRoute,loadedRoute]);if(reason)throw new Error(reason);
  if (!state.company || !state.van || state.driverHiredAt === null || state.active) throw new Error('Firma nie jest gotowa do kursu.');
  if(state.market&&!state.market.orders.some(o=>o.offer.id===offer.id&&o.completedAt===null))throw new Error('Najpierw przyjmij zlecenie z rynku.');
  if (state.completedOfferIds.includes(offer.id) || (!state.market?.orders.some(o=>o.offer.id===offer.id&&o.completedAt===null) && offer.expiresAt <= state.time)) throw new Error('Oferta niedostępna.');
  if (!offer.id || !offer.cargo || !Number.isSafeInteger(offer.payoutGrosze) || offer.payoutGrosze <= 0 ||
      !Number.isFinite(offer.massKg) || offer.massKg <= 0 || offer.massKg > (state.van.specs?.capacityKg ?? CAPACITY_KG) ||
      !Number.isFinite(offer.volumeM3) || offer.volumeM3 <= 0 || offer.volumeM3 > (state.van.specs?.volumeM3 ?? CAPACITY_M3) ||
      !Number.isSafeInteger(offer.pallets) || offer.pallets < 0 || offer.pallets > (state.van.specs?.pallets ?? CAPACITY_PALLETS))
    throw new Error('Ładunek nie mieści się we furgonie.');
  if (!validRoute(emptyRoute, state.van.cityId, offer.fromCityId) ||
      !validRoute(loadedRoute, offer.fromCityId, offer.toCityId))
    throw new Error('Brak poprawnej trasy drogowej. Nie można teleportować pojazdu.');
  const neededMl = Math.ceil(emptyRoute.meters*(state.van.specs?.emptyLitresPer100Km ?? 10)/100
    +loadedRoute.meters*(state.van.specs?.loadedLitresPer100Km ?? 12)/100);
  if (state.van.fuelMillilitres < neededMl) throw new Error('Za mało paliwa na całą trasę.');
  const active: ActiveTransport = { offer, routeEmpty: emptyRoute, routeLoaded: loadedRoute,
    startedAt: state.time, phase: 'empty', phaseProgressMs: 0 };
  return record({ ...state, active }, `Przyjęto zlecenie ${offer.id}.`, 0);
}
export function phaseDuration(a: ActiveTransport): number {
  return a.phase === 'empty' ? Math.round(a.routeEmpty.seconds * 1000) :
    a.phase === 'loaded' ? Math.round(a.routeLoaded.seconds * 1000) : HANDLING_GAME_MS;
}
/** Advance in game milliseconds (not real milliseconds). Handles phase transitions exactly once. */
export function advancePreview(state:PreviewState,time:GameMs):PreviewState{return simulatePreview(state,time)}
export function repayLoan(state:PreviewState,requested?:number):PreviewState{
 if(!state.company)throw Error('Brak firmy.');const amount=requested??Math.min(100000,state.company.debtGrosze);
 assertNatural(amount,'spłata');if(amount<=0||amount>state.company.debtGrosze||amount>state.company.balanceGrosze)throw Error('Kwota spłaty przekracza saldo lub dług.');
 return record({...state,company:{...state.company,balanceGrosze:state.company.balanceGrosze-amount,debtGrosze:state.company.debtGrosze-amount}},`Spłacono ${(amount/100).toFixed(2)} zł kapitału.`,-amount);
}
export function drawLoan(state:PreviewState,amount:number):PreviewState{
 if(!state.company)throw Error('Brak firmy.');assertNatural(amount,'kredyt');if(amount<=0||amount+state.company.debtGrosze>2000000)throw Error('Przekroczony limit 20 000 zł kapitału.');
 return record({...state,company:{...state.company,balanceGrosze:state.company.balanceGrosze+amount,debtGrosze:state.company.debtGrosze+amount}},`Zaciągnięto ${(amount/100).toFixed(2)} zł kredytu.`,amount);
}

/** Manual relocation consumes actual empty-driving fuel and time; no cargo/payment. */
export function startEmptyTrip(s:PreviewState,toCityId:string,routes:readonly TransportRoute[]):PreviewState{
 if(!s.company||!s.van||s.driverHiredAt===null||s.active||s.service)throw Error('Do przejazdu pustego potrzeba wolnego furgonu i kierowcy.');
 const route=routes.find(r=>r.fromCityId===s.van!.cityId&&r.toCityId===toCityId);if(!route)throw Error('Brak zatwierdzonej trasy pustej.');
 const fuel=Math.ceil(route.meters*(s.van.specs?.emptyLitresPer100Km??10)/100);if(s.van.fuelMillilitres<fuel)throw Error('Za mało paliwa — zatankuj przed przejazdem pustym.');
 const offer:PreviewOffer={id:`empty:${s.time}:${route.id}`,fromCityId:route.fromCityId,toCityId,cargo:'Przejazd pusty',massKg:0,volumeM3:0,pallets:0,payoutGrosze:0,expiresAt:s.time};
 const stationary:TransportRoute={id:`stationary:${toCityId}`,fromCityId:toCityId,toCityId,meters:0,seconds:0,geometry:[route.geometry.at(-1)!]};
 return record({...s,active:{offer,routeEmpty:route,routeLoaded:stationary,startedAt:s.time,phase:'empty',phaseProgressMs:0,emptyOnly:true}},`Rozpoczęto przejazd pusty do ${toCityId}.`,0);
}
