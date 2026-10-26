import type {PreviewState,PreviewOffer,TransportRoute} from './gameplay';
export function dispatchReadiness(s:PreviewState,o:PreviewOffer,routes:readonly TransportRoute[]){
 if(!s.van)return 'Brak samochodu — kup furgon na giełdzie.';
 if(s.driverHiredAt===null)return 'Brak zatrudnionego kierowcy — otwórz Kadry / Rekrutacja.';
 if(s.service)return s.service.kind==='rest'?'Kierowca odpoczywa — poczekaj do końca snu.':'Trwa tankowanie — poczekaj do końca postoju.';
 if(s.haltedReason)return s.haltedReason;
 if(s.active)return 'Samochód jest aktualnie w trasie — poczekaj na zakończenie kursu.';
 if(s.completedOfferIds.includes(o.id))return 'Zlecenie zostało już dostarczone.';
 if(o.massKg>(s.van.specs?.capacityKg??1200))return 'Ładunek przekracza ładowność — transport dzielony jest nieobsługiwany.';
 if(o.volumeM3>(s.van.specs?.volumeM3??12))return 'Brakuje pojemności w m³ — wybierz mniejszy ładunek.';
 if(o.pallets>(s.van.specs?.pallets??4))return 'Brakuje miejsc paletowych — wybierz mniejszy ładunek.';
 const loaded=routes.find(r=>r.fromCityId===o.fromCityId&&r.toCityId===o.toCityId);
 if(!loaded)return 'Brak zatwierdzonej trasy do miasta dostawy.';
 const empty=s.van.cityId===o.fromCityId?{meters:0}:routes.find(r=>r.fromCityId===s.van!.cityId&&r.toCityId===o.fromCityId);
 if(!empty)return 'Brak zatwierdzonej trasy do miejsca załadunku — wybierz dostępny przejazd pusty.';
 const fuel=Math.ceil(empty.meters*(s.van.specs?.emptyLitresPer100Km??10)/100+loaded.meters*(s.van.specs?.loadedLitresPer100Km??12)/100);
 if(s.van.fuelMillilitres<fuel)return `Za mało paliwa — potrzeba co najmniej ${(fuel/1000).toFixed(1)} l. Zatankuj na postoju.`;
 return '';
}
