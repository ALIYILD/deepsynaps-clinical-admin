import {test,expect} from '@playwright/test';

test.beforeEach(async({page})=>{
 page.on('pageerror',error=>{throw error;});
});

async function sign(page){
 await page.getByRole('button',{name:'Review document',exact:true}).click();
 await page.locator('#review-confirm').check();
 await page.getByRole('button',{name:'Record local review',exact:true}).click();
 await expect(page.locator('#note-text')).toHaveAttribute('readonly','');
}

async function switchPatient(page,name){
 await page.getByRole('button',{name:'Change active patient',exact:true}).click();
 await page.getByRole('dialog').getByRole('button',{name:new RegExp(name)}).click();
 await expect(page.getByRole('dialog')).not.toBeVisible();
 await expect(page.getByRole('region',{name:'Active patient'})).toContainText(name);
}

test('patient selection survives reload and keeps signed amendments isolated',async({page})=>{
 await page.goto('/#N');
 await page.getByRole('button',{name:'Load example',exact:true}).click();
 const original=await page.locator('#note-text').inputValue();
 await sign(page);
 await switchPatient(page,'Alex Taylor');
 await expect(page.locator('#note-text')).toHaveValue('');
 await page.getByRole('button',{name:'Load example',exact:true}).click();
 await expect(page.locator('#note-text')).toHaveValue(/Alex Taylor/);
 await page.reload();
 await expect(page.getByRole('region',{name:'Active patient'})).toContainText('DEMO-002');
 await switchPatient(page,'Maya Collins');
 await expect(page.locator('#note-text')).toHaveValue(original);
 await page.getByRole('button',{name:'Create amendment',exact:true}).click();
 await page.locator('#note-text').fill('Amended fictional administrative note');
 await sign(page);
 await page.getByRole('button',{name:'Version history',exact:true}).click();
 await expect(page.getByRole('dialog')).toContainText('Amended fictional administrative note');
 await expect(page.getByRole('dialog')).toContainText(original);
});

test('review requires confirmation and cancelling allows a fresh exact-text review',async({page})=>{
 await page.goto('/#N');
 await page.getByRole('button',{name:'Load example',exact:true}).click();
 await page.getByRole('button',{name:'Review document',exact:true}).click();
 await page.getByRole('button',{name:'Record local review',exact:true}).click();
 await expect(page.getByRole('dialog')).toBeVisible();
 await page.keyboard.press('Escape');
 await expect(page.getByRole('dialog')).not.toBeVisible();
 await page.locator('#note-text').fill('Exact reviewed fictional text');
 await page.getByRole('button',{name:'Review document',exact:true}).click();
 await expect(page.locator('.review-copy')).toHaveText('Exact reviewed fictional text');
 await expect(page.locator('#review-confirm')).not.toBeChecked();
 await page.locator('#review-confirm').check();
 await page.getByRole('button',{name:'Record local review',exact:true}).click();
 await expect(page.locator('#note-text')).toHaveAttribute('readonly','');
});

test('form edits invalidate review and approved export preserves provenance',async({page})=>{
 await page.goto('/#F');
 await switchPatient(page,'Sam Wilson');
 await page.getByRole('button',{name:'Fill from example sources',exact:true}).click();
 for(let i=0;i<3;i++)await page.locator('#field-review-'+i).check();
 await expect(page.locator('#form-final-review')).toBeEnabled();
 await page.locator('#form-field-1').fill('Friday afternoon');
 await expect(page.locator('#field-review-1')).not.toBeChecked();
 await expect(page.locator('#form-final-review')).toBeDisabled();
 await page.locator('#field-review-1').check();
 await page.locator('#form-final-review').click();
 await expect(page.getByRole('dialog')).toContainText('Friday afternoon');
 await page.locator('#form-final-confirm').check();
 await page.getByRole('button',{name:'Approve locally',exact:true}).click();
 await expect(page.locator('#form-field-1')).toHaveAttribute('readonly','');
 const downloadPromise=page.waitForEvent('download');
 await page.getByRole('button',{name:'Export source-linked JSON',exact:true}).click();
 const download=await downloadPromise;
 expect(download.suggestedFilename()).toBe('DEMO-003-demo-form.json');
 const stream=await download.createReadStream();const chunks=[];
 for await(const chunk of stream)chunks.push(chunk);
 const exported=JSON.parse(Buffer.concat(chunks).toString());
 expect(exported.patientId).toBe('DEMO-003');
 expect(exported.status).toBe('DEMO_APPROVED_NOT_SUBMITTED');
 expect(exported.fields[1]).toMatchObject({original:'Thursday morning',value:'Friday afternoon',reviewed:true});
 await page.getByRole('button',{name:'Reopen for editing',exact:true}).click();
 await page.getByRole('button',{name:'Open new version',exact:true}).click();
 await expect(page.locator('#form-field-1')).toBeEditable();
 await expect(page.locator('#form-final-review')).toBeDisabled();
});

test('switching patients stops capture and reset removes all records',async({page})=>{
 await page.goto('/#C');
 await page.locator('#consultation-identity').check();
 await page.locator('#consultation-consent').check();
 await page.getByRole('button',{name:'Start capture example',exact:true}).click();
 await expect(page.getByRole('button',{name:'Pause capture',exact:true})).toBeVisible();
 await switchPatient(page,'Alex Taylor');
 await expect(page.getByRole('button',{name:'Start capture example',exact:true})).toBeDisabled();
 await expect(page.locator('#consultation-identity')).not.toBeChecked();
 await expect(page.locator('#consultation-consent')).not.toBeChecked();
 await page.goto('/#settings');
 await page.locator('details.advanced-settings summary').click();
 await page.getByRole('button',{name:'Reset synthetic workspace',exact:true}).click();
 await page.getByRole('button',{name:'Reset demo',exact:true}).click();
 await page.goto('/#C');
 await expect(page.getByRole('region',{name:'Active patient'})).toContainText('DEMO-001');
 await expect(page.locator('#consultation-identity')).not.toBeChecked();
 await expect(page.locator('#consultation-consent')).not.toBeChecked();
});

test('core pages fit the viewport and the keyboard can open and dismiss a dialog',async({page})=>{
 const routes=[['home','home'],['patients','patients'],['record','patients'],['review','review'],['T','T'],['C','C'],['N','documents'],['documents','documents'],['F','F'],['E','E'],['I',null],['settings','settings'],['loops',null]];
 for(const [route,active] of routes){
  await page.goto('/#'+route);
  if(active)await expect(page.locator('#sidebar button[aria-current=page]')).toHaveAttribute('onclick',`nav('${active}')`);
  else await expect(page.locator('#main')).not.toBeEmpty();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),route+' overflow').toBe(true);
 }
 await page.goto('/#N');
 const button=page.getByRole('button',{name:'Load example',exact:true});
 await button.focus();await page.keyboard.press('Enter');
 await page.getByRole('button',{name:'Review document',exact:true}).focus();
 await page.keyboard.press('Enter');
 await expect(page.getByRole('dialog')).toBeVisible();
 await expect(page.getByRole('dialog')).toHaveAccessibleName(/Review document · Version 1/);
 await page.keyboard.press('Escape');
 await expect(page.getByRole('dialog')).not.toBeVisible();
});

test('template replacement keeps edited draft until confirmation and retains its history copy',async({page})=>{
 await page.goto('/#N');
 await page.locator('#note-text').fill('Manually edited fictional note to preserve');
 await page.locator('#note-template').selectOption('summary');
 await expect(page.getByRole('dialog')).toHaveAccessibleName('Keep a copy before replacing this draft?');
 await page.getByRole('button',{name:'Keep current draft',exact:true}).click();
 await expect(page.locator('#note-text')).toHaveValue('Manually edited fictional note to preserve');
 await expect(page.locator('#note-template')).toHaveValue('soap');
 await page.locator('#note-template').selectOption('summary');
 await page.getByRole('button',{name:'Save copy & load example',exact:true}).click();
 await expect(page.locator('#note-text')).toHaveValue(/YOUR APPOINTMENT SUMMARY/);
 await expect(page.locator('#note-template')).toHaveValue('summary');
 await page.getByRole('button',{name:'Version history',exact:true}).click();
 await expect(page.getByRole('dialog')).toContainText('Manually edited fictional note to preserve');
});

test('EPR drafts retain reviewed source and stay unsent after an amendment',async({page})=>{
 await page.goto('/#N');
 await page.getByRole('button',{name:'Load example',exact:true}).click();
 await sign(page);
 await page.goto('/#I');
 await page.getByRole('button',{name:'Prepare draft',exact:true}).click();
 await page.getByLabel('Intended EPR',{exact:true}).selectOption('rio');
 await page.getByLabel('Administrative handoff note (optional)',{exact:true}).fill('Fictional handoff for review');
 await page.getByRole('button',{name:'Review handoff draft',exact:true}).click();
 await page.locator('#epr-draft-confirm').check();
 await page.getByRole('button',{name:'Save local draft',exact:true}).click();
 await expect(page.locator('.epr-draft-row')).toHaveCount(1);
 await expect(page.locator('.epr-draft-row')).toContainText('Draft · Not sent');
 await page.getByRole('button',{name:'Inspect draft',exact:true}).click();
 await expect(page.getByRole('button',{name:'Send to EPR',exact:true})).toBeDisabled();
 await page.getByRole('button',{name:'Close',exact:true}).click();
 await page.goto('/#N');
 await page.getByRole('button',{name:'Create amendment',exact:true}).click();
 await page.locator('#note-text').fill('Amended fictional handoff source');
 await page.goto('/#I');
 await expect(page.locator('.epr-draft-row')).toContainText('Source changed · Review needed');
 await expect(page.getByRole('button',{name:'Prepare draft',exact:true})).toBeDisabled();
 await expect(page.locator('.epr-receipt-panel')).toContainText('None received');
});


test('mobile navigation contains keyboard focus, dismisses and returns focus',async({page,isMobile})=>{
 test.skip(!isMobile,'Mobile drawer behaviour');
 await page.goto('/#home');
 const toggle=page.locator('#navigation-toggle');
 await expect(page.locator('#sidebar')).toHaveJSProperty('inert',true);
 await toggle.click();
 const close=page.locator('.navigation-close');
 await expect(close).toBeFocused();
 await expect(toggle).toHaveAttribute('aria-expanded','true');
 await expect(page.locator('.shell')).toHaveJSProperty('inert',true);
 await page.keyboard.press('Shift+Tab');
 await expect(page.locator('.workspace-profile')).toBeFocused();
 await page.keyboard.press('Tab');await expect(close).toBeFocused();
 await page.keyboard.press('Escape');await expect(toggle).toBeFocused();
 await expect(page.locator('.shell')).toHaveJSProperty('inert',false);
 await toggle.click();
 await page.locator('#sidebar').getByRole('button',{name:'Patients',exact:true}).click();
 await expect(page).toHaveURL(/#patients$/);await expect(page.locator('#main')).toBeFocused();
 await expect(page.locator('#sidebar')).toHaveJSProperty('inert',true);
 await toggle.click();await page.locator('#navigation-backdrop').click({position:{x:350,y:300}});
 await expect(toggle).toBeFocused();
});

test('workspace navigation supports Back and Forward without losing patient edits',async({page})=>{
 await page.goto('/#N');
 await page.locator('#note-text').fill('Fictional draft retained across navigation');
 await page.getByRole('button',{name:'Overview',exact:true}).click();
 await expect(page).toHaveURL(/#record$/);
 await page.getByRole('button',{name:'Forms',exact:true}).click();
 await expect(page).toHaveURL(/#F$/);
 await page.goBack();await expect(page).toHaveURL(/#record$/);
 await expect(page).toHaveTitle('Patient record | DeepSynaps Clinical Admin');
 await page.goBack();await expect(page.locator('#note-text')).toHaveValue('Fictional draft retained across navigation');
 await page.goForward();await expect(page).toHaveTitle('Patient record | DeepSynaps Clinical Admin');
});

test('all workspace routes fit both colour themes and label the patient search',async({page})=>{
 const routes=['home','patients','record','C','N','documents','review','F','T','E','I','NHS','extensions','connections','organisation','settings','catalogue','delivery','loops'];
 for(const theme of ['light','dark']){
  await page.goto('/#home');
  if(await page.locator('html').getAttribute('data-theme')!==theme)await page.getByRole('button',{name:`Switch to ${theme} theme`,exact:true}).click();
  for(const route of routes){
   await page.goto('/#'+route);
   await expect(page.locator('#main')).not.toBeEmpty();
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),theme+' '+route+' overflow').toBe(true);
  }
 }
 await page.goto('/#patients');
 await page.getByRole('searchbox',{name:'Search patients by name or record ID',exact:true}).fill('Alex');
 await expect(page.locator('.patient-card')).toHaveCount(1);
});

test('team handover can go back to edit, reconfirm, and retry without duplicates',async({page})=>{
 await page.goto('/#N');await page.getByRole('button',{name:'Load example',exact:true}).click();await sign(page);
 await page.goto('/#T');
 async function prepare(){
  await page.getByRole('button',{name:'Prepare handover',exact:true}).click();
  await page.getByLabel('Intended recipient',{exact:true}).selectOption('Admin team');
  await page.getByLabel('Handover message',{exact:true}).fill('Fictional follow-up for the admin team');
  await page.getByRole('dialog').getByRole('button',{name:'Review draft',exact:true}).click();
 }
 await prepare();await page.locator('#handover-confirm').check();
 await page.getByRole('button',{name:'Back to edit',exact:true}).click();
 await expect(page.getByLabel('Intended recipient',{exact:true})).toHaveValue('Admin team');
 await expect(page.getByLabel('Handover message',{exact:true})).toHaveValue('Fictional follow-up for the admin team');
 await expect(page.getByLabel('Handover message',{exact:true})).toBeFocused();
 await page.getByRole('dialog').getByRole('button',{name:'Review draft',exact:true}).click();
 await expect(page.locator('#handover-confirm')).not.toBeChecked();
 await page.getByRole('button',{name:'Save draft',exact:true}).click();
 await expect(page.getByRole('dialog')).toBeVisible();
 await page.locator('#handover-confirm').check();await page.getByRole('button',{name:'Save draft',exact:true}).click();
 await expect(page.locator('.handover-card')).toHaveCount(1);
 await prepare();await page.locator('#handover-confirm').check();await page.getByRole('button',{name:'Save draft',exact:true}).click();
 await expect(page.locator('.handover-card')).toHaveCount(1);
 await prepare();await page.keyboard.press('Escape');
 expect(await page.evaluate(()=>pendingHandover)).toBeNull();
});

test('EPR handoff can return to edit without losing details or reusing confirmation',async({page})=>{
 await page.goto('/#N');await page.getByRole('button',{name:'Load example',exact:true}).click();await sign(page);
 await page.goto('/#I');await page.getByRole('button',{name:'Prepare draft',exact:true}).click();
 await page.getByLabel('Intended EPR',{exact:true}).selectOption('emis');
 await page.getByLabel('Administrative handoff note (optional)',{exact:true}).fill('Fictional handoff context to retain');
 await page.getByRole('button',{name:'Review handoff draft',exact:true}).click();
 await page.locator('#epr-draft-confirm').check();
 await page.getByRole('button',{name:'Back to edit',exact:true}).click();
 await expect(page.getByLabel('Intended EPR',{exact:true})).toHaveValue('emis');
 await expect(page.getByLabel('Administrative handoff note (optional)',{exact:true})).toHaveValue('Fictional handoff context to retain');
 await page.getByRole('button',{name:'Review handoff draft',exact:true}).click();
 await expect(page.locator('#epr-draft-confirm')).not.toBeChecked();
 expect(await page.locator('#dialog').evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
 await page.locator('#epr-draft-confirm').check();await page.getByRole('button',{name:'Save local draft',exact:true}).click();
 await expect(page.locator('.epr-draft-row')).toHaveCount(1);
 await expect(page.locator('.epr-draft-row')).toContainText('Draft · Not sent');
});

test('patient task board preserves explicit patient links and separates team tasks',async({page})=>{
 await page.goto('/#record');
 await page.getByRole('button',{name:'Change active patient',exact:true}).click();
 await page.getByRole('dialog').getByRole('button',{name:/Alex Taylor/}).click();
 await page.locator('#patient-follow-up').getByRole('button',{name:'Add task',exact:true}).click();
 await page.getByLabel('Task description',{exact:true}).fill('Fictional Alex follow-up');
 await page.getByRole('button',{name:'Save task',exact:true}).click();
 await page.getByRole('button',{name:'View this patient’s tasks',exact:true}).click();
 await expect(page.getByLabel('Patient or team',{exact:true})).toHaveValue('DEMO-002');
 await expect(page.locator('.coordination-task')).toHaveCount(1);
 await page.getByRole('button',{name:'Details',exact:false}).count();
 await page.getByRole('button',{name:'Edit task: Fictional Alex follow-up',exact:true}).click();
 await expect(page.getByRole('dialog')).toContainText('DEMO-002 · Linked patient cannot be changed here');
 await page.getByRole('button',{name:'Cancel',exact:true}).click();
 await page.getByLabel('Search tasks',{exact:true}).fill('DEMO-002');
 await expect(page.locator('.coordination-task')).toHaveCount(1);
 await page.getByLabel('Patient or team',{exact:true}).selectOption('team');
 await expect(page.locator('.coordination-task')).toHaveCount(0);
 await page.getByLabel('Search tasks',{exact:true}).fill('');
 await expect(page.locator('.coordination-task')).toHaveCount(3);
 await page.getByLabel('Patient or team',{exact:true}).selectOption('DEMO-002');
 await page.getByRole('button',{name:'Open patient record: DEMO-002',exact:true}).click();
 await expect(page.getByRole('region',{name:'Active patient'})).toContainText('Alex Taylor');
});
