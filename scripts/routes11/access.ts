import {DEFAULT_VAN,edgeAllowed,type VanProfile} from '../routes08/routing';
/** goods/motorcar van, maximum authorised mass <= 3.5t: HGV-specific rules do not apply. */
export function conditionalDecision(key:string,profile:VanProfile=DEFAULT_VAN){
 if(key.split(':').includes('hgv')&&profile.massTonnes!==undefined&&profile.massTonnes<=3.5)return 'not-applicable-hgv';
 if(['bus','psv','taxi','motorcycle','bicycle','foot','agricultural','hazmat'].some(mode=>key.split(':').includes(mode)))return 'not-applicable-mode';
 return 'unresolved-blocked';
}
export function accessErrors(tags:Record<string,string>,reverse:boolean,profile=DEFAULT_VAN):string[]{
 const errors:string[]=[];
 for(const suffix of ['',reverse?':backward':':forward']){
  const access=['goods','motorcar','motor_vehicle','vehicle','access'].map(k=>tags[k+suffix]).find(v=>v!==undefined);
  if(access!==undefined&&!['yes','permissive','designated'].includes(access))errors.push(`Access ${suffix||'general'}=${access}`);
 }
 const parse=(raw:string,unit:'t'|'m')=>{const m=raw.toLowerCase().replace(',','.').match(/^(\d+(?:\.\d+)?)\s*(kg|t|tonnes?|m|cm)?$/);if(!m)return NaN;const n=Number(m[1]);return m[2]==='kg'&&unit==='t'?n/1000:m[2]==='cm'&&unit==='m'?n/100:n};
 const limits:[string,number,'t'|'m'][]=[['maxweight',profile.massTonnes??Infinity,'t'],['maxweightrating',profile.massTonnes??Infinity,'t'],['maxgvweightrating',profile.massTonnes??Infinity,'t'],['maxgcweight',profile.massTonnes??Infinity,'t'],['maxgcweightrating',profile.massTonnes??Infinity,'t'],['maxaxleload',profile.massTonnes??Infinity,'t'],['maxheight',profile.heightMeters??Infinity,'m'],['maxwidth',profile.widthMeters??Infinity,'m'],['maxlength',7,'m']];
 for(const [key,amount,unit]of limits)for(const suffix of ['',reverse?':backward':':forward',':physical']){const value=tags[key+suffix];if(value&&!['none','default'].includes(value)&&!(amount<=parse(value,unit)))errors.push(`${key+suffix}=${value}`)}
 if(!edgeAllowed(tags,profile))errors.push('Dimension/weight or unresolved general dimension conditional');
 for(const key of Object.keys(tags))if(key.includes(':conditional')&&conditionalDecision(key,profile)==='unresolved-blocked')errors.push(`${key}=${tags[key]}`);
 return errors;
}
