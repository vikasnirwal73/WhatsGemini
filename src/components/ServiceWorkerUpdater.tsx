import React, { useState, useEffect, useCallback } from "react";
import { FaSyncAlt } from "react-icons/fa";
import * as serviceWorkerRegistration from "../serviceWorkerRegistration";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

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
    <Card className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-3 px-4 py-3">
      <FaSyncAlt size={14} className="text-primary flex-shrink-0" />
      <span className="text-sm text-foreground">A new version is available.</span>
      <Button onClick={applyUpdate} className="h-auto px-3 py-1.5 flex-shrink-0">
        Reload
      </Button>
    </Card>
  );
};

export default ServiceWorkerUpdater;
