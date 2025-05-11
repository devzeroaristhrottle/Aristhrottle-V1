"use client";
import { useEffect } from "react";

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
  }
}

export function GoogleTranslate() {
  useEffect(() => {
    if (!window.googleTranslateElementInit) {
      window.googleTranslateElementInit = () => {
        // @typescript-eslint/no-explicit-any
        new (window as any).google.translate.TranslateElement(
          { pageLanguage: "en" },
          "google_translate_element"
        );
      };

      const scriptId = "google-translate-script";
      if (!document.getElementById(scriptId)) {
        const addScript = document.createElement("script");
        addScript.id = scriptId;
        addScript.src =
          "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
        addScript.async = true;
        document.body.appendChild(addScript);
      }
    }
  }, []);

  return <div id="google_translate_element" className="flex justify-end"></div>;
}
