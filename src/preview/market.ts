import {dispatchTransport,type PreviewOffer,type PreviewState,type TransportRoute} from './gameplay';
export const MARKET_CONFIG={offerLifetimeMs:5*86400000,deliveryMs:3*86400000,maxAccepted:3,slotsPerOrigin:10,baseGrosze:18000,groszePerKm:280,latePenalty:.5};
// Independent mass/space profiles for dry cargo; zero pallets means packages.
export const GOODS=[
 ['Odzież',35,1.2,1],['Obuwie',50,1,1.05],['Książki',210,.55,1],['Zabawki',30,1.4,1.1],['Elektronika',65,.7,1.4],
 ['Drobny sprzęt AGD',95,1.1,1.2],['Meble w paczkach',70,1.8,1.1],['Papier biurowy',240,.5,.95],['Karma dla zwierząt',180,.7,1],['Konserwy',220,.55,1.05],
] as const;
export interface AcceptedOrder {offer:PreviewOffer;acceptedAt:number;deadline:number;penaltyGrosze:number;penalized:boolean;completedAt:number|null}
export interface FreightMarket {seed:number;sequence:number;offers:readonly PreviewOffer[];routes:readonly Omit<TransportRoute,'geometry'>[];orders:readonly AcceptedOrder[]}
function hash(value:string){let n=2166136261;for(const c of value)n=Math.imul(n^c.charCodeAt(0),16777619)>>>0;return n}
function generate(m:FreightMarket,from:string,at:number):FreightMarket {
 let seed=m.seed;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 const options=m.routes.filter(r=>r.fromCityId===from);
 // Working relative demand weights for the approved subset; see docs/FREIGHT_MARKET.md.
 const demandWeights:Record<string,number>={'geonames:3094802':800,'geonames:757026':106,'geonames:3080866':26,'geonames:775758':29};
 const weight=options.reduce((n,r)=>n+(demandWeights[r.toCityId]??25),0);let pick=rand()*weight;
 const priority=['geonames:3094802','geonames:757026','geonames:3080866','geonames:775758'].map(id=>options.find(r=>r.toCityId===id)).filter((r):r is NonNullable<typeof r>=>!!r);
 const missing=priority.find(r=>!m.offers.some(o=>o.fromCityId===from&&o.toCityId===r.toCityId));
 const route=missing??options.find(r=>(pick-=demandWeights[r.toCityId]??25)<0)??options[0];
 const sequence=m.sequence+1,g=GOODS[(sequence-1)%GOODS.length],units=1+Math.floor(rand()*(missing?2:5)),palletized=rand()<.5;
 const massKg=Math.round(g[1]*units*(.9+rand()*.2)),volumeM3=Number((g[2]*units).toFixed(2));
 const pallets=palletized?Math.ceil(volumeM3/1.5):0;
 const payoutGrosze=Math.round((MARKET_CONFIG.baseGrosze+route.meters/1000*MARKET_CONFIG.groszePerKm)*g[3]*(.65+units*.15)*(.95+rand()*.1));
 const offer:PreviewOffer={id:`market:${sequence}`,fromCityId:from,toCityId:route.toCityId,cargo:g[0],massKg,volumeM3,pallets,payoutGrosze,expiresAt:at+MARKET_CONFIG.offerLifetimeMs};
 return {...m,seed,sequence,offers:[...m.offers,offer]};
}
export function ensureMarket(s:PreviewState,routes:readonly TransportRoute[]):PreviewState {
 if(!s.company)return s;
 if(s.market){
  const ids=new Set(s.market.routes.map(r=>r.id));if(ids.size===routes.length&&routes.every(r=>ids.has(r.id)))return s;
  const nextRoutes=routes.map(({geometry:_,...r})=>r);let m:FreightMarket={...s.market,routes:nextRoutes,offers:s.market.offers.filter(o=>routes.some(r=>r.fromCityId===o.fromCityId&&r.toCityId===o.toCityId))};
  for(const from of new Set(routes.map(r=>r.fromCityId)))while(m.offers.filter(o=>o.fromCityId===from).length<MARKET_CONFIG.slotsPerOrigin)m=generate(m,from,s.time);
  return {...s,market:m};
 }
 let m:FreightMarket={seed:hash(s.company.name+'|'+s.company.baseCityId),sequence:0,offers:[],orders:[],routes:routes.map(({geometry:_,...r})=>r)};
 for(const from of new Set(routes.map(r=>r.fromCityId)))for(let i=0;i<MARKET_CONFIG.slotsPerOrigin;i++)m=generate(m,from,s.time);
 if(s.active)m={...m,orders:[{offer:s.active.offer,acceptedAt:s.active.startedAt,deadline:s.active.startedAt+MARKET_CONFIG.deliveryMs,penaltyGrosze:0,penalized:false,completedAt:null}]};
 return {...s,market:m};
}
export function refreshMarket(s:PreviewState):PreviewState {
 if(!s.market)return s;let m=s.market,events=s.events,company=s.company;
 while(m.offers.some(o=>o.expiresAt<=s.time)){
  const expired=m.offers.find(o=>o.expiresAt<=s.time)!;
  m=generate({...m,offers:m.offers.filter(o=>o.id!==expired.id)},expired.fromCityId,expired.expiresAt);
 }
 if(!m.orders.some(o=>o.completedAt===null&&!o.penalized&&s.time>o.deadline)&&m===s.market)return s;
 const orders=m.orders.map(o=>{
  if(o.completedAt!==null||o.penalized||s.time<=o.deadline)return o;
  const penaltyGrosze=Math.round(o.offer.payoutGrosze*MARKET_CONFIG.latePenalty);
  if(company)company={...company,balanceGrosze:company.balanceGrosze-penaltyGrosze};
  events=[...events,{id:`preview:${events.length+1}`,at:o.deadline+1,message:`Kara za opóźnienie ${o.offer.id} (50% niedostarczonego ładunku).`,changeGrosze:-penaltyGrosze}];
  return {...o,penalized:true,penaltyGrosze};
 });
 return {...s,company,events,market:{...m,orders}};
}
export function cargoFits(s:PreviewState,o:PreviewOffer){return !!s.van&&o.massKg<=(s.van.specs?.capacityKg??1200)&&o.volumeM3<=(s.van.specs?.volumeM3??12)&&o.pallets<=(s.van.specs?.pallets??4)}
export function acceptOrder(s:PreviewState,id:string):PreviewState {
 if(!s.company||!s.market)throw new Error('Załóż firmę.');
 const m=s.market,o=m.offers.find(o=>o.id===id);
 if(!o||o.expiresAt<=s.time)throw new Error('Oferta wygasła lub jest niedostępna.');
 if(m.orders.filter(o=>o.completedAt===null).length>=MARKET_CONFIG.maxAccepted)throw new Error('Limit 3 niezakończonych zleceń.');
 if(!cargoFits(s,o))throw new Error('Ładunek wymaga innego furgonu lub wielu kursów — nieobsługiwane.');
 const next=generate({...m,offers:m.offers.filter(v=>v.id!==id),orders:[...m.orders,{offer:o,acceptedAt:s.time,deadline:s.time+MARKET_CONFIG.deliveryMs,penaltyGrosze:0,penalized:false,completedAt:null}]},o.fromCityId,s.time);
 return {...s,market:next,events:[...s.events,{id:`preview:${s.events.length+1}`,at:s.time,message:`Przyjęto zlecenie ${id}; termin za 3 dni.`,changeGrosze:0}]};
}
export function startOrder(s:PreviewState,id:string,routes:readonly TransportRoute[]):PreviewState {
 const order=s.market?.orders.find(o=>o.offer.id===id&&o.completedAt===null);
 if(!order)throw new Error('Brak przyjętego zlecenia.');
 const loaded=routes.find(r=>r.fromCityId===order.offer.fromCityId&&r.toCityId===order.offer.toCityId);
 if(!loaded||!s.van)throw new Error('Brak zatwierdzonej trasy.');
 const empty=s.van.cityId===loaded.fromCityId?{id:'stationary',fromCityId:s.van.cityId,toCityId:s.van.cityId,meters:0,seconds:0,geometry:[loaded.geometry[0]]}:routes.find(r=>r.fromCityId===s.van!.cityId&&r.toCityId===loaded.fromCityId);
 if(!empty)throw new Error('Brak zatwierdzonego dojazdu pustego.');
 return dispatchTransport(s,order.offer,empty,loaded);
}
