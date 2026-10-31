import { Browser, sleep } from '../.claude/skills/taste-skill/scripts/lib/cdp.mjs';
import {resolve} from 'node:path';
import {mkdirSync} from 'node:fs';
const out=resolve('.taste-skill/light-site');mkdirSync(out,{recursive:true});
const browser=await Browser.launch();const page=await browser.newPage({width:1440,height:1000});
try {
for(const [route,name] of [['/','home'],['/products','products'],['/solutions','solutions']]) {
 await page.goto('http://localhost:3000'+route,{timeoutMs:90000,settleMs:2200});
 await page.screenshot({path:resolve(out,name+'.png'),format:'png'});
 console.log(route, await page.eval(()=>({title:document.title,overflow:document.documentElement.scrollWidth>innerWidth,bg:getComputedStyle(document.documentElement).backgroundColor,h1:document.querySelector('h1')?.textContent,products:document.querySelectorAll('[role=tab]').length}))); }
console.log('errors',page.consoleErrors);
} finally {await browser.close();}
