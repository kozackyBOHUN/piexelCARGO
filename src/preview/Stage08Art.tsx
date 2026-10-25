import {ART_ASSETS} from './artAssets';
import {PixelIcon,type IconName} from '../ui/PixelIcon';
export function ActionIcon({id}:{id:string}){return ART_ASSETS[id]?<img aria-hidden="true" alt="" className="pc-ui-art" src={`${import.meta.env.BASE_URL}${ART_ASSETS[id]}`}/>:null}
export function GameIcon({name}:{name:IconName}){const ids:Record<IconName,string>={base:'icon-base',map:'icon-map',cargo:'icon-dispatch',driver:'icon-drivers',finance:'icon-finances',vehicle:'icon-parking',history:'icon-save',settings:'icon-settings',clock:'icon-route'};return ART_ASSETS[ids[name]]?<ActionIcon id={ids[name]}/>:<PixelIcon name={name}/>}
