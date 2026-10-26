/** Independent PBF-side safety check, in addition to topology/turn certificates. */
import {readFileSync,writeFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {accessErrors} from './access';
const source=JSON.parse(readFileSync('/tmp/11-source-safety.json','utf8')),routes=JSON.parse(readFileSync('/tmp/11-full-routes.json','utf8'));
const nodeErrors=new Map<string,string[]>();for(const n of source.nodes){const t=n.tags,e=accessErrors(t,false),access=t.goods??t.motorcar??t.motor_vehicle??t.vehicle??t.access;
 if(t.barrier&&!['cattle_grid','entrance','toll_booth','border_control'].includes(t.barrier)&&!['yes','permissive','designated'].includes(access??''))e.push('Barrier without van permission');
 if(t.locked==='yes'||(t.barrier&&t.opening_hours&&!['24/7','open'].includes(t.opening_hours)))e.push('Locked/timed gate');
 if(e.length)nodeErrors.set(n.coordinates.join(','),e.map(x=>'Node '+n.id+': '+x));
}
const results=[];for(const r of routes){const errors:string[]=[];for(const l of r.legs){const tags=source.ways[String(l.wayId)];if(!tags){errors.push('Missing PBF way '+l.wayId);continue}const reverse=l.edgeId.endsWith(':r');errors.push(...accessErrors(tags,reverse).map(x=>'Way '+l.wayId+': '+x));
 const direction=tags['oneway:goods']??tags['oneway:motorcar']??tags['oneway:motor_vehicle']??tags.oneway??(['roundabout'].includes(tags.junction)||tags.highway==='motorway'?'yes':'no');if((['yes','1','true'].includes(direction)&&reverse)||(direction==='-1'&&!reverse)||!['yes','1','true','-1','no','0','false'].includes(direction))errors.push('PBF direction '+l.edgeId);
 for(const p of l.geometry)if(nodeErrors.has(p.join(',')))errors.push(...nodeErrors.get(p.join(','))!);
 }results.push({id:r.id,fromCityId:r.fromCityId,toCityId:r.toCityId,passed:errors.length===0,errors:[...new Set(errors)]})}
writeFileSync('/tmp/11-pbf-certificates.json',JSON.stringify(results));console.log('Independent full PBF safety certificates',results.length,'failed',results.filter(r=>!r.passed));if(results.some(r=>!r.passed))process.exitCode=1;
