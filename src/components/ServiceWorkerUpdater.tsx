import React, { useState, useEffect, useCallback } from "react";
import { FaSyncAlt } from "react-icons/fa";
import * as serviceWorkerRegistration from "../serviceWorkerRegistration";

// Registers the offline service worker and, when a new version has finished
// downloading in the background, shows a small persistent banner instead of
// silently swapping content under the user (which would be confusing mid-chat).
const ServiceWorkerUpdater: React.FC = () => {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    serviceWorkerRegistration.register({
      onUpdate: (registration) => {
        if (registration.waiting) setWaitingWorker(registration.waiting);
      },
    });
  }, []);

  const applyUpdate = useCallback(() => {
    if (!waitingWorker) return;
    waitingWorker.addEventListener("statechange", (e) => {
      if ((e.target as ServiceWorker).state === "activated") {
        window.location.reload();
      }
    });
    waitingWorker.postMessage({ type: "SKIP_WAITING" });
  }, [waitingWorker]);

  if (!waitingWorker) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl bg-card border border-border">
      <FaSyncAlt size={14} className="text-primary flex-shrink-0" />
      <span className="text-sm text-foreground">A new version is available.</span>
      <button
        onClick={applyUpdate}
        className="px-3 py-1.5 rounded-lg bg-primary text-onAccent text-sm font-semibold hover:bg-primary-hover transition flex-shrink-0"
      >
        Reload
      </button>
    </div>
  );
};

export default ServiceWorkerUpdater;
