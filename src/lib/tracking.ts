// Client-side analytics tracking utility

/**
 * Safely tracks a custom event to Google Analytics (gtag).
 * @param eventName The name of the event (e.g., 'start_conversion', 'download_result')
 * @param params Additional parameters to send with the event
 */
export const trackEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window !== "undefined" && typeof (window as any).gtag === "function") {
    try {
      (window as any).gtag("event", eventName, params);
    } catch (error) {
      console.warn("Failed to send tracking event:", error);
    }
  }
};
