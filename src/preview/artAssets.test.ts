import {it,expect} from 'vitest';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import manifest from '../../public/art/manifest.json';
import appearance from '../../public/art/appearance_mapping.json';
import {ART_ASSETS} from './artAssets';
import {GOODS} from './market';
it('uses only the 52 approved byte-identical stage08 PNG and the explicit appearance mapping',()=>{
 expect(manifest.items).toHaveLength(52);for(const a of manifest.items){const file=readFileSync(a.path);expect(createHash('sha256').update(file).digest('hex')).toBe(a.sha256);expect(file.readUInt32BE(16)).toBe(a.width);expect(file.readUInt32BE(20)).toBe(a.height)}
 for(const [id,path] of Object.entries(appearance.usedVanOfferIdToApprovedImage))expect(ART_ASSETS[`vehicle:${id}`]).toBe(path.replace(/^public\//,''));
 expect(readdirSync('public/art/vehicles').sort()).toEqual(['van-used-14.png','van-used-15.png','van-used-6.png','van-used-7.png','van-used-8.png']);
 for(const g of GOODS)expect(ART_ASSETS[`cargo:${g[0]}`]).toMatch(/^art\/cargo\/cargo-\d\d.png$/);
});
