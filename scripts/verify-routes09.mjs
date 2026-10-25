// Reconstruct/audit supplied geometries against the unchanged local graph; no routing regeneration.
import {build} from 'esbuild';
import {execFileSync} from 'node:child_process';
execFileSync('python3',['-c',"import zipfile; zipfile.ZipFile('data/sources/etap09.zip').extractall('/tmp/pixelcargo09-input')"],{stdio:'inherit'});
execFileSync('python3',['/tmp/pixelcargo09-input/VERIFY_DATA.py'],{cwd:'/tmp/pixelcargo09-input',stdio:'inherit'});
await build({entryPoints:['scripts/routes09/check.ts'],outfile:'/tmp/pixelcargo09-audit.mjs',bundle:true,platform:'node',format:'esm',target:'node22'});
await import('file:///tmp/pixelcargo09-audit.mjs');
