import {test,expect} from '@playwright/test';

test.beforeEach(async({page})=>{
 page.on('pageerror',error=>{throw error;});
});

async function sign(page){
 await page.getByRole('button',{name:'Review & sign',exact:true}).click();
 await page.locator('#review-confirm').check();
 await page.getByRole('button',{name:'Sign demo note',exact:true}).click();
 await expect(page.locator('#note-text')).toHaveAttribute('readonly','');
}

test('patient selection survives reload and keeps signed amendments isolated',async({page})=>{
 await page.goto('/#N');
 await page.getByRole('button',{name:'Load sample note',exact:true}).click();
 const original=await page.locator('#note-text').inputValue();
 await sign(page);
 await page.locator('#active-patient').selectOption('DEMO-002');
 await expect(page.locator('#note-text')).toHaveValue('');
 await page.getByRole('button',{name:'Load sample note',exact:true}).click();
 await expect(page.locator('#note-text')).toHaveValue(/Alex Taylor/);
 await page.reload();
 await expect(page.locator('#active-patient')).toHaveValue('DEMO-002');
 await page.locator('#active-patient').selectOption('DEMO-001');
 await expect(page.locator('#note-text')).toHaveValue(original);
 await page.getByRole('button',{name:'Create amendment',exact:true}).click();
 await page.locator('#note-text').fill('Amended fictional administrative note');
 await sign(page);
 await page.getByRole('button',{name:'Version history ↗',exact:true}).click();
 await expect(page.getByRole('dialog')).toContainText('Amended fictional administrative note');
 await expect(page.getByRole('dialog')).toContainText(original);
});

test('review requires confirmation and cancelling allows a fresh exact-text review',async({page})=>{
 await page.goto('/#N');
 await page.getByRole('button',{name:'Load sample note',exact:true}).click();
 await page.getByRole('button',{name:'Review & sign',exact:true}).click();
 await page.getByRole('button',{name:'Sign demo note',exact:true}).click();
 await expect(page.getByRole('dialog')).toBeVisible();
 await page.keyboard.press('Escape');
 await expect(page.getByRole('dialog')).not.toBeVisible();
 await page.locator('#note-text').fill('Exact reviewed fictional text');
 await page.getByRole('button',{name:'Review & sign',exact:true}).click();
 await expect(page.locator('.review-copy')).toHaveText('Exact reviewed fictional text');
 await expect(page.locator('#review-confirm')).not.toBeChecked();
 await page.locator('#review-confirm').check();
 await page.getByRole('button',{name:'Sign demo note',exact:true}).click();
 await expect(page.locator('#note-text')).toHaveAttribute('readonly','');
});

test('form edits invalidate review and approved export preserves provenance',async({page})=>{
 await page.goto('/#F');
 await page.locator('#active-patient').selectOption('DEMO-003');
 await page.getByRole('button',{name:'Fill from sample sources',exact:true}).click();
 for(let i=0;i<3;i++)await page.locator('#field-review-'+i).check();
 await expect(page.locator('#form-approve')).toBeEnabled();
 await page.locator('#form-field-1').fill('Friday afternoon');
 await expect(page.locator('#field-review-1')).not.toBeChecked();
 await expect(page.locator('#form-approve')).toBeDisabled();
 await page.locator('#field-review-1').check();
 await page.locator('#form-approve').click();
 await expect(page.locator('#form-field-1')).toHaveAttribute('readonly','');
 const downloadPromise=page.waitForEvent('download');
 await page.getByRole('button',{name:'Export approved demo form',exact:true}).click();
 const download=await downloadPromise;
 expect(download.suggestedFilename()).toBe('DEMO-003-demo-form.json');
 const stream=await download.createReadStream();const chunks=[];
 for await(const chunk of stream)chunks.push(chunk);
 const exported=JSON.parse(Buffer.concat(chunks).toString());
 expect(exported.patientId).toBe('DEMO-003');
 expect(exported.status).toBe('DEMO_APPROVED_NOT_SUBMITTED');
 expect(exported.fields[1]).toMatchObject({original:'Thursday morning',value:'Friday afternoon',reviewed:true});
 await page.getByRole('button',{name:'Reopen for editing',exact:true}).click();
 await expect(page.locator('#form-field-1')).toBeEditable();
 await expect(page.locator('#form-approve')).toBeDisabled();
});

test('switching patients stops capture and reset removes all records',async({page})=>{
 await page.goto('/#C');
 await page.getByRole('checkbox').check();
 await page.getByRole('button',{name:'Start simulation',exact:true}).click();
 await expect(page.getByRole('button',{name:'Pause simulation',exact:true})).toBeVisible();
 await page.locator('#active-patient').selectOption('DEMO-002');
 await expect(page.getByRole('button',{name:'Start simulation',exact:true})).toBeDisabled();
 await expect(page.getByRole('checkbox')).not.toBeChecked();
 await page.goto('/#settings');
 await page.getByRole('button',{name:'Reset demo data',exact:true}).click();
 await page.getByRole('button',{name:'Reset demo',exact:true}).click();
 await page.goto('/#C');
 await expect(page.locator('#active-patient')).toHaveValue('DEMO-001');
 await expect(page.getByRole('checkbox')).not.toBeChecked();
});

test('core pages fit the viewport and the keyboard can open and dismiss a dialog',async({page})=>{
 for(const route of ['home','patients','C','N','F','loops']){
  await page.goto('/#'+route);
  await expect(page.locator('#sidebar button[aria-current=page]')).toHaveAttribute('onclick',`nav('${route}')`);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),route+' overflow').toBe(true);
 }
 await page.goto('/#N');
 const button=page.getByRole('button',{name:'Load sample note',exact:true});
 await button.focus();await page.keyboard.press('Enter');
 await page.getByRole('button',{name:'Review & sign',exact:true}).focus();
 await page.keyboard.press('Enter');
 await expect(page.getByRole('dialog')).toBeVisible();
 await expect(page.getByRole('dialog')).toHaveAccessibleName(/Review Maya Collins/);
 await page.keyboard.press('Escape');
 await expect(page.getByRole('dialog')).not.toBeVisible();
});
