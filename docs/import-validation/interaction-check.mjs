import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
const checkWeb = process.env.WEIR_CHECK_WEB || resolve('web');
const req = createRequire(resolve(checkWeb, 'package.json'));
const { chromium, webkit } = req('playwright');
const { expect } = req('@playwright/test');
const { keccak256, toBytes } = req('viem');
const { installMock, newState, CLIENT, RECIPIENT, TOKEN, manifest, weir } = await import(pathToFileURL(resolve(checkWeb, 'tests/mock-chain.mjs')));
const { serve } = await import(pathToFileURL(resolve('web/tests/server.mjs')));
const out = resolve('test/scratch/import-validation');
await mkdir(out, {recursive:true});
const {server, url} = await serve();
const browser = await chromium.launch({headless:true,args:['--no-sandbox']});
const results=[], observations=[];
const routes=['/','/create','/streams','/records','/stream/1','/stream/1/receipt/client','/stream/1/receipt/freelancer'];
const stringify=x=>JSON.stringify(x,(_,v)=>typeof v==='bigint'?v.toString():v,2);
async function open(page,route='/') {
  await page.goto(`${url}#${route}`);
  await expect(page.locator('.skip-link')).toHaveCount(1);
  await expect(page.locator('main h1:visible')).toHaveCount(1);
  await page.evaluate(()=>document.fonts.ready);
}
async function navigate(page,route) {
  await page.evaluate(hash=>location.hash=hash,route);
  await expect(page).toHaveURL(`${url}#${route}`);
  await expect(page.locator('main h1:visible')).toHaveCount(1);
}
async function connect(page) {
  await page.locator('.wallet-button:visible').click();
  await page.getByRole('button',{name:'Test browser wallet',exact:true}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.wallet-button:visible')).toContainText('…');
}
async function scenario(name, run, options={}) {
  const context=await browser.newContext({viewport:{width:1280,height:900},...options});
  const page=await context.newPage();
  page.setDefaultTimeout(8000);
  const state=newState(), errors=[], localFailures=[], externalAssets=[];
  // Fixture terms stay local to this test; no agreement is fetched from a third party.
  for(const s of state.streams.values()) s.termsURI='Deliver the agreed work by Friday, including two revisions.';
  await installMock(page,state);
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.url().startsWith(url)&&r.status()>=400)localFailures.push(r.url().replace(url,'./'));});
  page.on('request',r=>{if(['script','stylesheet','font','image'].includes(r.resourceType())&&!r.url().startsWith(url)&&!r.url().startsWith('data:'))externalAssets.push(r.url());});
  try {
    await run(page,state,context);
    expect(errors).toEqual([]); expect(localFailures).toEqual([]); expect(externalAssets).toEqual([]);
    results.push({name,passed:true}); console.log('PASS',name);
  } catch(e) {
    results.push({name,passed:false,error:e.message,errors,localFailures,externalAssets}); console.log('FAIL',name,e.message);
    await page.screenshot({path:resolve(out,`failure-${results.length}.jpg`),type:'jpeg',quality:75,fullPage:true});
  } finally {await context.close();}
}
try {
await scenario('All seven hash routes render at 360, 390, 640, 768, 900, 901 and 1440; no horizontal page overflow',async(page)=>{
  const widths=[];
  for(const width of [360,390,640,768,900,901,1440]) {
    await page.setViewportSize({width,height:844});
    for(const route of routes) {
      await open(page,route);
      if(route.includes('/receipt/')) await expect(page.locator('.receipt')).toBeVisible();
      const dimensions=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth}));
      widths.push({width,route,...dimensions});
      expect(dimensions.document,`${width} ${route}`).toBeLessThanOrEqual(width);
    }
  }
  observations.push({name:'route-widths',values:widths});
});
await scenario('390 first screen, primary navigation, internal street pan, local fonts and metadata',async(page)=>{
  await page.setViewportSize({width:390,height:844}); await open(page);
  const link=page.locator('.mobile-nav a[href="#/create"]');
  await expect(link).toBeInViewport(); await expect(page.locator('.mobile-topbar .brand')).toBeInViewport();
  const rect=await link.boundingBox(); expect(rect.y+rect.height).toBeLessThan(844);
  observations.push({name:'first-screen',mainAction:rect});
  await page.screenshot({path:resolve(out,'home-390.jpg'),quality:80,type:'jpeg'});
  const pan=await page.locator('.town-wrap').evaluate(el=>{el.scrollLeft=el.scrollWidth;return {left:el.scrollLeft,frame:el.clientWidth,content:el.scrollWidth};});
  expect(pan.left).toBeGreaterThan(0); expect(pan.content).toBe(1100);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390);
  await expect(page.locator('.town-dots span').last()).toHaveClass('on');
  for(const selector of ['title','link[rel="icon"]','meta[name="description"]','meta[property="og:title"]','meta[property="og:image"]'])
    await expect(page.locator(selector)).toHaveCount(1);
  const assets=await page.evaluate(()=>performance.getEntriesByType('resource').filter(r=>/\.(woff2|js|css)(\?|$)/.test(r.name)).map(r=>({url:new URL(r.name).pathname.replace(/^.*\/preview\//,'./'),sameOrigin:new URL(r.name).origin===location.origin})));
  expect(assets.every(a=>a.sameOrigin)).toBe(true);
  observations.push({name:'loaded-assets',assets,fonts:await page.evaluate(()=>[...document.fonts].filter(f=>f.status==='loaded').map(f=>({family:f.family,weight:f.weight})))});
  await link.click(); await expect(page.locator('main h1')).toHaveText('Start a stream');
  await expect(page.getByRole('button',{name:'Check it over',exact:true})).toBeDisabled();
  await page.screenshot({path:resolve(out,'create-390.jpg'),quality:80,type:'jpeg',fullPage:true});
});
await scenario('Desktop overview and 320px limitation measured',async(page)=>{
  await page.setViewportSize({width:1440,height:1000});await open(page);
  await page.screenshot({path:resolve(out,'home-1440.jpg'),quality:80,type:'jpeg'});
  await page.setViewportSize({width:320,height:844});
  observations.push({name:'320px-known-limitation',dimensions:await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth}))});
});
await scenario('Wallet keyboard trap, Escape, focus restoration and EIP-6963 chain add/switch',async(page,state)=>{
  await open(page,'/create'); const trigger=page.locator('.site-header .wallet-button');
  await trigger.focus();await page.keyboard.press('Enter');
  for(let i=0;i<8;i++){await page.keyboard.press('Tab');expect(await page.evaluate(()=>!!document.activeElement.closest('dialog'))).toBe(true);}
  await page.keyboard.press('Escape');await expect(trigger).toBeFocused();
  await connect(page);
  expect(state.requests.find(r=>r.method==='wallet_addEthereumChain').params).toEqual([manifest.walletAddChain]);
  expect(state.requests.filter(r=>r.method==='wallet_switchEthereumChain')).toHaveLength(2);
  await trigger.click();await page.getByRole('button',{name:'Disconnect',exact:true}).click();
  await expect(trigger).toContainText('Connect wallet');
  await page.locator('.skip-link').focus();await page.keyboard.press('Enter');await expect(page.locator('main')).toBeFocused();
});
await scenario('Phone app links and Coinbase Smart Wallet',async(page)=>{
  await page.addInitScript(()=>{delete window.ethereum;});await open(page,'/create');
  await page.locator('.site-header .wallet-button').click();
  for(const wallet of ['MetaMask','Coinbase Wallet','Rabby','Phantom']) await expect(page.getByRole('link',{name:`Open in ${wallet}`})).toBeVisible();
  await expect(page.getByRole('button',{name:'Coinbase Smart Wallet',exact:true})).toBeVisible();
  await page.screenshot({path:resolve(out,'wallet-phone.jpg'),quality:80,type:'jpeg'});
},{viewport:{width:390,height:844},userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1'});
await scenario('Creation validation, day/week choice, exact approval and simulated creation',async(page,state)=>{
  await open(page,'/create');await connect(page);
  await page.getByRole('button',{name:'Check it over',exact:true}).click();
  await expect(page.locator('[name="recipient"]')).toHaveAttribute('aria-invalid','true');
  await expect(page.locator('[name="recipient"]')).toBeFocused();
  await page.locator('[name="recipient"]').fill(RECIPIENT);
  await page.getByRole('radio',{name:'Another token By address'}).click();await page.locator('[name="token"]').fill(TOKEN);
  await expect(page.getByText('How much (USDC)',{exact:true})).toBeVisible();
  await page.locator('[name="perPeriod"]').fill('0.6048');
  await page.getByRole('radio',{name:'per week',exact:true}).click();
  await expect(page.getByRole('radio',{name:'per week',exact:true})).toHaveAttribute('aria-checked','true');
  await page.locator('[name="deposit"]').fill('10.123456');
  await page.locator('[name="terms"]').fill('Deliver the agreed work.');
  await page.getByRole('button',{name:'Check it over',exact:true}).click();
  await expect(page.locator('.review-surface')).toContainText('Deliver the agreed work.');
  state.delay=300;
  await page.getByRole('button',{name:'Approve USDC',exact:true}).click();
  await expect(page.getByRole('button',{name:/Approve USDC ·/})).toBeDisabled();
  await expect(page.getByRole('button',{name:'Create stream',exact:true})).toBeEnabled();
  const approval=state.transactions.at(-1);expect(approval.args[0].toLowerCase()).toBe(weir);expect(approval.args[1]).toBe(10123456n);
  await page.getByRole('button',{name:'Create stream',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Stream #4',exact:true})).toBeVisible();
  const tx=state.transactions.find(t=>t.fn==='createStream');
  expect(tx.args[0].toLowerCase()).toBe(RECIPIENT);expect(tx.args[1].toLowerCase()).toBe(TOKEN);
  expect(tx.args.slice(2,6)).toEqual([1n,10123456n,keccak256(toBytes('Deliver the agreed work.')),'Deliver the agreed work.']);
});
await scenario('Records lookup error and five on-chain counters',async(page)=>{
  await open(page,'/records');await page.getByLabel('Wallet address').fill('invalid');
  await page.getByRole('button',{name:'Look up records'}).click();await expect(page.getByRole('alert')).toContainText('valid');
  await page.getByLabel('Wallet address').fill(CLIENT);await page.getByRole('button',{name:'Look up records'}).click();
  await expect(page.locator('.record-grid dd')).toHaveText(['2','1','3','0','4']);
  await expect(page.getByRole('alert')).toHaveCount(0);
});
await scenario('Stream lookup, connected role filters and receipt links',async(page)=>{
  await open(page,'/streams');await page.getByRole('button',{name:'Open stream',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('greater than zero');
  await connect(page);await expect(page.locator('.stream-row')).toHaveCount(3);
  await page.getByRole('button',{name:'I get paid',exact:true}).click();await expect(page.getByText('No stream pays this wallet yet.')).toBeVisible();
  await page.getByRole('button',{name:'I pay',exact:true}).click();await expect(page.locator('.stream-row')).toHaveCount(3);
  await page.getByLabel('Open a stream by its number').fill('1');await page.getByRole('button',{name:'Open stream',exact:true}).click();
  await page.getByRole('link',{name:'Payment receipt',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Payment receipt',exact:true})).toBeVisible();
});
await scenario('Both receipt roles, copy, print trigger, print layout and ruling states',async(page,state)=>{
  await page.addInitScript(()=>{Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>{window.__copied=text;}}});window.print=()=>{window.__printed=true;};});
  for(const role of ['client','freelancer']) {
    await open(page,`/stream/1/receipt/${role}`);await expect(page.locator('.receipt')).toBeVisible();
    await expect(page.locator('.receipt-terms')).toContainText('Deliver the agreed work');
    expect(await page.locator('.receipt').innerText()).not.toMatch(/0x[0-9a-fA-F]{40}/);
    await expect(page.locator('.receipt-draft')).toBeVisible();
    await page.getByRole('button',{name:'Copy as text',exact:true}).click();await expect(page.getByRole('button',{name:'Copied',exact:true})).toBeVisible();
    expect(await page.evaluate(()=>window.__copied)).toContain(role==='client'?'Payment receipt':'Proof of contract');
    await page.getByRole('button',{name:'Print or save as PDF',exact:true}).click();expect(await page.evaluate(()=>window.__printed)).toBe(true);
  }
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:resolve(out,'receipt-freelancer-390.jpg'),quality:80,type:'jpeg',fullPage:true});
  await page.emulateMedia({media:'print'});await expect(page.locator('.receipt-actions')).toBeHidden();await expect(page.locator('.receipt')).toBeVisible();
  await page.emulateMedia({media:'screen'});
  state.accepted.set(3n,1800000000n);await open(page,'/stream/3/receipt/client');
  await expect(page.locator('.receipt')).toContainText('the work was accepted');await expect(page.locator('.receipt-draft')).toHaveCount(0);
});
await scenario('Wrong network rejection disables writes and allows retry',async(page,state)=>{
  state.rejectSwitch=true;await open(page,'/stream/1');
  await page.locator('.wallet-button:visible').click();await page.getByRole('button',{name:'Test browser wallet',exact:true}).click();
  await expect(page.getByText(/Request declined in your wallet/)).toBeVisible();
  await page.getByRole('button',{name:'Close dialog'}).click();
  await expect(page.getByRole('button',{name:'Pause',exact:true})).toBeDisabled();
  expect(state.requests.some(r=>r.method==='wallet_addEthereumChain')).toBe(false);
  state.rejectSwitch=false;await page.locator('.wallet-button:visible').click();
  await expect(page.getByRole('button',{name:'Pause',exact:true})).toBeEnabled();
});
await scenario('Simulated client pause/restart and rejected signature recovery',async(page,state)=>{
  await open(page,'/stream/1');await connect(page);state.rejectNext=true;
  await page.getByRole('button',{name:'Pause',exact:true}).click();await expect(page.getByText(/Request declined in your wallet/)).toBeVisible();
  expect(state.transactions).toHaveLength(0);
  await page.getByRole('button',{name:'Pause',exact:true}).click();
  await expect(page.getByRole('button',{name:'Restart stream',exact:true})).toBeVisible();expect(state.streams.get(1n).rate).toBe(0n);
  await page.getByLabel('New rate per second (USDC)').fill('0.000020');
  await page.getByRole('button',{name:'Restart stream',exact:true}).click();
  await expect(page.getByRole('button',{name:'Pause',exact:true})).toBeEnabled();expect(state.streams.get(1n).rate).toBe(20n);
});
await scenario('Reduced motion stops coin animation',async(page)=>{
  await page.emulateMedia({reducedMotion:'reduce'});await open(page);
  expect(await page.locator('.coins').evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
  await page.emulateMedia({reducedMotion:'no-preference'});
  expect(await page.locator('.coins').evaluate(el=>getComputedStyle(el).animationName)).toBe('coins-advance');
});
try {
  const wk=await webkit.launch({headless:true});
  const page=await wk.newPage({viewport:{width:390,height:844}});await installMock(page,newState());
  await open(page);await page.locator('.mobile-nav a[href="#/create"]').click();await expect(page.locator('main h1')).toHaveText('Start a stream');
  results.push({name:'WebKit primary navigation',passed:true});await wk.close();
} catch(e) {observations.push({name:'WebKit unavailable',reason:e.message.split('\n').filter(l=>/lib.*so|missing|dependencies/i.test(l)).join('\n')||'Browser launch failed; see installation log.'});}
} finally {
  await browser.close();await new Promise(r=>server.close(r));
  await writeFile(resolve(out,'results.json'),stringify({results,observations}));
}
process.exitCode=results.some(r=>!r.passed)?1:0;
