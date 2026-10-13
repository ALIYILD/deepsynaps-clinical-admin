import {defineConfig} from '@playwright/test';

export default defineConfig({
 testDir:'./tests/browser',
 fullyParallel:true,
 forbidOnly:!!process.env.CI,
 retries:0,
 reporter:[['list'],['html',{open:'never'}]],
 use:{baseURL:'http://127.0.0.1:4179',trace:'retain-on-failure',screenshot:'only-on-failure'},
 projects:[
  {name:'chromium-desktop',use:{browserName:'chromium',viewport:{width:1440,height:1000}}},
  {name:'chromium-mobile',use:{browserName:'chromium',viewport:{width:390,height:844},isMobile:true,hasTouch:true}}
 ],
 webServer:{command:'node scripts/serve.mjs',env:{HOST:'127.0.0.1',PORT:'4179',CLINICAL_ADMIN_SERVER_ADAPTER:''},url:'http://127.0.0.1:4179',reuseExistingServer:false}
});
