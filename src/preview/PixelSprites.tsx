import {ART_ASSETS} from './artAssets';
/** Pixel-art icons are authored as tiny exact-coordinate sprites; no external assets. */
export function DriverPortrait() {
  return <img src={`${import.meta.env.BASE_URL}${ART_ASSETS['driver-01']}`} width={96} height={96} alt="Portret kierowcy" className="pc-driver-art"/>;
}
export function CargoPixel({cargo}: {cargo:string}) {
  const png=ART_ASSETS[`cargo:${cargo}`];if(png)return <img src={`${import.meta.env.BASE_URL}${png}`} width={32} height={32} alt={cargo} className="pc-cargo-art"/>;
  const key=cargo.toLowerCase();
  const type=key.includes('ksi')?'books':key.includes('odzie')?'clothes':
    key.includes('zabaw')?'toy':key.includes('elektr')?'tech':
    key.includes('karma')?'feed':'box';
  return <svg viewBox="0 0 64 64" shapeRendering="crispEdges" role="img" aria-label={`Ładunek: ${cargo} - pixelart`}>
    <rect width="64" height="64" fill="#263642"/>
    <rect x="5" y="5" width="54" height="54" fill="#33434d"/>
    <rect x="8" y="53" width="48" height="5" fill="#17232c"/>
    {type==='books'&&<g><rect x="13" y="18" width="10" height="34" fill="#a36357"/><rect x="16" y="21" width="4" height="4" fill="#e5d4b5"/>
      <rect x="25" y="14" width="11" height="38" fill="#5a9c9e"/><rect x="28" y="20" width="5" height="4" fill="#e8cb9b"/>
      <rect x="38" y="22" width="11" height="30" fill="#d3b15d"/><rect x="41" y="27" width="5" height="3" fill="#e7dbc4"/></g>}
    {type==='clothes'&&<g><rect x="22" y="16" width="19" height="9" fill="#e4c990"/><rect x="14" y="24" width="36" height="11" fill="#6da3b2"/>
      <rect x="19" y="24" width="26" height="28" fill="#5693a2"/><rect x="15" y="34" width="8" height="8" fill="#427686"/>
      <rect x="41" y="34" width="8" height="8" fill="#427686"/><rect x="26" y="18" width="11" height="12" fill="#dcddd5"/></g>}
    {type==='toy'&&<g><rect x="20" y="19" width="25" height="26" fill="#d8aa58"/>
      <rect x="14" y="15" width="13" height="14" fill="#d6aa58"/><rect x="38" y="15" width="13" height="14" fill="#d6aa58"/>
      <rect x="23" y="28" width="6" height="6" fill="#282b31"/><rect x="37" y="28" width="6" height="6" fill="#282b31"/>
      <rect x="29" y="37" width="8" height="6" fill="#9b664d"/><rect x="15" y="42" width="14" height="10" fill="#c89748"/>
      <rect x="35" y="42" width="14" height="10" fill="#c89748"/></g>}
    {type==='tech'&&<g><rect x="13" y="15" width="40" height="29" fill="#151d24"/><rect x="16" y="18" width="34" height="23" fill="#81b5b6"/>
      <rect x="22" y="22" width="25" height="15" fill="#548a9b"/><rect x="28" y="44" width="12" height="7" fill="#a9b8bb"/>
      <rect x="20" y="51" width="28" height="3" fill="#718996"/><rect x="27" y="28" width="6" height="6" fill="#acc9c5"/></g>}
    {type==='feed'&&<g><rect x="17" y="19" width="30" height="32" fill="#b79c62"/><rect x="20" y="14" width="24" height="8" fill="#d3b97a"/>
      <rect x="23" y="30" width="18" height="15" fill="#e5cd9a"/><rect x="25" y="31" width="6" height="7" fill="#7a5840"/>
      <rect x="34" y="31" width="6" height="7" fill="#7a5840"/><rect x="29" y="39" width="7" height="5" fill="#7a5840"/></g>}
    {type==='box'&&<g><rect x="13" y="22" width="38" height="29" fill="#b58d5a"/><rect x="13" y="22" width="38" height="9" fill="#d4ac73"/>
      <rect x="31" y="22" width="6" height="29" fill="#77674d"/><rect x="35" y="33" width="12" height="6" fill="#e5cc9d"/></g>}
    <rect x="5" y="5" width="8" height="3" fill="#6b8990"/><rect x="5" y="5" width="3" height="9" fill="#6b8990"/>
  </svg>;
}
