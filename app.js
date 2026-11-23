const cfg = window.AL_CONFIG;
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const price = (n) => '৳' + Number(n).toLocaleString('en-BD');
const strings = {
  en: {search:'Search fragrances',category:'Category',all:'All fragrances',perfume:'Perfume',attar:'Attar',bag:'Bag',loading:'Loading the collection…',setup:'Our collection is being prepared. Please contact us for current availability.',error:'The collection is temporarily unavailable. Please contact us.',empty:'No products available yet. Contact us for details.',noResults:'No fragrances match your search. Try another search or category.',contactPrice:'Contact for price',add:'Add to bag',ask:'Ask on WhatsApp',askMessage:'Hello, I would like to know about',details:'Product details',emptyBag:'Your bag is empty.',subtotal:'Subtotal',decrease:'Decrease quantity',increase:'Increase quantity',addFirst:'Please add a product first.',close:'Close'},
  bn: {search:'সুবাস খুঁজুন',category:'ধরন',all:'সব সুবাস',perfume:'পারফিউম',attar:'আতর',bag:'ব্যাগ',loading:'সংগ্রহ দেখানো হচ্ছে…',setup:'আমাদের সংগ্রহ প্রস্তুত হচ্ছে। পণ্যের তথ্যের জন্য যোগাযোগ করুন।',error:'সংগ্রহ এখন দেখা যাচ্ছে না। যোগাযোগ করুন।',empty:'এখনো কোনো পণ্য দেখানো হচ্ছে না। বিস্তারিত জানতে যোগাযোগ করুন।',noResults:'আপনার খোঁজে কোনো পণ্য পাওয়া যায়নি। অন্য নাম বা ধরন দিয়ে খুঁজুন।',contactPrice:'দাম জানতে যোগাযোগ করুন',add:'ব্যাগে যোগ করুন',ask:'হোয়াটসঅ্যাপে জানতে চান',askMessage:'আসসালামু আলাইকুম, এই পণ্য সম্পর্কে জানতে চাই:',details:'পণ্যের বিবরণ',emptyBag:'আপনার ব্যাগ খালি।',subtotal:'উপমোট',decrease:'পরিমাণ কমান',increase:'পরিমাণ বাড়ান',addFirst:'আগে পণ্য যোগ করুন।',close:'বন্ধ করুন'}
};
let products = [], status = 'loading', cart = {};
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
  ['all','perfume','attar'].forEach(value => { $('#category option[value="'+value+'"]').textContent = t()[value]; });
  $('#cartButton').firstChild.textContent = t().bag + ' ';
  $('#cart .close').setAttribute('aria-label', t().close);
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
    const whatsapp = 'https://wa.me/8801577350488?text=' + encodeURIComponent(t().askMessage + ' ' + details);
    const description = (lang==='bn'&&p.description_bn?p.description_bn:p.description_en||'').replace(/\*\*/g, '');
    return `<article class="card">${p.image_url?`<img src="${esc(p.image_url)}" alt="${esc(name)}" loading="lazy">`:'<div class="image-placeholder" aria-hidden="true"></div>'}<p class="eyebrow">${esc(t()[p.category] || p.category)} ${p.size?'/ '+esc(p.size):''}</p><h3>${esc(name)}</h3><p class="product-price">${p.price_bdt!=null?price(p.price_bdt):t().contactPrice}</p>${description?`<details class="product-details"><summary>${t().details}</summary><p>${esc(description)}</p></details>`:''}${p.price_bdt!=null&&p.in_stock?`<button class="gold-button" data-add="${esc(p.id)}">${t().add}</button>`:`<a class="outline" href="${esc(whatsapp)}">${t().ask}</a>`}</article>`;
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
function updateCart() {
  const items = products.filter(p => Number(cart[p.id]) > 0 && p.published && p.in_stock && p.price_bdt != null);
  $('#count').textContent = items.reduce((n,p) => n + Number(cart[p.id]),0);
  $('#cartItems').innerHTML = items.length ? items.map(p => `<div class="cart-row"><span>${esc(lang==='bn'&&p.name_bn?p.name_bn:p.name_en)} × ${Number(cart[p.id])}<br>${price(p.price_bdt * Number(cart[p.id]))}</span><span><button type="button" data-minus="${esc(p.id)}" aria-label="${t().decrease}">−</button><button type="button" data-plus="${esc(p.id)}" aria-label="${t().increase}">+</button></span></div>`).join('') : `<p>${t().emptyBag}</p>`;
  $('#total').textContent = t().subtotal + ': ' + price(items.reduce((n,p) => n + p.price_bdt * Number(cart[p.id]),0));
  document.querySelectorAll('[data-minus]').forEach(b => { b.onclick = () => { cart[b.dataset.minus] = Number(cart[b.dataset.minus]) - 1; if (cart[b.dataset.minus] <= 0) delete cart[b.dataset.minus]; save(); }; });
  document.querySelectorAll('[data-plus]').forEach(b => { b.onclick = () => { cart[b.dataset.plus] = Number(cart[b.dataset.plus]) + 1; save(); }; });
}
$('#search').oninput = render;
$('#category').onchange = render;
$('#cartButton').onclick = () => $('#cart').showModal();
$('#checkout').onsubmit = e => {
  e.preventDefault();
  const items = products.filter(p => Number(cart[p.id]) > 0 && p.published && p.in_stock && p.price_bdt != null);
  if (!items.length) { alert(t().addFirst); return; }
  const f = new FormData(e.target);
  const message = ['Al Mawizah COD order',...items.map(p => `${p.name_en} × ${Number(cart[p.id])} = ${price(p.price_bdt * Number(cart[p.id]))}`),'Subtotal: '+price(items.reduce((n,p) => n + p.price_bdt * Number(cart[p.id]),0)),'Delivery charge to be confirmed','Name: '+f.get('name'),'Phone: '+f.get('phone'),'Address: '+f.get('address')].join('\n');
  window.open('https://wa.me/8801577350488?text='+encodeURIComponent(message),'_blank','noopener');
};
translate();
load();
