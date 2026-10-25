import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
const output='/workspace/artifacts/myuno-ds-platform-audit-20261025/controls-browser';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',args:['--no-sandbox']});
const evidence=[];
for(const width of [390,1280]){
 const page=await browser.newPage({viewport:{width,height:900}});
 await page.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
 await page.goto('http://127.0.0.1:8917');
 const villa=page.getByRole('button',{name:'Villa One'});await villa.focus();await page.keyboard.press('Space');if(await villa.getAttribute('aria-pressed')!=='true')throw Error('Space did not select property');
 await page.screenshot({path:`${output}/controls-${width}.png`,fullPage:true});
 for(const name of ['Cherehapa','SafetyWing']){const link=page.getByRole('link',{name:new RegExp(name)});await link.focus();await page.keyboard.press('Enter');}
 if(await page.evaluate(()=>window.fixtureCalls.length)!==2)throw Error('Partner keyboard callback mismatch');
 await page.getByRole('link',{name:/Delegated Villa/}).focus();await page.keyboard.press('Tab');await page.keyboard.press('Shift+Tab');await page.screenshot({path:`${output}/delegated-focus-${width}.png`});
 await page.goto('http://127.0.0.1:8917?vendor');
 await page.getByLabel('Name (EN)').fill('Synthetic Vendor');
 await page.getByText('Phone',{exact:true}).click();
 if(!await page.getByLabel('Phone').evaluate(el=>el===document.activeElement))throw Error('Phone label did not focus field');
 await page.screenshot({path:`${output}/vendor-${width}.png`});
 await page.getByRole('button',{name:'Save',exact:true}).scrollIntoViewIfNeeded();await page.screenshot({path:`${output}/vendor-footer-${width}.png`});
 evidence.push({width,keyboardPartnerActivations:2,propertySpaceToggle:true,vendorLabelFocus:true});await page.close();
}
await writeFile(`${output}/evidence.json`,JSON.stringify(evidence,null,2));await browser.close();console.log(JSON.stringify(evidence));
