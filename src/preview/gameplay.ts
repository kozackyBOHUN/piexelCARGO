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
export interface PreviewVan {
  readonly cityId: string;
  readonly fuelMillilitres: number;
  readonly mileageMeters: number;
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
  readonly driverHiredAt: GameMs | null;
  readonly paidWagesGrosze: Grosze;
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
function record(state: PreviewState, message: string, changeGrosze: number): PreviewState {
  return { ...state, events: [...state.events, { id: `preview:${state.events.length + 1}`, at: state.time, message, changeGrosze }] };
}
export function createPreviewState(time: GameMs): PreviewState {
  assertNatural(time, 'czas');
  return { time, company: null, van: null, driverHiredAt: null, paidWagesGrosze: 0,
    active: null, completedOfferIds: [], events: [] };
}
export function establishCompany(state: PreviewState, name: string, baseCityId: string): PreviewState {
  if (state.company) throw new Error('Firma już istnieje.');
  if (!name.trim() || !baseCityId) throw new Error('Podaj nazwę firmy i miasto bazy.');
  return record({ ...state, company: { name: name.trim(), baseCityId,
    balanceGrosze: LOAN, debtGrosze: LOAN } }, 'Utworzono firmę i zaciągnięto kredyt 20 000 zł.', LOAN);
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
      !Number.isFinite(offer.massKg) || offer.massKg <= 0 || offer.massKg > CAPACITY_KG ||
      !Number.isFinite(offer.volumeM3) || offer.volumeM3 <= 0 || offer.volumeM3 > CAPACITY_M3 ||
      !Number.isSafeInteger(offer.pallets) || offer.pallets < 0 || offer.pallets > CAPACITY_PALLETS)
    throw new Error('Ładunek nie mieści się we furgonie.');
  if (!validRoute(emptyRoute, state.van.cityId, offer.fromCityId) ||
      !validRoute(loadedRoute, offer.fromCityId, offer.toCityId))
    throw new Error('Brak poprawnej trasy drogowej. Nie można teleportować pojazdu.');
  const neededMl = Math.ceil(emptyRoute.meters * 0.1 + loadedRoute.meters * 0.12);
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
    const wageTotal = current.driverHiredAt === null ? 0 : Math.floor((to - current.driverHiredAt) * WAGE_PER_HOUR / HOUR);
    const wageDifference = wageTotal - current.paidWagesGrosze;
    current = { ...current, time: to, paidWagesGrosze: wageTotal,
      company: current.company ? { ...current.company, balanceGrosze: current.company.balanceGrosze - wageDifference } : null };
    if (wageDifference) current = record(current, 'Wynagrodzenie kierowcy.', -wageDifference);
  };
  while (current.time < newGameTime) {
    const startOfNextDay = (Math.floor(current.time / DAY) + 1) * DAY;
    const a = current.active;
    const phaseEnd = a ? current.time + Math.max(0, phaseDuration(a) - a.phaseProgressMs) : Infinity;
    const to = Math.min(newGameTime, startOfNextDay, phaseEnd);
    const dt = to - current.time;
    if (dt > 0 && a && current.van && (a.phase === 'empty' || a.phase === 'loaded')) {
      const duration = phaseDuration(a);
      const fraction = duration ? dt / duration : 1;
      const meters = (a.phase === 'empty' ? a.routeEmpty.meters : a.routeLoaded.meters) * fraction;
      const millilitres = Math.ceil(meters * (a.phase === 'empty' ? 0.1 : 0.12));
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
