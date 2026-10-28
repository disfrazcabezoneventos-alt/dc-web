import {fileURLToPath} from 'node:url';
import original from '../../../playwright.config.mjs';
export default {
 ...original,
 testDir:fileURLToPath(new URL('../../../tests/e2e',import.meta.url)),
 outputDir:fileURLToPath(new URL('./test-results',import.meta.url)),
 webServer:{
  command:'node docs/qa/mobile-actions/serve-static.mjs',
  cwd:fileURLToPath(new URL('../../../',import.meta.url)),
  url:'http://127.0.0.1:3017/cotillon/',
  reuseExistingServer:false,
  timeout:30000
 }
};
