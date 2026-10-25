import { chromium } from 'playwright';
import { writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
const output=path.resolve(process.env.DS_CONTROLS_OUTPUT||'/tmp/browser/ds-controls');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH || (process.env.CI?undefined:'/usr/bin/chromium'),args:['--no-sandbox']});
const evidence=[];
for(const width of [390,1280]){
 const page=await browser.newPage({viewport:{width,height:900}});
 const errors=[],blocked=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.route('**/*',async route=>{const u=new URL(route.request().url()),name=u.pathname==='/'?'index.html':u.pathname.slice(1);if(u.hostname==='127.0.0.1'&&route.request().method()==='GET'&&['index.html','fixture.css','fixture.js'].includes(name))await route.fulfill({body:await readFile(path.join(output,name)),contentType:name.endsWith('.html')?'text/html':name.endsWith('.css')?'text/css':'application/javascript'});else{blocked.push(route.request().url());await route.abort();}});
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
 if(errors.length||blocked.length)throw Error(JSON.stringify({errors,blocked}));
 evidence.push({width,keyboardPartnerActivations:2,propertySpaceToggle:true,vendorLabelFocus:true});await page.close();
}
await writeFile(`${output}/evidence.json`,JSON.stringify(evidence,null,2));await browser.close();console.log(JSON.stringify(evidence));
