import notificationService from "../services/notification.service";

/**
 * Converts a base64 string to a Uint8Array for VAPID applicationServerKey
 */
function urlBase64ToUint8Array(base64String) {
  const cleanKey = base64String.trim().replace(/^["']|["']$/g, "").replace(/[\r\n\s]/g, "");
  const padding = "=".repeat((4 - (cleanKey.length % 4)) % 4);
  const base64 = (cleanKey + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Register Service Worker safely
 */
export const registerServiceWorker = async () => {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
    return registration;
  } catch (error) {
    console.error("Service worker registration failed:", error);
    return null;
  }
};

/**
 * Check if the browser supports push notifications
 */
export const isPushSupported = () => {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
};

/**
 * Get active push subscription without hanging on uninitialized service workers
 */
export const getActiveSubscription = async () => {
  if (!isPushSupported()) return null;
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return null;
    return await registration.pushManager.getSubscription();
  } catch (err) {
    console.error("Failed to get push subscription:", err);
    return null;
  }
};

/**
 * Request permission and subscribe to browser push notifications
 */
export const subscribeToBrowserPush = async () => {
  if (!isPushSupported()) {
    throw new Error("Push notifications are not supported by this browser.");
  }

  const rawKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (!rawKey) {
    throw new Error("VAPID public key is missing from environment variables.");
  }
  const vapidPublicKey = rawKey.trim().replace(/^["']|["']$/g, "").replace(/[\r\n\s]/g, "");

  // Request browser permission
  const permission = await Notification.requestPermission();
  if (permission === "denied") {
    throw new Error(
      "Notification permission was denied. Please allow notifications in your browser address bar."
    );
  }
  if (permission !== "granted") {
    throw new Error("Notification permission was not granted.");
  }

  // Ensure service worker is registered
  const registration = await registerServiceWorker();
  if (!registration) {
    throw new Error("Failed to register service worker (/sw.js).");
  }

  // Wait for service worker to become ready (with timeout safety)
  await Promise.race([
    navigator.serviceWorker.ready,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Service worker ready state timed out.")), 8000)
    ),
  ]);

  const activeReg = await navigator.serviceWorker.ready;
  const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

  // Unsubscribe any previous or stale subscription before subscribing to avoid key mismatch
  const existingSub = await activeReg.pushManager.getSubscription();
  if (existingSub) {
    try {
      await existingSub.unsubscribe();
    } catch (unsubErr) {
      console.warn("Could not clear previous push subscription:", unsubErr);
    }
  }

  let subscription;
  try {
    subscription = await activeReg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });
  } catch (subError) {
    if (subError.message?.includes("push service error") || subError.name === "AbortError") {
      throw new Error(
        "Browser push service error: If using Brave, enable 'Google services for push' in brave://settings/privacy. If using Chrome, ensure you are not in Incognito/Guest mode."
      );
    }
    throw subError;
  }

  // Persist subscription to backend
  await notificationService.subscribeToPush(subscription.toJSON());

  return subscription;
};

/**
 * Unsubscribe from browser push notifications
 */
export const unsubscribeFromBrowserPush = async () => {
  if (!isPushSupported()) return;

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return;

    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();
      await notificationService.unsubscribeFromPush(endpoint);
    }
  } catch (err) {
    console.error("Failed to unsubscribe from push:", err);
  }
};
