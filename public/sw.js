// Custom (BlackFire): an offline page for navigations. Chrome on Android needs
// a real fetch handler to install the site as an app (WebAPK) instead of a
// shortcut that opens with a title/URL bar.
const OFFLINE_CACHE = "blackfire-offline-v1";
const OFFLINE_ASSETS = ["/offline.html", "/brand/blackfire.svg"];

self.addEventListener("install", (event) => {
	console.log("[sw] installed, activating immediately");
	event.waitUntil(
		caches
			.open(OFFLINE_CACHE)
			.then((cache) => cache.addAll(OFFLINE_ASSETS))
			.catch(() => undefined)
			.then(() => self.skipWaiting()),
	);
});

self.addEventListener("activate", (event) => {
	console.log("[sw] activated, claiming clients");
	event.waitUntil(
		(async () => {
			const names = await caches.keys();
			await Promise.all(names.filter((name) => name.startsWith("blackfire-offline-") && name !== OFFLINE_CACHE).map((name) => caches.delete(name)));
			await self.clients.claim();
		})(),
	);
});

// Only page navigations are intercepted: everything else (API, assets,
// realtime) goes straight to the network as before.
self.addEventListener("fetch", (event) => {
	if (event.request.mode !== "navigate") return;
	event.respondWith(
		fetch(event.request).catch(async () => (await caches.match("/offline.html")) || Response.error()),
	);
});

self.addEventListener("message", (event) => {
	if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

// Custom (BlackFire): Spanish defaults and the white status-bar silhouette.
const DEFAULT_NOTIFICATION = {
	title: "Nuevo correo",
	body: "Tienes un mensaje nuevo",
	icon: "/icon-192.png",
	badge: "/badge-96.png",
	url: "/inbox",
};

async function syncAppBadge() {
	if (!("setAppBadge" in self.navigator)) return;
	try {
		const response = await fetch("/api/messages/counts", { credentials: "include" });
		if (!response.ok) return;
		const unread = (await response.json())?.counts?.folders?.inbox?.unread;
		if (typeof unread !== "number") return;
		await (unread > 0 ? self.navigator.setAppBadge(unread) : self.navigator.clearAppBadge());
	} catch {
		// Leave the badge as it was when the network is down or the API rejects outside an installed app.
	}
}

self.addEventListener("push", (event) => {
	event.waitUntil(
		(async () => {
			const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
			if (windows.some((client) => client.visibilityState === "visible")) return;

			let payload = DEFAULT_NOTIFICATION;
			try {
				payload = { ...DEFAULT_NOTIFICATION, ...(event.data?.json() ?? {}) };
			} catch {
				// Keep the generic notification if a provider delivers an empty or malformed payload.
			}

			await Promise.all([
				self.registration.showNotification(payload.title, {
					body: payload.body,
					icon: payload.icon,
					badge: payload.badge,
					tag: payload.tag,
					data: { url: payload.url },
				}),
				syncAppBadge(),
			]);
		})(),
	);
});

self.addEventListener("notificationclick", (event) => {
	event.notification.close();
	const target = new URL(event.notification.data?.url || "/inbox", self.location.origin).href;
	event.waitUntil(
		(async () => {
			const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
			for (const client of windows) {
				if (client.url.startsWith(self.location.origin)) {
					await client.focus();
					await client.navigate(target);
					return;
				}
			}
			await self.clients.openWindow(target);
		})(),
	);
});
