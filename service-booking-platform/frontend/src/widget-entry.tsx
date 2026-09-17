import React from "react";
import ReactDOM from "react-dom/client";
import { ChatWidget } from "./components/widget/ChatWidget";
import { MerchantProvider } from "./context/MerchantContext";
import "./index.css";

interface WidgetInitConfig {
  merchantId?: string;
  apiBase?: string;
  containerId?: string;
}

declare global {
  interface Window {
    BookingAgentWidget?: {
      init: (config?: WidgetInitConfig) => void;
    };
  }
}

export function mountWidget(config?: WidgetInitConfig) {
  // If merchantId is passed, save it to sessionStorage/localStorage so MerchantContext can pick it up
  if (config?.merchantId) {
    localStorage.setItem("merchant_id", config.merchantId);
  }

  const containerId = config?.containerId || "booking-agent-chat-widget-root";
  let hostEl = document.getElementById(containerId);
  if (!hostEl) {
    hostEl = document.createElement("div");
    hostEl.id = containerId;
    document.body.appendChild(hostEl);
  }

  const root = ReactDOM.createRoot(hostEl);
  root.render(
    <React.StrictMode>
      <MerchantProvider>
        <ChatWidget initialOpen={false} />
      </MerchantProvider>
    </React.StrictMode>
  );
}

// Auto-initialize if script tag has data attributes
if (typeof window !== "undefined") {
  window.BookingAgentWidget = {
    init: mountWidget,
  };


  document.addEventListener("DOMContentLoaded", () => {
    const currentScript = document.currentScript as HTMLScriptElement | null;
    const merchantId = currentScript?.getAttribute("data-merchant-id") || undefined;
    const apiBase = currentScript?.getAttribute("data-api-base") || undefined;

    if (currentScript?.hasAttribute("data-auto-mount") || merchantId) {
      mountWidget({ merchantId, apiBase });
    }
  });
}
