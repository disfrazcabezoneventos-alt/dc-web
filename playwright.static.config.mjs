import base from './playwright.config.mjs';

// Run after a build with NEXT_PUBLIC_APPS_SCRIPT_URL set to the mock endpoint.
// This configuration serves out/ only on the loopback interface.
export default {...base,
 webServer:{command:'node scripts/serve-static-tests.mjs',url:'http://127.0.0.1:3017/admin/',reuseExistingServer:false,timeout:20000}
};
