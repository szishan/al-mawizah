(() => {
  'use strict';
  const button=document.getElementById('installStudio'), hint=document.getElementById('installHint');
  let promptEvent=null;
  if ('serviceWorker' in navigator && window.isSecureContext) navigator.serviceWorker.register('studio-sw.js').catch(()=>{});
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();promptEvent=event;button.hidden=false;});
  window.addEventListener('appinstalled',()=>{promptEvent=null;button.hidden=true;hint.hidden=true});
  button.addEventListener('click',async()=>{if(!promptEvent)return;await promptEvent.prompt();await promptEvent.userChoice;promptEvent=null;button.hidden=true});
  if (window.matchMedia('(display-mode: standalone)').matches || navigator.standalone) hint.hidden=true;
})();
