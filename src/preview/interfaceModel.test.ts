import {it,expect} from 'vitest';
import {geographicKm,financialDays} from './interfaceModel';
import {createPreviewState} from './gameplay';
it('uses real geographic radius rather than road length',()=>{
 expect(geographicKm('geonames:3094802','geonames:775758')).toBeGreaterThan(30);
 expect(geographicKm('geonames:3094802','geonames:775758')).toBeLessThan(50);
 expect(geographicKm('geonames:3094802','geonames:757026')).toBeGreaterThan(70);
 expect(geographicKm('geonames:3094802','geonames:757026')).toBeLessThan(100);
 expect(geographicKm('bad','bad')).toBe(Infinity);
});
it('derives finance from real transactions and excludes credit principal from operating profit',()=>{
 const state={...createPreviewState(10*86400000),events:[{id:'1',at:0,message:'Utworzono firmę',changeGrosze:2000000},{id:'2',at:9*86400000,message:'Dostarczono',changeGrosze:60000},{id:'3',at:9*86400000,message:'Pensja',changeGrosze:-2500},{id:'4',at:9*86400000,message:'Spłacono 1000 zł kapitału.',changeGrosze:-100000}]};
 expect(financialDays(state,7).profit).toBe(57500);expect(financialDays(state,0).profit).toBe(57500);expect(financialDays(state,7).events).toHaveLength(3);expect(financialDays(createPreviewState(0),7).groups).toEqual([]);
});
