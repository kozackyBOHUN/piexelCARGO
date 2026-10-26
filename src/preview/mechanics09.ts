export const M09={hour:3600000,normalDriveMs:12*3600000,redDriveMs:14*3600000,maxDriveMs:16*3600000,restMs:10*3600000,mandatoryRestMs:15*3600000,overtimePenalty:2,mandatoryPenalty:10,fuelStopMs:15*60000,tankMl:80000,fuelPriceGroszePerLitre:750,loanLimit:2000000};
export interface DriverState {drivingMs:number;satisfaction:number;overtimeHoursCharged:number;paidWorkMs:number}
export interface PlannedStop {id:string;kind:'rest'|'fuel';at:number;durationMs:number;status:'planned'|'active'|'completed'|'failed';mandatory?:boolean;litres?:number|null;phase?:'empty'|'loaded';transportId?:string;progressMs?:number;coordinates?:readonly[number,number];startedAt?:number;endedAt?:number;chargedGrosze?:number;failure?:string}
export interface ServicePause {stopId:string;kind:'rest'|'fuel';start:number;end:number}
export interface ActivityRecord {phase:'empty'|'loaded'|'loading'|'unloading'|'rest'|'fuel'|'waiting';start:number;end:number;transportId?:string;stopId?:string}
