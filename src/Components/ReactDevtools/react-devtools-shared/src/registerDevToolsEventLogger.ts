import type { LoggerEvent } from "react-devtools-shared/src/Logger";
import { registerEventLogger } from "react-devtools-shared/src/Logger";
import { enableLogger } from "react-devtools-feature-flags";
let loggingIFrame = null;
let missedEvents = [];
type LoggerContext = {
  page_url: string | null | undefined;
};
export function registerDevToolsEventLogger(surface: string, fetchAdditionalContext: (() => LoggerContext | ((() => Promise<LoggerContext>) | null | undefined)) | null | undefined): void {
  async function logEvent(event: LoggerEvent) {
    if (enableLogger) {
      if (loggingIFrame != null) {
        let metadata = null;

        if (event.metadata != null) {
          metadata = event.metadata;
          delete event.metadata;
        }

        loggingIFrame.contentWindow.postMessage({
          source: 'react-devtools-logging',
          event: event,
          context: {
            surface,
            version: process.env.DEVTOOLS_VERSION,
            metadata: metadata !== null ? JSON.stringify(metadata) : '',
            ...(fetchAdditionalContext != null ? await fetchAdditionalContext() : {})
          }
        }, '*');
      } else {
        missedEvents.push(event);
      }
    }
  }

  function handleLoggingIFrameLoaded(iframe) {
    if (loggingIFrame != null) {
      return;
    }

    loggingIFrame = iframe;

    if (missedEvents.length > 0) {
      missedEvents.forEach(event => logEvent(event));
      missedEvents = [];
    }
  }

  // If logger is enabled, register a logger that captures logged events
  // and render iframe where the logged events will be reported to
  if (enableLogger) {
    const loggingUrl = process.env.LOGGING_URL;
    const body = document.body;

    if (typeof loggingUrl === 'string' && loggingUrl.length > 0 && body != null) {
      registerEventLogger(logEvent);
      const iframe = document.createElement('iframe');
      iframe.src = loggingUrl;

      iframe.onload = function (...args) {
        handleLoggingIFrameLoaded(iframe);
      };

      body.appendChild(iframe);
    }
  }
}