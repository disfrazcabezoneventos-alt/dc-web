import {build} from 'esbuild';
import fs from 'node:fs/promises';
await build({entryPoints:['scripts/auth-crypto-entry.mjs'],bundle:true,format:'iife',globalName:'DcPasswords',platform:'neutral',target:'es2020',charset:'ascii',minify:false,legalComments:'inline',outfile:'backend/AuthCrypto.gs',banner:{js:'/* GENERATED: node scripts/generate-auth-crypto.mjs. @noble/hashes, MIT; see backend/AUTH_CRYPTO_LICENSE.txt. No credentials. */'}});
await fs.copyFile('node_modules/@noble/hashes/LICENSE','backend/AUTH_CRYPTO_LICENSE.txt');
