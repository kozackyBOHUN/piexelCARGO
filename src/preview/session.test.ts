import {describe,it,expect} from 'vitest';
import {GameSession} from '../core/session';
import type {RuntimeStatus} from '../core/runtime';
import {PreviewSession,PREVIEW_STORAGE} from './session';
import {createPreviewState,establishCompany,buyVan,hireDriver,dispatchTransport,type PreviewState} from './gameplay';
class Runtime {
 session=new GameSession();private listeners=new Set<()=>void>();
 private status:RuntimeStatus={mode:'waiting',message:'',savedAt:null,saveError:false};
 getStatus=()=>this.status;
 subscribe=(fn:()=>void)=>{this.listeners.add(fn);return()=>{this.listeners.delete(fn)}};
 activate(){this.status={...this.status,mode:'active'};this.listeners.forEach(fn=>fn())}
}
function store(initial?:PreviewState){const data=new Map<string,string>(initial?[[PREVIEW_STORAGE,JSON.stringify(initial)]]:[]);return{getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{data.set(k,v)},data}}
describe('one canonical preview session',()=>{
 it('loads legacy company and reconciles different persisted clock instants only after ownership',()=>{
  let old=createPreviewState(8*3600000);old=establishCompany(old,'Old company','K');old=buyVan(old);old=hireDriver(old);
  const storage=store(old),runtime=new Runtime(),session=new PreviewSession(runtime,storage);
  session.save();expect(JSON.parse(storage.getItem(PREVIEW_STORAGE)!)).toEqual(old);
  runtime.activate();expect(session.getSnapshot()).toEqual(old);expect(runtime.session.getSnapshot().time).toBe(old.time);
  runtime.session.advance(1000);
  expect(session.getSnapshot().time).toBe(old.time+60000);expect(runtime.session.getSnapshot().time).toBe(session.getSnapshot().time);
  expect(session.getSnapshot().company).toEqual(old.company);session.close();
 });
 it('persists an active route, resumes once and restarts the same shared clock',()=>{
  const storage=store(),runtime=new Runtime(),session=new PreviewSession(runtime,storage);runtime.activate();
  session.update(s=>hireDriver(buyVan(establishCompany(s,'Shared world','K'))));
  session.update(s=>dispatchTransport(s,{id:'job',fromCityId:'K',toCityId:'T',cargo:'Książki',massKg:300,volumeM3:2,pallets:1,payoutGrosze:65000,expiresAt:86400000},
   {id:'stationary',fromCityId:'K',toCityId:'K',meters:0,seconds:0,geometry:[[19,50]]},
   {id:'road',fromCityId:'K',toCityId:'T',meters:1000,seconds:60,geometry:[[19,50],[19.01,50]]}));
  runtime.session.advance(15500);session.save();const saved=session.getSnapshot();expect(saved.active?.phase).toBe('loaded');session.close();
  const nextRuntime=new Runtime(),next=new PreviewSession(nextRuntime,storage);nextRuntime.activate();expect(next.getSnapshot()).toEqual(saved);
  nextRuntime.session.advance(30000);expect(next.getSnapshot().active).toBeNull();expect(next.getSnapshot().completedOfferIds).toEqual(['job']);
  const bank=next.getSnapshot().company!.balanceGrosze;next.save();next.close();
  const finalRuntime=new Runtime(),final=new PreviewSession(finalRuntime,storage);finalRuntime.activate();finalRuntime.session.advance(1000);
  expect(final.getSnapshot().completedOfferIds).toEqual(['job']);expect(final.getSnapshot().company!.balanceGrosze).toBe(bank);
  final.restart();expect(final.getSnapshot().company).toBeNull();expect(final.getSnapshot().lastTransport).toBeUndefined();
  expect(finalRuntime.session.getSnapshot().time).toBe(21600000);expect(JSON.parse(storage.getItem(PREVIEW_STORAGE)!).company).toBeNull();final.close();
 });
 it('restart removes the previous company if writing the new empty save fails',()=>{
  const storage=store();let fail=false;
  const port={getItem:storage.getItem,setItem:(key:string,value:string)=>{if(fail)throw new Error('quota');storage.setItem(key,value)},removeItem:(key:string)=>{storage.data.delete(key)}};
  const runtime=new Runtime(),session=new PreviewSession(runtime,port);runtime.activate();session.update(s=>establishCompany(s,'Old','K'));
  fail=true;session.restart();expect(session.getSnapshot().company).toBeNull();expect(storage.getItem(PREVIEW_STORAGE)).toBeNull();session.close();
 });

});
