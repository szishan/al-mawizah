const cfg = window.AL_CONFIG;
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const price = (n) => '৳' + Number(n).toLocaleString('en-BD');
const strings = {
  en: {search:'Search fragrances',category:'Category',all:'All fragrances',perfume:'Perfume',attar:'Attar',bag:'Bag',loading:'Loading the collection…',setup:'Our collection is being prepared. Please contact us for current availability.',error:'The collection is temporarily unavailable. Please contact us.',empty:'No products available yet. Contact us for details.',noResults:'No fragrances match your search. Try another search or category.',contactPrice:'Contact for price',add:'Add to bag',ask:'Ask on WhatsApp',askMessage:'Hello, I would like to know about',details:'Product details',emptyBag:'Your bag is empty.',subtotal:'Subtotal',decrease:'Decrease quantity',increase:'Increase quantity',addFirst:'Please add a product first.',close:'Close',perfume_oil:'Perfume oil',gift_set:'Gift set',decant:'Decant'},
  bn: {search:'সুবাস খুঁজুন',category:'ধরন',all:'সব সুবাস',perfume:'পারফিউম',attar:'আতর',bag:'ব্যাগ',loading:'সংগ্রহ দেখানো হচ্ছে…',setup:'আমাদের সংগ্রহ প্রস্তুত হচ্ছে। পণ্যের তথ্যের জন্য যোগাযোগ করুন।',error:'সংগ্রহ এখন দেখা যাচ্ছে না। যোগাযোগ করুন।',empty:'এখনো কোনো পণ্য দেখানো হচ্ছে না। বিস্তারিত জানতে যোগাযোগ করুন।',noResults:'আপনার খোঁজে কোনো পণ্য পাওয়া যায়নি। অন্য নাম বা ধরন দিয়ে খুঁজুন।',contactPrice:'দাম জানতে যোগাযোগ করুন',add:'ব্যাগে যোগ করুন',ask:'হোয়াটসঅ্যাপে জানতে চান',askMessage:'আসসালামু আলাইকুম, এই পণ্য সম্পর্কে জানতে চাই:',details:'পণ্যের বিবরণ',emptyBag:'আপনার ব্যাগ খালি।',subtotal:'উপমোট',decrease:'পরিমাণ কমান',increase:'পরিমাণ বাড়ান',addFirst:'আগে পণ্য যোগ করুন।',close:'বন্ধ করুন',perfume_oil:'পারফিউম অয়েল',gift_set:'গিফট সেট',decant:'ডিক্যান্ট'}
};
let products = [], variants = [], status = 'loading', cart = {};
try { cart = JSON.parse(localStorage.getItem('al-cart') || '{}'); if (!cart || typeof cart !== 'object' || Array.isArray(cart)) cart = {}; } catch (_) { cart = {}; }
let lang = 'en';
try { lang = localStorage.getItem('al-lang') === 'bn' ? 'bn' : 'en'; } catch (_) {}
const t = () => strings[lang];
function translate() {
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-en]').forEach(e => { e.textContent = e.dataset[lang]; });
  $('#lang').textContent = lang === 'en' ? 'বাংলা' : 'English';
  $('#search').placeholder = t().search;
  $('#search').setAttribute('aria-label', t().search);
  $('#category').setAttribute('aria-label', t().category);
  ['all','perfume','attar','perfume_oil','gift_set','decant'].forEach(value => { const option=$('#category option[value="'+value+'"]'); if(option) option.textContent = t()[value] || option.textContent; });
  $('#cartButton').firstChild.textContent = t().bag + ' ';
  $('#cart .close').setAttribute('aria-label', t().close);
  window.applyStoreSettings();
  render();
}
$('#lang').onclick = () => { lang = lang === 'en' ? 'bn' : 'en'; try { localStorage.setItem('al-lang',lang); } catch (_) {} translate(); };
async function load() {
  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) { status = 'setup'; render(); return; }
  try {
    const response = await fetch(cfg.supabaseUrl + '/rest/v1/products?select=*&published=eq.true&order=created_at.desc', {headers:{apikey:cfg.supabaseAnonKey}});
    if (!response.ok) throw new Error('Catalog request failed');
    products = await response.json();
    if (!Array.isArray(products)) throw new Error('Unexpected catalog response');
    try {
      const variantResponse = await fetch(cfg.supabaseUrl + '/rest/v1/product_variants?select=*&order=position.asc', {headers:{apikey:cfg.supabaseAnonKey}});
      if (variantResponse.ok) { const result = await variantResponse.json(); if (Array.isArray(result)) variants = result; }
    } catch (_) { /* Older deployments may not yet have variants. */ }
    status = 'ready';
  } catch (_) { status = 'error'; }
  render();
}
function render() {
  const query = $('#search').value.trim().toLocaleLowerCase(), category = $('#category').value;
  const matches = products.filter(p => (category === 'all' || p.category === category) && ((p.name_en || '')+' '+(p.name_bn || '')).toLocaleLowerCase().includes(query));
  $('#catalog').innerHTML = matches.map(p => {
    const name = lang === 'bn' && p.name_bn ? p.name_bn : p.name_en;
    const details = [p.name_en, p.size].filter(Boolean).join(' — ');
    const whatsapp = 'https://wa.me/' + window.AL_STORE.whatsapp_number + '?text=' + encodeURIComponent(t().askMessage + ' ' + details);
    const description = (lang==='bn'&&p.description_bn?p.description_bn:p.description_en||'').replace(/\*\*/g, '');
    const detailUrl = 'product.html?id=' + encodeURIComponent(p.id);
    const hasVariants = variants.some(v=>v.product_id===p.id);
    const amount = currentPrice(p);
    return `<article class="card"><a href="${esc(detailUrl)}">${p.image_url?`<img src="${esc(p.image_url)}" alt="${esc(name)}" loading="lazy">`:'<div class="image-placeholder" aria-hidden="true"></div>'}</a><p class="eyebrow">${esc(t()[p.category] || p.category)} ${p.size?'/ '+esc(p.size):''}</p><h3><a href="${esc(detailUrl)}">${esc(name)}</a></h3><p class="product-price">${amount!=null?price(amount):t().contactPrice}</p><a class="outline" href="${esc(detailUrl)}">${t().details}</a>${!hasVariants&&amount!=null&&p.in_stock?`<button class="gold-button" data-add="${esc(p.id)}">${t().add}</button>`:!hasVariants&&amount==null&&window.AL_STORE_READY?`<a class="outline" href="${esc(whatsapp)}">${t().ask}</a>`:''}</article>`;
  }).join('');
  let message = '';
  if (status !== 'ready') message = t()[status];
  else if (!products.length) message = t().empty;
  else if (!matches.length) message = t().noResults;
  $('#catalogMessage').textContent = message;
  $('#catalogMessage').hidden = !message;
  document.querySelectorAll('[data-add]').forEach(b => { b.onclick = () => { cart[b.dataset.add] = (Number(cart[b.dataset.add]) || 0) + 1; save(); }; });
  updateCart();
}
function save() { try { localStorage.setItem('al-cart', JSON.stringify(cart)); } catch (_) {} updateCart(); }
function currentPrice(item) {
  if (!item || item.price_bdt == null) return null;
  const regular = Number(item.price_bdt), sale = Number(item.sale_price_bdt);
  return item.sale_price_bdt != null && sale >= 0 && sale < regular ? sale : regular;
}
function cartLines() {
  return Object.entries(cart).map(([key,qty])=>{
    const [id,variantId] = key.split('::'), p=products.find(x=>x.id===id);
    if (!p || !p.published || !Number.isInteger(Number(qty)) || Number(qty)<1) return null;
    const variant=variantId ? variants.find(v=>v.id===variantId&&v.product_id===id) : null;
    if (variantId && !variant) return null;
    const item=variant||p, amount=currentPrice(item);
    const available=variant ? ['in_stock','pre_order','pre-order'].includes(variant.stock_status) : (p.in_stock || p.stock_status==='pre_order');
    return available && amount!=null ? {key,qty:Number(qty),p,item,amount} : null;
  }).filter(Boolean);
}
function updateCart() {
  const items = cartLines();
  $('#count').textContent = items.reduce((n,line) => n + line.qty,0);
  $('#cartItems').innerHTML = items.length ? items.map(({key,qty,p,item,amount}) => `<div class="cart-row"><span>${esc(lang==='bn'&&p.name_bn?p.name_bn:p.name_en)}${item.size?' — '+esc(item.size):''} × ${qty}<br>${price(amount*qty)}</span><span><button type="button" data-minus="${esc(key)}" aria-label="${t().decrease}">−</button><button type="button" data-plus="${esc(key)}" aria-label="${t().increase}">+</button></span></div>`).join('') : `<p>${t().emptyBag}</p>`;
  $('#total').textContent = t().subtotal + ': ' + price(items.reduce((n,line) => n + line.amount*line.qty,0));
  document.querySelectorAll('[data-minus]').forEach(b => { b.onclick = () => { cart[b.dataset.minus] = Number(cart[b.dataset.minus]) - 1; if (cart[b.dataset.minus] <= 0) delete cart[b.dataset.minus]; save(); }; });
  document.querySelectorAll('[data-plus]').forEach(b => { b.onclick = () => { cart[b.dataset.plus] = Number(cart[b.dataset.plus]) + 1; save(); }; });
}
$('#search').oninput = render;
$('#category').onchange = render;
$('#cartButton').onclick = () => $('#cart').showModal();
$('#checkout').onsubmit = e => {
  e.preventDefault();
  if (!window.AL_STORE_READY) { alert(lang==='bn'?'দোকানের যোগাযোগ তথ্য লোড হয়নি। আবার চেষ্টা করুন।':'Store contact details could not be loaded. Please try again.'); return; }
  const items = cartLines();
  if (!items.length) { alert(t().addFirst); return; }
  const f = new FormData(e.target);
  const message = [window.AL_STORE.store_name+' COD order',...items.map(({p,item,qty,amount}) => `${p.name_en}${item.size?' — '+item.size:''} × ${qty} = ${price(amount*qty)}`),'Subtotal: '+price(items.reduce((n,line) => n + line.amount*line.qty,0)),window.AL_STORE.delivery_note_en,'Name: '+f.get('name'),'Phone: '+f.get('phone'),'Address: '+f.get('address')].join('\n');
  window.open('https://wa.me/'+window.AL_STORE.whatsapp_number+'?text='+encodeURIComponent(message),'_blank','noopener');
};
document.addEventListener('store-settings-updated', () => render());
translate();
load();
if (new URLSearchParams(location.search).get('checkout')==='1') $('#cart').showModal();
