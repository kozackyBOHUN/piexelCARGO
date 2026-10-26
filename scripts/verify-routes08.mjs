import {build} from 'esbuild';
await build({entryPoints:['scripts/routes08/verify.ts'],outfile:'/tmp/pixelcargo-verify08.mjs',bundle:true,platform:'node',format:'esm',target:'node22'});await import('file:///tmp/pixelcargo-verify08.mjs');
