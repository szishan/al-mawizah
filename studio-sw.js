/* No account, product, settings or customer data is cached on the device. */
self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => {
  if (event.request.mode !== 'navigate' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(event.request).catch(() => new Response('<!doctype html><html lang="bn"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Al Mawizah Studio</title><body style="background:#0d0d0c;color:#d2ae6d;font:18px sans-serif;padding:2rem"><h1>ইন্টারনেট সংযোগ প্রয়োজন</h1><p>পণ্য ও সেটিংস সম্পাদনা করতে ইন্টারনেট চালু করে আবার চেষ্টা করুন।</p><p>Connect to the internet to manage your store.</p></body></html>', {status:503,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}})));
});
