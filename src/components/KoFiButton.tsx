import "./KoFiButton.css";

import { Button } from "@radix-ui/themes";
import { useEffect, useState } from "react";

declare global {
  interface Window {
    kofiwidget2?: {
      init: (text: string, color: string, id: string) => void;
      getHTML: () => string;
    };
  }
}

const SCRIPT_SRC = "https://storage.ko-fi.com/cdn/widget/Widget_2.js";
const KOFI_ID = "T6T1U20P7";
const LABEL = "Support me on Ko-fi";
const COLOR = "#ffc53d";

let scriptPromise: Promise<void> | null = null;

/**
 * Ko-fi's official button. Its widget script only offers `draw()`, which
 * uses `document.write`, so the markup comes from `getHTML()` instead.
 * Until the script loads (or if it's blocked), a plain link stands in.
 */
export function KoFiButton() {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadScript()
      .then(() => {
        const widget = window.kofiwidget2;
        if (cancelled || !widget) return;
        widget.init(LABEL, COLOR, KOFI_ID);
        setHtml(widget.getHTML());
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (html) {
    // Markup comes from Ko-fi's own widget script
    // eslint-disable-next-line @eslint-react/dom-no-dangerously-set-innerhtml
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  }

  return (
    <Button asChild size="3">
      <a
        href={`https://ko-fi.com/${KOFI_ID}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        {LABEL}
      </a>
    </Button>
  );
}

function loadScript() {
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("Ko-fi widget failed to load"));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}
