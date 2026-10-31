import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Browser, sleep } from '../.claude/skills/taste-skill/scripts/lib/cdp.mjs';
const out=resolve('docs/portal-design-system');mkdirSync(out,{recursive:true});
const browser=await Browser.launch();const page=await browser.newPage({width:1440,height:1000});
try {
 await page.goto('http://localhost:3001/login',{timeoutMs:60000,settleMs:1000});
 for(let i=0;i<80;i++){if(await page.eval(()=>[...document.querySelectorAll('button')].some(b=>b.textContent.includes('Raj Menon'))))break;await sleep(200);}
 await page.eval(()=>{[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Raj Menon')).click();return true;});
 for(let i=0;i<100;i++){if(await page.eval(()=>location.pathname==='/portal'&&!!document.querySelector('.workspace-welcome')))break;await sleep(250);}
 await page.eval(()=>document.fonts.ready.then(()=>true));await sleep(500);
 const themes={};
 for(const theme of ['light','dark']){
 if(theme==='dark'){await page.eval(()=>{document.querySelector('.portal-theme-button').click();return true;});await sleep(200);}
 themes[theme]=await page.eval(()=>{
  const root=document.querySelector('.portal-root');if(!root)throw Error('Portal not loaded');const rs=getComputedStyle(root);
  const tokenNames=['ground','ground-2','surface','surface-2','surface-3','surface-solid','ink','ink-2','muted','accent','accent-ink','accent-soft','blue','blue-soft','cyan','violet','warn','warn-soft','bad','bad-soft','good','line','line-strong','ease-out','ease-in-out'];
  const tokens=Object.fromEntries(tokenNames.map(t=>['--'+t,rs.getPropertyValue('--'+t).trim()]));
  const selectors={root:'.portal-root',sidebar:'.portal-sidebar',topbar:'.portal-topbar',panel:'.portal-panel',stat:'.portal-stat',raisedControl:'.portal-sidebar .neu',insetControl:'.portal-topbar .neu-inset',primaryButton:'.welcome-actions .btn-glow',selectedNavigation:'.portal-nav-active',welcomeTitle:'.workspace-welcome h1',pageLabel:'.portal-sidebar nav a',panelTitle:'.portal-panel h2',guideLauncher:'.workspace-guide-launch'};
  const properties=['color','backgroundColor','backgroundImage','border','borderRadius','boxShadow','backdropFilter','fontFamily','fontSize','fontWeight','letterSpacing','lineHeight','padding','height','width','position','top','gridTemplateColumns','animationName','animationDuration','transitionDuration'];
  const styles=Object.fromEntries(Object.entries(selectors).map(([name,selector])=>{const el=document.querySelector(selector);if(!el)return[name,null];const s=getComputedStyle(el);return[name,Object.fromEntries(properties.map(p=>[p,s[p]]))];}));
  return {tokens,styles,backdrop:getComputedStyle(root,'::before').backgroundImage};
 });
 await page.screenshot({path:resolve(out,`dashboard-${theme}.png`),format:'png'});
 }
 await page.eval(()=>{document.querySelector('.portal-theme-button').click();return true;});await page.setViewport({width:390,height:844,mobile:true});await sleep(250);await page.screenshot({path:resolve(out,'dashboard-mobile.png'),format:'png'});
 writeFileSync(resolve(out,'computed-styles.json'),JSON.stringify({capturedAt:new Date().toISOString(),viewport:{width:1440,height:1000},scope:'Synthetic Raj Menon dashboard; read-only visual inspection',themes,runtimeErrors:page.consoleErrors},null,2));
 console.log(JSON.stringify({themes:Object.keys(themes),lightTokens:themes.light.tokens,runtimeErrors:page.consoleErrors},null,2));
} finally {await browser.close();}
