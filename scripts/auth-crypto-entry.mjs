import {pbkdf2} from '@noble/hashes/pbkdf2.js';
import {sha256} from '@noble/hashes/sha2.js';
import {bytesToHex,hexToBytes} from '@noble/hashes/utils.js';

// Apps Script V8 does not need TextEncoder or any network/Node API for this bundle.
function utf8(text){
 const bytes=[];
 for(const char of text){let n=char.codePointAt(0);if(n>=0xd800&&n<=0xdfff)n=0xfffd;
  if(n<128)bytes.push(n);else if(n<2048)bytes.push(192|(n>>6),128|(n&63));
  else if(n<65536)bytes.push(224|(n>>12),128|((n>>6)&63),128|(n&63));
  else bytes.push(240|(n>>18),128|((n>>12)&63),128|((n>>6)&63),128|(n&63));
 }
 return Uint8Array.from(bytes);
}
export function derive(password,salt,iterations){return bytesToHex(pbkdf2(sha256,utf8(password),hexToBytes(salt),{c:iterations,dkLen:32}));}
