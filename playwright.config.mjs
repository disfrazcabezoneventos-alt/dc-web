import {defineConfig,devices} from '@playwright/test';

export default defineConfig({
 testDir:'./tests/e2e',timeout:60000,retries:0,workers:1,reporter:'list',
 use:{baseURL:'http://127.0.0.1:3017',headless:true,launchOptions:{executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}},
 projects:[
  {name:'desktop',use:{...devices['Desktop Chrome']}},
  {name:'mobile-360',use:{...devices['Desktop Chrome'],viewport:{width:360,height:780},isMobile:true,hasTouch:true}},
  {name:'mobile-390',use:{...devices['Desktop Chrome'],viewport:{width:390,height:844},isMobile:true,hasTouch:true}},
  {name:'tablet-768',use:{...devices['Desktop Chrome'],viewport:{width:768,height:1024},isMobile:true,hasTouch:true}}
 ],
 webServer:{command:'npm run dev -- --port 3017',url:'http://127.0.0.1:3017/cotillon/',reuseExistingServer:false,timeout:120000,env:{NEXT_PUBLIC_APPS_SCRIPT_URL:'https://script.google.com/macros/s/mock/exec'}}
});
