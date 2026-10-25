// Offline export using the esbuild version already installed with Vite.
import {build} from 'esbuild';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const temporary=await mkdtemp(join(tmpdir(),'pixelcargo-preview-export-'));
try {
 const output=join(temporary,'export.mjs');
 await build({entryPoints:['scripts/preview/export.ts'],outfile:output,bundle:true,platform:'node',format:'esm',target:'node22'});
 await import(pathToFileURL(output).href);
} finally {await rm(temporary,{recursive:true,force:true})}
