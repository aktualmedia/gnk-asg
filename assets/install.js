(() => {
let deferredPrompt=null;
const $=s=>document.querySelector(s);
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;const b=$('#installBtn');if(b){b.disabled=false;b.textContent='Instaliraj aplikaciju';}});
document.addEventListener('DOMContentLoaded',()=>{
 const btn=$('#installBtn');
 if(btn){
   btn.addEventListener('click',async()=>{
     if(!deferredPrompt){alert('Ako se gumb ne pojavi, koristite izbornik preglednika: Add to Home screen / Install app.');return;}
     deferredPrompt.prompt();
     await deferredPrompt.userChoice;
     deferredPrompt=null;
   });
 }
 const url=$('#installUrl');
 if(url) url.textContent=location.origin + location.pathname.replace(/install\/$/,'install/');
});
})();
