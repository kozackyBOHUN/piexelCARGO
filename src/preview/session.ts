import { CONFIG } from '../core/config';
import type { GameRuntime } from '../core/runtime';
import { advancePreview, createPreviewState, type PreviewState } from './gameplay';
export const PREVIEW_STORAGE='pixelcargo-0.1-preview-v1';
type Runtime=Pick<GameRuntime,'session'|'subscribe'|'getStatus'>;
type StoragePort=Pick<Storage,'getItem'|'setItem'>&Partial<Pick<Storage,'removeItem'>>;
/** One preview simulation, driven only by the existing runtime clock.
 * Legacy localStorage remains readable; no second timer advances the world. */
export class PreviewSession {
 private state:PreviewState;
 private ready=false;
 private changing=false;
 private listeners=new Set<()=>void>();
 private disposeClock:()=>void;
 private disposeStatus:()=>void;
 constructor(private runtime:Runtime,private storage:StoragePort){
  this.state=createPreviewState(runtime.session.getSnapshot().time);
  this.disposeClock=runtime.session.subscribe(this.sync);
  this.disposeStatus=runtime.subscribe(this.initialize);
  this.initialize();
 }
 getSnapshot=()=>this.state;
 subscribe=(listener:()=>void)=>{this.listeners.add(listener);return()=>{this.listeners.delete(listener)}};
 private emit(){this.listeners.forEach(fn=>fn())}
 private initialize=()=>{
  if(this.ready||this.runtime.getStatus().mode!=='active')return;
  let next=createPreviewState(this.runtime.session.getSnapshot().time);
  try{
   const raw=this.storage.getItem(PREVIEW_STORAGE),saved=raw?JSON.parse(raw) as PreviewState:null;
   if(saved&&Number.isSafeInteger(saved.time)&&saved.time>=0&&Array.isArray(saved.events)&&(!saved.company||typeof saved.company.name==='string'))next=saved;
  }catch{/* Retain the existing clean-session fallback for invalid storage. */}
  this.ready=true;this.replace(next);
 };
 private replace(next:PreviewState){
  this.changing=true;this.state=next;
  const technical=this.runtime.session.getSnapshot();
  if(technical.time!==next.time)this.runtime.session.restore({...technical,time:next.time});
  this.changing=false;this.emit();
 }
 private sync=()=>{
  if(!this.ready||this.changing||this.runtime.getStatus().mode!=='active')return;
  const time=this.runtime.session.getSnapshot().time;
  // A technical save cannot rewind an existing company; restart is explicit.
  if(time<this.state.time){this.replace(this.state);return;}
  const next=advancePreview(this.state,time);
  if(next!==this.state){this.state=next;this.emit()}
 };
 update=(action:(state:PreviewState)=>PreviewState)=>{
  if(!this.ready||this.runtime.getStatus().mode!=='active')throw new Error('Ta sesja jest nieaktywna. Zamknij inne karty gry.');
  this.sync();this.replace(action(this.state));this.save();
 };
 restart=()=>{
  if(!this.ready||this.runtime.getStatus().mode!=='active')throw new Error('Ta sesja jest nieaktywna.');
  this.replace(createPreviewState(CONFIG.startTime));
  if(!this.save())try{this.storage.removeItem?.(PREVIEW_STORAGE)}catch{/* Never resurrect a prior company when removal is available. */}
 };
 save=()=>{
  if(!this.ready||this.runtime.getStatus().mode!=='active')return false;
  try{this.storage.setItem(PREVIEW_STORAGE,JSON.stringify(this.state));return true}catch{return false}
 };
 /** Persistence timers never advance simulation. Waiting tabs never write. */
 attach(target:Window){
  const timer=target.setInterval(this.save,1000);
  target.addEventListener('pagehide',this.save);
  return()=>{target.clearInterval(timer);target.removeEventListener('pagehide',this.save);this.save()};
 }
 close(){this.save();this.disposeClock();this.disposeStatus();this.listeners.clear()}
}
