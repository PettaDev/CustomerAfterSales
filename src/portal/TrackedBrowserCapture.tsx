import { useEffect, useRef } from "react";
import BrowserCapture from "./BrowserCapture";

type DeviceInfo = {
  brand: string;
  model: string;
  build: string;
  android: string;
  serial: string;
};

type Props = {
  onFiles: (files: File[]) => void;
  onDeviceInfo?: (info: DeviceInfo) => void;
  onBusyChange?: (busy: boolean) => void;
};

export default function TrackedBrowserCapture({ onFiles, onDeviceInfo, onBusyChange }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !onBusyChange) return;

    const report = () => {
      const hasActivePhase = Boolean(root.querySelector(".usb-recording, .usb-status"));
      const connectingButton = root.querySelector<HTMLButtonElement>("button.usb-action.primary:disabled");
      const hasConsent = Boolean(root.querySelector(".usb-consent"));
      onBusyChange(hasActivePhase || Boolean(connectingButton && !hasConsent));
    };

    report();
    const observer = new MutationObserver(report);
    observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ["disabled"] });
    return () => {
      observer.disconnect();
      onBusyChange(false);
    };
  }, [onBusyChange]);

  return <div ref={rootRef}><BrowserCapture onFiles={onFiles} onDeviceInfo={onDeviceInfo} /></div>;
}
