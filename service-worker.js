/* FitLife AI — service worker
Estratégia:
• App shell (HTML, ícones, manifest): cache-first, com atualização em segundo plano.
• Fontes do Google: cache-first (ficam guardadas na primeira visita — depois abre offline).
• Chamadas de IA (Anthropic / Gemini): NUNCA cacheadas. Passam direto pela rede.
Trocar VERSAO a cada atualização do app força o cache novo. */

const VERSAO = 'fitlife-v9';
const SHELL = [
'./',
'./index.html',
'./manifest.json',
'./icon-192.png',
'./icon-512.png',
'./icon-maskable.png',
'./apple-touch-icon.png'
];

// Domínios que nunca podem ser servidos do cache
const REDE_SEMPRE = [
'api.anthropic.com',
'generativelanguage.googleapis.com'
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

// IA: sempre rede, nunca cache
if (REDE_SEMPRE.some(d => url.hostname.includes(d))) return;

// Fontes do Google e imagens dos exercícios (Free Exercise DB): guarda na primeira visita
if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')
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

// Mesma origem: cache primeiro, mas atualiza em segundo plano
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
return hit || rede; // offline: devolve o que está guardado
})
);
}
});

// Permite ao app pedir atualização imediata
self.addEventListener('message', e => {
if (e.data === 'atualizar') self.skipWaiting();
});
