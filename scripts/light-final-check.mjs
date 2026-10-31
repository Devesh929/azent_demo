import { Browser, sleep } from '../.claude/skills/taste-skill/scripts/lib/cdp.mjs';
import { resolve } from 'node:path';
const browser=await Browser.launch();const page=await browser.newPage({width:768,height:1000});
try {
 await page.goto('http://localhost:3001',{settleMs:1800});await page.eval(()=>document.querySelector('#workspace-showcase').scrollIntoView());await sleep(1200);
 const cards=await page.eval(()=>[...document.querySelectorAll('.showcase-satellite')].map(e=>({x:e.getBoundingClientRect().x,right:e.getBoundingClientRect().right,transform:getComputedStyle(e).transform})));
 if(cards.some(c=>c.x<16||c.right>752))throw Error('Tablet cards exceed safe margins');
 await page.screenshot({path:resolve('.taste-skill/light-site/qa/workspace-tablet-final.png'),format:'png'});
 const colors=await page.eval(()=>{const e=document.querySelector('.home-redesign .bg-accent.text-accent-ink');return {text:getComputedStyle(e).color,background:getComputedStyle(e).backgroundColor};});
 if(colors.text!=='rgb(244, 255, 248)')throw Error('Solid green panel text did not update');
 console.log(JSON.stringify({tabletCards:cards,solidGreenPanel:colors,runtimeErrors:page.consoleErrors}));
} finally {await browser.close();}
