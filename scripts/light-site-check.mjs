import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Browser, sleep } from '../.claude/skills/taste-skill/scripts/lib/cdp.mjs';
const base=process.env.UI_CHECK_URL || 'http://localhost:3001';
const out=resolve('.taste-skill/light-site/qa');mkdirSync(out,{recursive:true});
const browser=await Browser.launch();const page=await browser.newPage({width:1440,height:1000});
const checks=[];
function assert(value,label){checks.push({label,passed:!!value});if(!value)throw Error(label);}
async function wait(fn,label){for(let i=0;i<80;i++){if(await page.eval(fn))return;await sleep(250);}throw Error(label);}
async function go(path){await page.goto(base+path,{timeoutMs:90000,settleMs:1200});}
async function snap(name){await page.screenshot({path:resolve(out,name+'.png'),format:'png'});}
async function key(key,code=key){await page.send('Input.dispatchKeyEvent',{type:'keyDown',key,code});await page.send('Input.dispatchKeyEvent',{type:'keyUp',key,code});}
try {
 await go('/');await wait(()=>document.querySelector('.ax-canvas')?.dataset.frame !== undefined,'Film canvas did not initialize');
 assert(await page.eval(()=>document.querySelectorAll('.site-navigation').length===1 && document.querySelectorAll('h1').length===1),'Homepage has one shared navigation and one hero');
 assert(await page.eval(()=>!document.querySelector('.ax-progress') && !document.body.textContent.includes('Loading frames')),'Film has no numeric loading interface');
 await snap('home-opening');
 await page.wheel(1100);await sleep(1800);
 const forward=await page.eval(()=>Number(document.querySelector('.ax-canvas').dataset.frame));
 assert(forward>20,'Film advances with scroll');await snap('home-film-middle');
 await page.wheel(-650);await sleep(1700);
 assert(await page.eval(()=>Number(document.querySelector('.ax-canvas').dataset.frame))<forward,'Film reverses with scroll');
 await page.eval(()=>document.querySelector('#workspace-showcase').scrollIntoView());await sleep(1200);
 assert(await page.eval(()=>getComputedStyle(document.querySelector('.showcase-workspace')).transform==='none'),'Centre dashboard is straight');
 assert(await page.eval(()=>document.querySelector('.ax-heroModule').compareDocumentPosition(document.querySelector('#workspace-showcase')) & Node.DOCUMENT_POSITION_FOLLOWING),'Film leads into workspace showcase');await snap('straight-workspace');
 await page.eval(()=>document.querySelector('#intelligence').scrollIntoView());await sleep(1000);
 assert(await page.eval(()=>!getComputedStyle(document.querySelector('.experience-screen')).transform.includes('matrix3d')),'Scrolling workspace has no perspective rotation');
 await go('/products');await wait(()=>Object.keys(document.querySelector('.product-tabs button')).some(k=>k.startsWith('__reactProps')),'Products did not hydrate');
 for(let i=0;i<6;i++){
  await page.eval(i=>{document.querySelectorAll('.product-tabs button')[i].click();return true;},i);await sleep(600);
  assert(await page.eval(i=>document.querySelectorAll('.product-tabs button')[i].getAttribute('aria-selected')==='true',i),'Product selector '+(i+1)+' works');
  if(i===1){await page.eval(()=>{document.querySelector('.product-stage .preview-action').click();return true;});assert(await page.eval(()=>document.querySelector('.product-stage .preview-action').textContent.includes('Reset')),'Document validation control responds');}
  if(i===3){const before=await page.eval(()=>document.querySelector('.lab-metric-row strong').textContent);await page.eval(()=>{document.querySelector('input[aria-label="Demo minimum score"]').focus();return true;});await key('ArrowRight');await sleep(300);assert(await page.eval(()=>document.querySelector('.lab-metric-row strong').textContent)!==before,'Policy slider updates derived outcomes');}
  if(i===4){await page.eval(()=>{const e=document.querySelector('select[aria-label="Demo portfolio sector"]');e.value='Manufacturing';e.dispatchEvent(new Event('change',{bubbles:true}));return true;});await sleep(250);assert(await page.eval(()=>document.querySelector('.lab-metric-row strong').textContent==='24'),'Portfolio filter updates cohort');}
  if(i===5){await page.eval(()=>{document.querySelector('.lab-mapping button').click();return true;});assert(await page.eval(()=>document.querySelector('.lab-metric-row strong').textContent.startsWith('4')),'Reporting confirmation resolves sample exception');await page.eval(()=>{document.querySelector('.product-stage').scrollIntoView({block:'center'});return true;});await sleep(600);await snap('products-reporting');}
 }
 await page.eval(()=>{document.querySelector('.product-tabs [aria-selected=true]').focus();return true;});await key('Home');await sleep(500);assert(await page.eval(()=>document.querySelector('.product-tabs button').getAttribute('aria-selected')==='true'),'Product tabs support keyboard Home');
 await page.eval(()=>{document.querySelector('.product-stage').scrollIntoView({block:'center'});return true;});await sleep(700);await snap('products-analysis');
 await go('/solutions');
 for(let i=0;i<4;i++){
  await page.eval(i=>{document.querySelectorAll('.solution-tabs button')[i].click();return true;},i);await sleep(500);
  assert(await page.eval(i=>document.querySelectorAll('.solution-tabs button')[i].getAttribute('aria-selected')==='true',i),'Solution selector '+(i+1)+' works');
  const steps=await page.eval(()=>document.querySelectorAll('.solution-steps > button').length);
  for(let j=0;j<steps;j++){await page.eval(j=>{document.querySelectorAll('.solution-steps > button')[j].click();return true;},j);await sleep(450);assert(await page.eval(()=>!!document.querySelector('.solution-preview [data-ui]')),'Solution '+(i+1)+' step '+(j+1)+' displays UI');}
 }
 await page.eval(()=>{document.querySelector('.solution-panel').scrollIntoView({block:'center'});return true;});await sleep(700);await snap('solution-operations');
 for(const width of [1024,390]){
  await page.setViewport({width,height:width===390?844:1000,mobile:width===390});
  for(const route of ['/','/products','/solutions','/learning','/about','/demo','/login','/products/riva']){
   await go(route);assert(await page.eval(()=>document.documentElement.scrollWidth<=innerWidth+1),`${width}px ${route} has no horizontal overflow`);
   assert(await page.eval(()=>getComputedStyle(document.documentElement).colorScheme==='light'),`${width}px ${route} uses light theme`);
   if(['/','/products','/solutions'].includes(route)) await snap((route==='/'?'home':route.slice(1))+'-'+width);
  }
 }
 await go('/login');await wait(()=>[...document.querySelectorAll('button')].some(b=>b.textContent.includes('Raj Menon')),'Demo personas unavailable');
 await page.eval(()=>{[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Raj Menon')).click();return true;});await wait(()=>location.pathname==='/portal' && !!document.querySelector('.workspace-welcome'),'Client sign-in failed');await sleep(500);
 assert(await page.eval(()=>getComputedStyle(document.querySelector('.portal-root')).colorScheme==='light'),'Client workspace defaults to light');assert(await page.eval(()=>document.documentElement.scrollWidth<=innerWidth+1),'Client mobile workspace has no overflow');await snap('portal-mobile');
 await page.setViewport({width:1440,height:1000});await sleep(500);await snap('portal-light');
 await page.eval(()=>{document.querySelector('.portal-theme-button').click();return true;});await sleep(300);assert(await page.eval(()=>getComputedStyle(document.querySelector('.portal-root')).colorScheme==='dark'),'Existing optional dark toggle remains functional');await snap('portal-dark');await page.eval(()=>{document.querySelector('.portal-theme-button').click();return true;});
 await go('/login');await page.eval(()=>{[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Mei Tan')).click();return true;});await wait(()=>location.pathname==='/portal','Employee sign-in failed');await go('/portal/moderation');assert(await page.eval(()=>document.querySelector('h1').textContent.toLowerCase().includes('moderation')),'Employee moderation remains available');await snap('moderation-light');
 await page.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await go('/');await sleep(500);
 assert(await page.eval(()=>getComputedStyle(document.querySelector('.ax-scene')).height.replace('px','')<innerHeight*2),'Reduced motion removes long pinned film');assert(await page.eval(()=>!document.documentElement.classList.contains('lenis')),'Reduced motion disables Lenis');await snap('reduced-motion');
 assert(page.consoleErrors.length===0,'No browser runtime exceptions');
} finally {
 writeFileSync(resolve(out,'checks.json'),JSON.stringify({checks,errors:page.consoleErrors},null,2));console.log(JSON.stringify({checks,errors:page.consoleErrors},null,2));await browser.close();
}
