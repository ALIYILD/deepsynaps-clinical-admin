import {test,expect} from '@playwright/test';

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
  await page.getByRole('button',{name:'Load sample note',exact:true}).click();
  await page.locator('#note-text').fill('Fictional reviewed note retained during a storage failure');
  await page.getByRole('button',{name:'Save draft',exact:true}).click();
  await expect(page.locator('#toast')).toContainText('Saving failed');
  await expect(page.locator('#storage-status')).toBeVisible();
  await expect(page.locator('#storage-status')).toContainText('Changes are not saved');
  await page.getByRole('button',{name:'Review & sign',exact:true}).click();
  await page.locator('#review-confirm').check();
  await page.getByRole('button',{name:'Sign demo note',exact:true}).click();
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
