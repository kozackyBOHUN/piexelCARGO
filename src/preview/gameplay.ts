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
  readonly company: PreviewCompany | null;
  readonly van: PreviewVan | null;
  /** Market is rolled once at company formation and saved across reloads. */
  readonly usedVanMarket?: readonly UsedVanOffer[];
  readonly driverHiredAt: GameMs | null;
  readonly paidWagesGrosze: Grosze;
  readonly wagesLoggedGrosze: Grosze;
  readonly active: ActiveTransport | null;
  readonly completedOfferIds: readonly string[];
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
    usedVanMarket: makeUsedVanMarket(name.trim(),baseCityId) }, 'Utworzono firmę i zaciągnięto kredyt 20 000 zł.', LOAN);
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
  return record({ ...state, driverHiredAt: state.time }, 'Zatrudniono kierowcę.', 0);
}
export function refuelAtCity(state: PreviewState, litres: number): PreviewState {
  if (!state.company || !state.van || state.active) throw new Error('Tankowanie dostępne tylko w mieście, gdy auto jest wolne.');
  assertNatural(litres, 'liczba litrów');
  if (litres <= 0 || state.van.fuelMillilitres + litres * 1000 > MAX_FUEL_ML) throw new Error('Przekroczona pojemność baku.');
  const price = litres * PRICE_PER_LITRE_GROSZE;
  if (state.company.balanceGrosze < price) throw new Error('Brak pieniędzy na paliwo.');
  return record({ ...state, company: { ...state.company, balanceGrosze: state.company.balanceGrosze - price },
    van: { ...state.van, fuelMillilitres: state.van.fuelMillilitres + litres * 1000 } },
    `Zatankowano ${litres} l.`, -price);
}
function validRoute(route: TransportRoute, from: string, to: string): boolean {
  return route.fromCityId === from && route.toCityId === to &&
    Number.isFinite(route.meters) && route.meters >= 0 &&
    Number.isFinite(route.seconds) && route.seconds >= 0 &&
    route.geometry.length > 0 && Boolean(route.id);
}
export function dispatchTransport(state: PreviewState, offer: PreviewOffer,
  emptyRoute: TransportRoute, loadedRoute: TransportRoute): PreviewState {
  if (!state.company || !state.van || state.driverHiredAt === null || state.active) throw new Error('Firma nie jest gotowa do kursu.');
  if (state.completedOfferIds.includes(offer.id) || offer.expiresAt <= state.time) throw new Error('Oferta niedostępna.');
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
function phaseDuration(a: ActiveTransport): number {
  return a.phase === 'empty' ? Math.round(a.routeEmpty.seconds * 1000) :
    a.phase === 'loaded' ? Math.round(a.routeLoaded.seconds * 1000) : HANDLING_GAME_MS;
}
/** Advance in game milliseconds (not real milliseconds). Handles phase transitions exactly once. */
export function advancePreview(state: PreviewState, newGameTime: GameMs): PreviewState {
  assertNatural(newGameTime, 'czas gry');
  if (newGameTime < state.time) throw new Error('Nie można cofnąć czasu gry.');
  if (newGameTime === state.time) return state;
  let current = state;
  const step = (to: number) => {
    const previousTime = current.time;
    const wageTotal = current.driverHiredAt === null ? 0 : Math.floor((to - current.driverHiredAt) * WAGE_PER_HOUR / HOUR);
    const wageDifference = wageTotal - current.paidWagesGrosze;
    current = { ...current, time: to, paidWagesGrosze: wageTotal,
      company: current.company ? { ...current.company, balanceGrosze: current.company.balanceGrosze - wageDifference } : null };
    // Aggregate wage ledger entries rather than persisting one event every timer tick.
    if (wageTotal > (current.wagesLoggedGrosze ?? 0) && Math.floor(to / HOUR) > Math.floor(previousTime / HOUR)) {
      const toLog = wageTotal - (current.wagesLoggedGrosze ?? 0);
      current = { ...current, wagesLoggedGrosze: wageTotal };
      current = record(current, 'Wynagrodzenie kierowcy.', -toLog);
    }
  };
  while (current.time < newGameTime) {
    const startOfNextDay = (Math.floor(current.time / DAY) + 1) * DAY;
    const a = current.active;
    const phaseEnd = a ? current.time + Math.max(0, phaseDuration(a) - a.phaseProgressMs) : Infinity;
    const to = Math.min(newGameTime, startOfNextDay, phaseEnd);
    const dt = to - current.time;
    if (dt > 0 && a && current.van && (a.phase === 'empty' || a.phase === 'loaded')) {
      const duration = phaseDuration(a);
      const routeMeters = a.phase === 'empty' ? a.routeEmpty.meters : a.routeLoaded.meters;
      const rate = (a.phase === 'empty' ?
        (current.van.specs?.emptyLitresPer100Km ?? 10):
        (current.van.specs?.loadedLitresPer100Km ?? 12)) / 100; // ml per metre
      const fraction = duration ? dt / duration : 1;
      const meters = routeMeters * fraction;
      // Charge the difference of cumulative consumption. Rounding each tick
      // separately makes fuel usage depend on frame rate (e.g. 250ms vs 1s).
      const cumulativeFuelMl = (elapsedMs: number) =>
        Math.ceil(routeMeters * rate * (duration ? Math.min(1, elapsedMs / duration) : 1));
      const millilitres = cumulativeFuelMl(a.phaseProgressMs + dt) - cumulativeFuelMl(a.phaseProgressMs);
      current = { ...current, van: { ...current.van, fuelMillilitres: Math.max(0, current.van.fuelMillilitres - millilitres),
        mileageMeters: current.van.mileageMeters + meters } };
    }
    step(to);
    if (current.active) {
      const job = current.active;
      const progress = job.phaseProgressMs + dt;
      if (progress >= phaseDuration(job)) {
        const next: Record<Phase, Phase | 'finished'> = { empty:'loading',loading:'loaded',loaded:'unloading',unloading:'finished' };
        const nextPhase = next[job.phase];
        if (nextPhase === 'finished') {
          const value = job.offer.payoutGrosze;
          current = { ...current, active: null,
            completedOfferIds: [...current.completedOfferIds, job.offer.id],
            van: { ...current.van!, cityId: job.offer.toCityId },
            company: { ...current.company!, balanceGrosze: current.company!.balanceGrosze + value } };
          current = record(current, `Dostarczono ${job.offer.cargo}.`, value);
        } else {
          if (nextPhase === 'loading') current = { ...current, van: { ...current.van!, cityId: job.offer.fromCityId } };
          current = { ...current, active: { ...job, phase: nextPhase, phaseProgressMs: 0 } };
        }
      } else current = { ...current, active: { ...job, phaseProgressMs: progress } };
    }
    if (to === startOfNextDay && current.company) {
      const charge = Math.round(current.company.debtGrosze / 100);
      current = { ...current, company: { ...current.company, balanceGrosze: current.company.balanceGrosze - charge } };
      current = record(current, 'Odsetki od kredytu - 1% dziennie.', -charge);
    }
  }
  return current;
}
export function repayLoan(state: PreviewState): PreviewState {
  if (!state.company || state.active) throw new Error('Spłata niedostępna podczas kursu.');
  const amount = Math.min(state.company.debtGrosze, 100_000);
  if (amount < 100_000 || state.company.balanceGrosze < amount) throw new Error('Brak środków lub kapitału do spłaty.');
  return record({ ...state, company: { ...state.company, balanceGrosze: state.company.balanceGrosze - amount,
    debtGrosze: state.company.debtGrosze - amount } }, 'Spłacono 1000 zł kapitału.', -amount);
}
