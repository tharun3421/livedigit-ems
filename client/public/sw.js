const CACHE_NAME = "quickems-v1";
const STATIC_ASSETS = ["/", "/index.html"];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    if (!event.request.url.startsWith('http')) return;
    if (event.request.method !== "GET") return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                const clone = response.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});

// ─── Push Notifications ───────────────────────────────────────────────────────

self.addEventListener("push", (event) => {
    const data     = event.data?.json() || {}
    const { title = "New Announcement", message = "", priority = "NORMAL" } = data
    const icons    = { NORMAL: "ℹ️", IMPORTANT: "⚠️", URGENT: "🚨" }

    event.waitUntil(
        self.registration.showNotification(`${icons[priority]} ${title}`, {
            body:               message,
            icon:               "/favicon.ico",
            badge:              "/favicon.ico",
            tag:                `announcement-${Date.now()}`,
            requireInteraction: priority === "URGENT",
            data:               { url: "/announcements" },
        })
    )
})

// ─── Notification Click ───────────────────────────────────────────────────────

self.addEventListener("notificationclick", (event) => {
    event.notification.close()
    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
            for (const client of list) {
                if (client.url.includes("/announcements")) return client.focus()
            }
            return clients.openWindow(event.notification.data?.url || "/announcements")
        })
    )
})