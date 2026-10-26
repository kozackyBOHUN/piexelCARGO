import {expect,it} from 'vitest';
import {DEFAULT_LAYOUT,LAYOUT_KEY,readLayout,saveLayout} from './layoutPreferences';
it('persists independent display preferences without touching the company save',()=>{
 const data=new Map([['pixelcargo-0.1-preview-v1','company']]);const storage={getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{data.set(k,v)}};
 const p={management:false,schedule:'custom' as const,height:270,observedVehicle:'vehicle-01'};saveLayout(storage,p);expect(readLayout(storage)).toEqual(p);expect(data.get('pixelcargo-0.1-preview-v1')).toBe('company');expect(data.has(LAYOUT_KEY)).toBe(true);
});
it('invalid or blocked UI storage falls back and clamps heights without breaking gameplay',()=>{
 expect(readLayout({getItem:()=>'{broken'})).toEqual(DEFAULT_LAYOUT);expect(readLayout({getItem:()=>{throw Error('blocked')}})).toEqual(DEFAULT_LAYOUT);
 expect(readLayout({getItem:()=>JSON.stringify({height:-80,schedule:'bad'})}).height).toBe(160);expect(()=>saveLayout({setItem:()=>{throw Error('blocked')}},DEFAULT_LAYOUT)).not.toThrow();
});
