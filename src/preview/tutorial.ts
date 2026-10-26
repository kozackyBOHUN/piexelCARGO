import type {PreviewState} from './gameplay';
export function tutorialStep(s:PreviewState,assigning=false){
 if(!s.company||!s.tutorial||s.tutorial.skipped||s.tutorial.seenJourney||s.completedOfferIds.length)return 0;
 if(!s.van)return 1;if(s.driverHiredAt===null)return 2;
 if(s.active&&!s.active.emptyOnly)return 6;if(!s.market?.orders.some(o=>o.completedAt===null))return 3;
 return assigning?5:4;
}
export const TUTORIAL_TEXT:Record<number,string>={1:'Kup samochód: PARKING → Giełda używanych → KUP POJAZD.',2:'Zatrudnij kierowcę: KADRY → Rekrutacja → ZATRUDNIJ KIEROWCĘ.',3:'Przyjmij zlecenie: SPEDYCJA → Szukaj zleceń. Wybierz ładunek mieszczący się we furgonie.',4:'Otwórz Zlecenia przyjęte i wybierz PRZYDZIEL AUTO.',5:'Wybierz swój furgon i kliknij ROZPOCZNIJ KURS.',6:'Obserwuj samochód na mapie i harmonogram. Kurs trwa naprawdę — instrukcja go nie zatrzymuje.'};
