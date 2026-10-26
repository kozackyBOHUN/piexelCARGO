import type {TransportRoute} from './gameplay';
export interface Catalog11 {
 format:11;version:string;graphSha256:string;
 segments:{id:string;meters:number;seconds:number;geometry:readonly (readonly[number,number])[]}[];
 routes:{id:string;fromCityId:string;toCityId:string;meters:number;seconds:number;segments:number[]}[];
}
export function preferredRoutes(c:Catalog11):TransportRoute[]{
 if(c.format!==11||!c.version||c.routes.length!==342)throw Error('Niekompletny katalog routingu 11.');
 const pairs=new Set<string>(),cities=new Set<string>();
 const routes=c.routes.map(r=>{
  const key=r.fromCityId+'|'+r.toCityId;if(pairs.has(key)||r.fromCityId===r.toCityId||!(r.meters>0&&r.seconds>0)||!r.segments.length)throw Error('Nieprawidłowa relacja routingu 11.');pairs.add(key);cities.add(r.fromCityId);cities.add(r.toCityId);
  let meters=0,seconds=0,prior:readonly[number,number]|undefined;for(const i of r.segments){const s=c.segments[i];if(!s||s.geometry.length<2)throw Error('Brak segmentu OSM.');const p=s.geometry[0];if(prior&&(prior[0]!==p[0]||prior[1]!==p[1]))throw Error('Nieciągła geometria OSM.');prior=s.geometry.at(-1);meters+=s.meters;seconds+=s.seconds}
  if(Math.abs(meters-r.meters)>.06||Math.abs(seconds-r.seconds)>.06)throw Error('Niespójna długość lub ETA.');
  let geometry:TransportRoute['geometry']|undefined;return {id:r.id,fromCityId:r.fromCityId,toCityId:r.toCityId,meters:r.meters,seconds:r.seconds,get geometry(){if(!geometry){const points:(readonly[number,number])[]=[];for(const i of r.segments){const line=c.segments[i].geometry;points.push(...(points.length?line.slice(1):line))}geometry=points}return geometry}};
 });
 if(cities.size!==19||pairs.size!==342)throw Error('Brak wszystkich kierunków 19 miast.');return routes;
}
export async function loadPreferredRoutes(base:string):Promise<TransportRoute[]>{
 const response=await fetch(`${base}roads/preferred/manifest.json`,{cache:'no-store'});if(!response.ok)throw Error('Nie można wczytać manifestu routingu 11. Odśwież grę lub spróbuj ponownie.');
 const manifest=await response.json();if(manifest.format!==11||manifest.status!=='complete'||manifest.directedPairs!==342||!manifest.catalogSha256)throw Error('Routing 11 nie przeszedł pełnej kontroli 342 tras.');
 const data=await fetch(`${base}roads/preferred/catalog.json?v=${manifest.catalogSha256}`,{cache:'no-store'});if(!data.ok)throw Error('Nie można wczytać zatwierdzonych tras.');const bytes=await data.arrayBuffer();
 const digest=await crypto.subtle.digest('SHA-256',bytes),sha=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');if(sha!==manifest.catalogSha256)throw Error('Niezgodna wersja katalogu tras — odśwież grę.');
 const catalog=JSON.parse(new TextDecoder().decode(bytes));if(catalog.version!==manifest.version)throw Error('Niezgodna wersja manifestu tras.');return preferredRoutes(catalog);
}
