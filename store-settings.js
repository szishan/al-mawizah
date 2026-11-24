(() => {
  'use strict';
  const defaults = {
    store_name:'Al Mawizah', store_name_bn:'আল মাওইযাহ', phone:'+8801577350488',
    whatsapp_number:'8801577350488', email:'almawizah@gmail.com',
    facebook_url:'https://www.facebook.com/AlMawizah', instagram_url:'https://www.instagram.com/al_maw_izah/',
    address:'', logo_url:'assets/al-mawizah-logo.jpg',
    hero_title_en:'A scent that stays with you.', hero_title_bn:'সুবাস, যা আপনার সঙ্গে থাকে।',
    hero_text_en:'Discover perfume and attar selected for your everyday rituals and special moments.',
    hero_text_bn:'প্রতিদিনের অভ্যাস ও বিশেষ মুহূর্তের জন্য পারফিউম ও আতরের সংগ্রহ আবিষ্কার করুন।',
    story_title_en:'A little luxury, every day.', story_title_bn:'প্রতিদিনের ছোট্ট এক বিলাসিতা।',
    story_text_en:'Fragrance is personal. Let us help you find one that feels like you.', story_text_bn:'সুবাস ব্যক্তিগত। আপনার পছন্দের সুবাস খুঁজে পেতে আমরা পাশে আছি।',
    tagline_en:'A fragrance for every moment.', tagline_bn:'প্রতিটি মুহূর্তের জন্য সুবাস।',
    delivery_note_en:'Cash on delivery. Delivery charge and availability will be confirmed with you.',
    delivery_note_bn:'ক্যাশ অন ডেলিভারি। ডেলিভারি চার্জ ও পণ্যের প্রাপ্যতা আপনার সঙ্গে নিশ্চিত করা হবে।'
  };
  window.AL_STORE = {...defaults};
  window.AL_STORE_READY = false;
  function httpsUrl(value) {
    try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password ? u.href : ''; } catch (_) { return ''; }
  }
  function apply() {
    const s=window.AL_STORE;
    const language=document.documentElement.lang==='bn'?'bn':'en';
    document.querySelectorAll('[data-store-name]').forEach(el=>el.textContent=language==='bn'&&s.store_name_bn?s.store_name_bn:s.store_name);
    document.querySelectorAll('[data-store-phone]').forEach(el=>{el.textContent=s.phone;el.href='tel:'+s.phone.replace(/[^\d+]/g,'')});
    document.querySelectorAll('[data-store-email]').forEach(el=>{el.textContent=s.email;el.href='mailto:'+s.email});
    document.querySelectorAll('[data-store-address]').forEach(el=>{el.textContent=s.address||'';el.hidden=!s.address});
    document.querySelectorAll('[data-store-whatsapp]').forEach(el=>{el.hidden=!window.AL_STORE_READY;el.href='https://wa.me/'+s.whatsapp_number});
    for (const network of ['facebook','instagram']) document.querySelectorAll('[data-store-'+network+']').forEach(el=>{const url=httpsUrl(s[network+'_url']);el.hidden=!url;if(url)el.href=url});
    document.querySelectorAll('[data-store-logo]').forEach(el=>{const url=s.logo_url.startsWith('assets/')?s.logo_url:httpsUrl(s.logo_url);if(url)el.src=url;el.alt=el.classList.contains('story-logo')?s.store_name+' logo':''});
    if(location.pathname.endsWith('/admin.html'))document.title='Admin Studio | '+s.store_name;
    else if(!location.pathname.endsWith('/product.html'))document.title=s.store_name+' | Perfume & Attar';
    for (const [selector,prefix] of [['[data-setting-hero-title]','hero_title'],['[data-setting-hero-text]','hero_text'],['[data-setting-story-title]','story_title'],['[data-setting-story-text]','story_text'],['[data-setting-tagline]','tagline'],['[data-setting-delivery]','delivery_note']]) document.querySelectorAll(selector).forEach(el=>{el.dataset.en=s[prefix+'_en'];el.dataset.bn=s[prefix+'_bn'];el.textContent=s[prefix+'_'+language]});
    document.dispatchEvent(new CustomEvent('store-settings-updated'));
  }
  window.applyStoreSettings=apply;
  apply();
  const cfg=window.AL_CONFIG;
  if(cfg && cfg.supabaseUrl && cfg.supabaseAnonKey) fetch(cfg.supabaseUrl+'/rest/v1/store_settings?id=eq.1&select=*',{headers:{apikey:cfg.supabaseAnonKey},cache:'no-store'})
    .then(r=>{if(!r.ok)throw Error('Settings unavailable');return r.json()})
    .then(rows=>{if(Array.isArray(rows)&&rows[0]){window.AL_STORE={...defaults,...rows[0]};window.AL_STORE_READY=true;apply()}}).catch(()=>{});
})();
