// Offline diagnostic only. esbuild is installed with the existing Vite dependency.
import {build} from 'esbuild';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const temporary=await mkdtemp(join(tmpdir(),'pixelcargo-road-check-'));
try {
 const output=join(temporary,'verify.mjs');
 await build({entryPoints:['scripts/preview/verify.ts'],outfile:output,bundle:true,platform:'node',format:'esm',target:'node22'});
 await import(pathToFileURL(output).href);
} finally {await rm(temporary,{recursive:true,force:true})}
