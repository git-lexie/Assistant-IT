// Start the app and open a public HTTPS tunnel so you can test on a phone, tablet or another computer.
//   npm run tunnel        development server (hot reload)
//   npm run tunnel:prod   production build (tests install, offline mode, update popup)
import {spawn,execSync} from 'node:child_process';
import os from 'node:os';
import net from 'node:net';
import localtunnel from 'localtunnel';
import qrcode from 'qrcode-terminal';

const prod=process.argv.includes('--prod'),port=prod?4173:3000;
const lan=Object.values(os.networkInterfaces()).flat().filter(i=>i&&i.family==='IPv4'&&!i.internal).map(i=>i.address);
const run=(cmd,args)=>spawn(cmd,args,{stdio:'inherit',shell:process.platform==='win32'});
const up=()=>new Promise(r=>{const s=net.connect(port,'127.0.0.1');s.on('connect',()=>{s.destroy();r(true)});s.on('error',()=>r(false))});
const wait=async()=>{for(let i=0;i<180;i++){if(await up())return true;await new Promise(r=>setTimeout(r,1000))}return false};

let server,tunnel;
const stop=()=>{try{tunnel&&tunnel.close()}catch(e){}try{server&&server.kill()}catch(e){}process.exit(0)};
process.on('SIGINT',stop);process.on('SIGTERM',stop);

console.log(prod?'\nBuilding the production version first…\n':'\nStarting the development server…\n');
if(prod){execSync('npm run build',{stdio:'inherit'});server=run('npx',['serve','out','-l',String(port)])}
else server=run('npx',['next','dev','-H','0.0.0.0','-p',String(port)]);

if(!(await wait())){console.error('The server did not start in time.');stop()}
try{
 tunnel=await localtunnel({port});
 let pass='';try{pass=(await (await fetch('https://loca.lt/mytunnelpassword')).text()).trim()}catch(e){}
 console.log('\n==================== TEST ON OTHER DEVICES ====================');
 console.log('Public HTTPS address (works on mobile data too):\n  '+tunnel.url);
 if(pass)console.log('First visit shows a "tunnel" reminder page. Enter this password:\n  '+pass);
 if(lan.length)console.log('Same Wi-Fi only (no HTTPS, so lock/microphone are limited):\n  '+lan.map(a=>`http://${a}:${port}`).join('\n  '));
 console.log('\nScan with your phone camera:');qrcode.generate(tunnel.url,{small:true});
 console.log('\nPress Ctrl+C to stop.\n');
 tunnel.on('close',()=>console.log('Tunnel closed.'));
}catch(e){console.error('Could not open the tunnel ('+(e&&e.message)+'). The app still runs locally on http://localhost:'+port+'.\nAlternative: in VS Code open the PORTS tab, Forward a Port '+port+', right-click it and set Port Visibility to Public.')}
