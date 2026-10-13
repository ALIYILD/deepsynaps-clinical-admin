import {test,expect} from '@playwright/test';

async function blockStorage(page){
 await page.evaluate(()=>{
  const original=Storage.prototype.setItem;
  window.restoreDemoStorage=()=>{Storage.prototype.setItem=original;};
  Storage.prototype.setItem=function(key,value){
   if(key==='clinical-admin-demo-v1')throw new DOMException('Simulated quota failure','QuotaExceededError');
   return original.call(this,key,value);
  };
 });
}

test('team task and handover failures recover without duplicate drafts',async({page})=>{
 await page.goto('/#N');
 await page.getByRole('button',{name:'Load example',exact:true}).click();
 await page.getByRole('button',{name:'Review document',exact:true}).click();
 await page.locator('#review-confirm').check();
 await page.getByRole('button',{name:'Record local review',exact:true}).click();
 await page.goto('/#T');await blockStorage(page);
 await page.getByRole('button',{name:'Add task',exact:true}).click();
 await page.getByLabel('Task description', {exact:true}).fill('Fictional task held during outage');
 await page.getByRole('button',{name:'Save task',exact:true}).click();
 await expect(page.locator('#toast')).toContainText('Saving failed');
 await page.getByRole('button',{name:'Prepare handover',exact:true}).click();
 await page.getByLabel('Handover message', {exact:true}).fill('Fictional handover held during outage');
 await page.getByRole('button',{name:'Review draft',exact:true}).click();
 await page.locator('#handover-confirm').check();
 await page.getByRole('button',{name:'Save draft',exact:true}).click();
 await expect(page.locator('#toast')).toContainText('Saving failed. Not sent');
 await page.evaluate(()=>window.restoreDemoStorage());
 await page.getByRole('button',{name:'Retry saving',exact:true}).click();
 await page.reload();
 const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('clinical-admin-demo-v1')));
 expect(stored.tasks.filter(t=>t.text==='Fictional task held during outage')).toHaveLength(1);
 expect(stored.handoverDrafts).toHaveLength(1);
 expect(stored.handoverDrafts[0]).toMatchObject({message:'Fictional handover held during outage',deliveryStatus:'not-sent'});
 await expect(page.locator('#storage-status')).toBeHidden();
});

test('patient agenda reports failed writes and refreshes after recovery',async({page})=>{
 await page.goto('/#record');await blockStorage(page);
 await page.locator('#preparation-note').fill('Fictional appointment agenda');
 await expect(page.locator('#prep-note-status')).toContainText('Not saved');
 await page.goto('/#N');await page.goto('/#record');
 await expect(page.locator('#prep-note-status')).toContainText('Not saved');
 await page.evaluate(()=>window.restoreDemoStorage());
 await page.getByRole('button',{name:'Retry saving',exact:true}).click();
 await expect(page.locator('#prep-note-status')).toContainText('Kept in this browser');
 await page.reload();
 await expect(page.locator('#preparation-note')).toHaveValue('Fictional appointment agenda');
});

for(const original of ['{broken-json','{"tasks":{},"settings":{}}']){
 test(`unreadable saved workspace is preserved until confirmed reset: ${original}`,async({page})=>{
  await page.goto('/');
  await page.evaluate(raw=>localStorage.setItem('clinical-admin-demo-v1',raw),original);
  await page.reload();
  await expect(page.locator('#storage-status')).toContainText('could not be loaded');
  await page.goto('/#N');
  await page.getByRole('button',{name:'Load example',exact:true}).click();
  await expect(page.locator('#storage-status')).toBeVisible();
  expect(await page.evaluate(()=>localStorage.getItem('clinical-admin-demo-v1'))).toBe(original);
  const pending=page.waitForEvent('download');
  await page.getByRole('button',{name:'Export original saved value',exact:true}).click();
  const stream=await(await pending).createReadStream();const chunks=[];
  for await(const chunk of stream)chunks.push(chunk);
  expect(JSON.parse(Buffer.concat(chunks).toString()).original).toBe(original);
  await page.goto('/#settings');
  await page.locator('details.advanced-settings summary').click();
  await page.getByRole('button',{name:'Reset synthetic workspace',exact:true}).click();
  await page.getByRole('button',{name:'Cancel',exact:true}).click();
  expect(await page.evaluate(()=>localStorage.getItem('clinical-admin-demo-v1'))).toBe(original);
  await page.getByRole('button',{name:'Reset synthetic workspace',exact:true}).click();
  await page.getByRole('button',{name:'Reset demo',exact:true}).click();
  await expect(page.locator('#storage-status')).toBeHidden();
  await page.reload();
  await expect(page.locator('#storage-status')).toBeHidden();
  await expect(page.getByRole('heading',{name:'My workspace'})).toBeVisible();
 });
}

for(const failure of ['QuotaExceededError','SecurityError']){
 test(`${failure} is visible and retry preserves the reviewed note after reload`,async({page})=>{
  await page.goto('/#N');
  await page.evaluate(name=>{
   window.restoreDemoStorage=()=>{Storage.prototype.setItem=original;};
   const original=Storage.prototype.setItem;
   Storage.prototype.setItem=function(key,value){
    if(key==='clinical-admin-demo-v1')throw new DOMException('Simulated storage failure',name);
    return original.call(this,key,value);
   };
  },failure);
  await page.getByRole('button',{name:'Load example',exact:true}).click();
  await page.locator('#note-text').fill('Fictional reviewed note retained during a storage failure');
  await page.getByRole('button',{name:'Save draft copy',exact:true}).click();
  await expect(page.locator('#toast')).toContainText('Saving failed');
  await expect(page.locator('#storage-status')).toBeVisible();
  await expect(page.locator('#storage-status')).toContainText('Changes are not saved');
  await page.getByRole('button',{name:'Review document',exact:true}).click();
  await page.locator('#review-confirm').check();
  await page.getByRole('button',{name:'Record local review',exact:true}).click();
  await expect(page.locator('#storage-status')).toBeVisible();
  await page.getByRole('button',{name:'Retry saving',exact:true}).click();
  await expect(page.locator('#storage-status')).toBeVisible();
  await page.evaluate(()=>window.restoreDemoStorage());
  await page.getByRole('button',{name:'Retry saving',exact:true}).click();
  await expect(page.locator('#storage-status')).toBeHidden();
  await page.reload();
  await expect(page.locator('#note-text')).toHaveValue('Fictional reviewed note retained during a storage failure');
  await expect(page.locator('#note-text')).toHaveAttribute('readonly','');
 });
}

test('stale tabs preserve the newer signed note and can export then reload',async({page,context})=>{
 await page.goto('/#N');
 await page.getByRole('button',{name:'Load example',exact:true}).click();
 const stale=await context.newPage();await stale.goto('/#N');
 await page.locator('#note-text').fill('Newer signed fictional note from the first tab');
 await page.getByRole('button',{name:'Review document',exact:true}).click();
 await page.locator('#review-confirm').check();
 await page.getByRole('button',{name:'Record local review',exact:true}).click();
 await expect(stale.locator('#storage-status')).toContainText('Another tab');
 await stale.locator('#note-text').fill('Unsaved stale-tab edit for recovery');
 await stale.getByRole('button',{name:'Save draft copy',exact:true}).click();
 await expect(stale.getByRole('button',{name:'Retry saving',exact:true})).toBeHidden();
 const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('clinical-admin-demo-v1')));
 expect(stored.patientRecords['DEMO-001']).toMatchObject({note:'Newer signed fictional note from the first tab',signed:true});
 const pending=stale.waitForEvent('download');
 await stale.getByRole('button',{name:'Export this tab',exact:true}).click();
 const stream=await(await pending).createReadStream();const chunks=[];
 for await(const chunk of stream)chunks.push(chunk);
 const exported=JSON.parse(Buffer.concat(chunks).toString());
 expect(exported.status).toBe('DEMO_LOCAL_RECOVERY_NOT_FOR_IMPORT');
 expect(exported.workspace.patientRecords['DEMO-001'].note).toBe('Unsaved stale-tab edit for recovery');
 await stale.getByRole('button',{name:'Reload saved version',exact:true}).click();
 await stale.getByRole('button',{name:'Keep this tab',exact:true}).click();
 await expect(stale.locator('#note-text')).toHaveValue('Unsaved stale-tab edit for recovery');
 await stale.getByRole('button',{name:'Reload saved version',exact:true}).click();
 await stale.getByRole('button',{name:'Discard tab changes and reload',exact:true}).click();
 await expect(stale.locator('#note-text')).toHaveValue('Newer signed fictional note from the first tab');
 await expect(stale.locator('#note-text')).toHaveAttribute('readonly','');
 await expect(stale.locator('#storage-status')).toBeHidden();
});

test('invalid nested UI storage opens a recoverable preview without renderer errors',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/#record');
 await page.locator('#preparation-note').fill('Preserved fictional agenda');
 const original=await page.evaluate(()=>JSON.parse(localStorage.getItem('clinical-admin-demo-v1')));
 for(const extra of [
  {consultationUi:{'DEMO-001':null}},
  {patientPreparation:{'DEMO-001':{checks:null,note:'Agenda',fingerprint:null}}},
  {formUi:{'DEMO-001':{version:1,history:[{version:1,status:'Approved locally',snapshot:{patientId:'DEMO-002',fields:[]}}]}}},
  {handoverDrafts:[null]}
 ]){
  const raw=JSON.stringify({...original,...extra});
  await page.evaluate(value=>localStorage.setItem('clinical-admin-demo-v1',value),raw);
  await page.reload();
  await expect(page.locator('#storage-message')).toContainText('could not be loaded');
  await expect(page.locator('#storage-original')).toBeVisible();
  for(const route of ['C','F','T','record'])await page.goto('/#'+route);
  await page.locator('#preparation-note').fill('Temporary preview edit');
  expect(await page.evaluate(()=>localStorage.getItem('clinical-admin-demo-v1'))).toBe(raw);
 }
 expect(errors).toEqual([]);
});
