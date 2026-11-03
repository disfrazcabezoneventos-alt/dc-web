import original from './playwright.config.mjs';
export default {...original,testMatch:['rental-promotions.spec.mjs'],outputDir:'./tmp/promotions-playwright',projects:[
 {name:'desktop',use:{viewport:{width:1440,height:1000}}},
 {name:'mobile-360',use:{viewport:{width:360,height:640},isMobile:true,hasTouch:true}},
 {name:'mobile-390',use:{viewport:{width:390,height:844},isMobile:true,hasTouch:true}},
 {name:'tablet-768',use:{viewport:{width:768,height:1024},isMobile:true,hasTouch:true}}
],webServer:{command:'node scripts/serve-static-tests.mjs',url:'http://127.0.0.1:3017/',reuseExistingServer:false,timeout:30000}};
