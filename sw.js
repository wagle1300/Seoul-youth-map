/* ══════════════════════════════════════════════════════════════════
   MAP:IN SYSTEM · Service Worker  (v2.2)  ·  © 2026 MAP:IN (MAPIN) System · 노태호
   ──────────────────────────────────────────────────────────────────
   내용을 수정한 뒤에는 반드시 아래 VERSION 숫자를 올리세요.
   올리지 않으면 이용자 기기에 옛 화면이 계속 남습니다.
   ══════════════════════════════════════════════════════════════════ */
const VERSION = 'mapin-v2.3.0';

/* 반드시 있어야 하는 파일 */
const SHELL = [
  './',
  './index.html',
  './manifest.json'
];
/* 있으면 저장하고, 없어도 괜찮은 파일 (아이콘) */
const OPTIONAL = [
  './logo.png',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png'
];

/* 설치 — 앱 껍데기를 미리 저장 */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(VERSION)
      .then(c => c.addAll(SHELL)
        .then(() => Promise.all(OPTIONAL.map(u => c.add(u).catch(() => {})))))
      .then(() => self.skipWaiting())
  );
});

/* 활성화 — 이전 버전 캐시 정리 */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* 요청 처리
   - 지도 타일·구글 API 등 외부 요청은 캐시하지 않고 그대로 통과
   - 앱 자체 파일은 네트워크 우선, 실패 시 캐시 (오프라인 대비)      */
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  if (e.request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;   // 외부 도메인은 개입하지 않음

  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) {                                  // 오류 페이지(404 등)는 저장하지 않음
          const copy = res.clone();
          caches.open(VERSION).then(c => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request)
        .then(r => r || (e.request.mode === 'navigate' ? caches.match('./index.html') : null))
        .then(r => r || Response.error()))
  );
});
