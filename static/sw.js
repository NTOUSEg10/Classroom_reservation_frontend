self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data?.json() || {};
  } catch {
    data = {};
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "海大教室借用平台", {
      body: data.body || "您的借用狀態已更新，請至通知中心查看。",
      icon: "/favicon.svg",
      tag: data.id || "reservation-update",
      data: { url: "/notifications" },
    }),
  );
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(async (clients) => {
        const windowClient = clients.find(
          (client) => new URL(client.url).origin === self.location.origin,
        );
        if (windowClient) {
          await windowClient.navigate("/notifications");
          return windowClient.focus();
        }
        return self.clients.openWindow("/notifications");
      }),
  );
});
