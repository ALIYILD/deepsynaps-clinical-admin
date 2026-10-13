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

test('hosted service check separates site availability from clinical connectivity',async({page})=>{
 await page.goto('/#settings');
 await page.locator('details.advanced-settings summary').click();
 await page.getByRole('button',{name:'Check hosted service'}).click();
 await expect(page.locator('#hosting-status')).toContainText('Site responding. Synthetic demonstration only.');
 await expect(page.locator('#hosting-status')).toContainText('Clinical OS is not connected.');
 await page.route('**/healthz',route=>route.fulfill({status:200,contentType:'text/html',body:'<html>Fallback page</html>'}));
 await page.getByRole('button',{name:'Check hosted service'}).click();
 await expect(page.locator('#hosting-status')).toContainText('Could not verify');
 await expect(page.getByRole('button',{name:'Check hosted service'})).toBeEnabled();
});
