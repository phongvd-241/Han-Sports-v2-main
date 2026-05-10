const isSupported = typeof window !== "undefined" && "BroadcastChannel" in window;
const channel = isSupported ? new BroadcastChannel("hansport_sync") : null;

export const syncEvent = {
  PRODUCT_UPDATED: "PRODUCT_UPDATED",
  SETTING_UPDATED: "SETTING_UPDATED",
  USER_UPDATED: "USER_UPDATED",
};

export const notifySync = (event) => {
  if (channel) {
    channel.postMessage(event);
  }
};

export const onSync = (callback) => {
  if (!channel) return () => {};
  const handler = (e) => callback(e.data);
  channel.addEventListener("message", handler);
  return () => channel.removeEventListener("message", handler);
};
