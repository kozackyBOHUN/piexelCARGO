import type {LonLat} from '../world/geography';
import type {TransportRoute} from './gameplay';
const cumulativeCache=new WeakMap<readonly LonLat[],Float64Array>();
function cumulative(points:readonly LonLat[]){
 let lengths=cumulativeCache.get(points);if(lengths)return lengths;
 lengths=new Float64Array(points.length);const rad=Math.PI/180;
 for(let i=1;i<points.length;i++){
  const a=points[i-1],b=points[i];const h=Math.sin((b[1]-a[1])*rad/2)**2+Math.cos(a[1]*rad)*Math.cos(b[1]*rad)*Math.sin((b[0]-a[0])*rad/2)**2;
  lengths[i]=lengths[i-1]+12742017.6*Math.asin(Math.min(1,Math.sqrt(h)));
 }cumulativeCache.set(points,lengths);return lengths;
}
export function pointOnRoute(route:TransportRoute,fraction:number):LonLat {
 const points=route.geometry;if(!points.length)throw new Error('Brak geometrii trasy.');
 if(fraction<=0||points.length===1)return points[0];if(fraction>=1)return points.at(-1)!;
 const lengths=cumulative(points),target=lengths.at(-1)!*fraction;let low=0,high=points.length-1;
 while(low+1<high){const mid=(low+high)>>1;if(lengths[mid]<target)low=mid;else high=mid}
 const size=lengths[high]-lengths[low],t=size?(target-lengths[low])/size:0;
 return [points[low][0]+(points[high][0]-points[low][0])*t,points[low][1]+(points[high][1]-points[low][1])*t];
}
