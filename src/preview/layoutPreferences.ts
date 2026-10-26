export const LAYOUT_KEY='pixelcargo-display-v1';
export type ScheduleSize='one'|'five'|'full'|'custom';
export interface LayoutPreferences {management:boolean;schedule:ScheduleSize;height:number;observedVehicle:string}
export const DEFAULT_LAYOUT:LayoutPreferences={management:true,schedule:'one',height:180,observedVehicle:'vehicle-01'};
export function readLayout(storage:Pick<Storage,'getItem'>):LayoutPreferences{
 try{const p=JSON.parse(storage.getItem(LAYOUT_KEY)??'null');if(!p||typeof p!=='object')return DEFAULT_LAYOUT;return {management:typeof p.management==='boolean'?p.management:true,schedule:['one','five','full','custom'].includes(p.schedule)?p.schedule:'one',height:Number.isFinite(p.height)?Math.max(160,Math.min(2000,p.height)):180,observedVehicle:p.observedVehicle==='vehicle-01'?p.observedVehicle:'vehicle-01'}}catch{return DEFAULT_LAYOUT}
}
export function saveLayout(storage:Pick<Storage,'setItem'>,layout:LayoutPreferences){try{storage.setItem(LAYOUT_KEY,JSON.stringify(layout))}catch{/* UI preferences must never block the game. */}}
