/** Reproduce from supplied certified geometries and frozen safety metadata, never download/regenerate OSM. */
import {build} from 'esbuild';import {execFileSync} from 'node:child_process';import {readFileSync,writeFileSync} from 'node:fs';import {gunzipSync} from 'node:zlib';
execFileSync('python3',['-c',"import zipfile; zipfile.ZipFile('data/sources/etap11.zip').extractall('/tmp/pixelcargo11-input')"],{stdio:'inherit'});
execFileSync('python3',['/tmp/pixelcargo11-input/qa/verify_bundle.py'],{stdio:'inherit'});
execFileSync('node',['scripts/routes11/build_preferred_catalog.mjs','--project','.','--allow-18-regression-fix'],{stdio:'inherit'});
writeFileSync('/tmp/11-source-safety.json',gunzipSync(readFileSync('data/sources/etap11-safety.json.gz')));
for(const name of ['check','independent','diagnoseLower','sourceCertificate','package']){
 await build({entryPoints:[`scripts/routes11/${name}.ts`],outfile:`/tmp/11-${name}.mjs`,bundle:true,platform:'node',format:'esm'});
 execFileSync('node',['--max-old-space-size=6144',`/tmp/11-${name}.mjs`],{stdio:'inherit'});
}

execFileSync('node',['scripts/routes11/finalGate.mjs'],{stdio:'inherit'});
