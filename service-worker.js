/* FitLife AI — service worker */

const VERSAO = 'fitlife-v3';
const SHELL = [
'./',
'./index.html',
'./manifest.json',
'./icon-192.png',
'./icon-512.png',
'./icon-maskable.png',
'./apple-touch-icon.png'
];

self.addEventListener('install', e => {
e.waitUntil(
caches.open(VERSAO)
.then(c => c.addAll(SHELL).catch(() => c.add('./index.html')))
.then(() => self.skipWaiting())
);
});

self.addEventListener('activate', e => {
e.waitUntil(
caches.keys()
.then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k))))
.then(() => self.clients.claim())
);
});

self.addEventListener('fetch', e => {
const req = e.request;
if (req.method !== 'GET') return;

const url = new URL(req.url);

if (url.hostname.includes('fonts.googleapis.com')
|| url.hostname.includes('fonts.gstatic.com')
|| url.hostname.includes('raw.githubusercontent.com')) {
e.respondWith(
caches.match(req).then(hit => hit || fetch(req).then(res => {
const copia = res.clone();
caches.open(VERSAO).then(c => c.put(req, copia));
return res;
}).catch(() => hit))
);
return;
}

if (url.origin === location.origin) {
e.respondWith(
caches.match(req).then(hit => {
const rede = fetch(req).then(res => {
if (res && res.status === 200) {
const copia = res.clone();
caches.open(VERSAO).then(c => c.put(req, copia));
}
return res;
}).catch(() => hit);
return hit || rede;
})
);
}
});

self.addEventListener('message', e => {
if (e.data === 'atualizar') self.skipWaiting();
});
