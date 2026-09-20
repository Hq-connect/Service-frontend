/**
 * HQ Web Push Service Worker
 * Listens for incoming OS push notifications when the browser or HQ tab is closed/backgrounded.
 */

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload = {};
  try {
    payload = event.data.json();
  } catch (err) {
    payload = {
      title: "HQ Notification",
      message: event.data.text(),
    };
  }

  const title = payload.title || "HQ Notification";
  const options = {
    body: payload.message || "",
    icon: "/favicon.svg",
    badge: "/favicon.svg",
    tag: payload.notificationId || "hq-notification",
    data: {
      url: payload.url || "/notifications",
      notificationId: payload.notificationId,
    },
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((clientList) => {
        // Focus existing open tab if available
        for (const client of clientList) {
          if ("focus" in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }

        // Otherwise open a new window
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});
