"use client";

import { useState, useCallback } from "react";

export function useTweaks<T extends Record<string, any>>(
  defaults: T
): [T, (keyOrEdits: keyof T | Partial<T>, val?: any) => void] {
  const [values, setValues] = useState<T>(defaults);

  const setTweak = useCallback((keyOrEdits: keyof T | Partial<T>, val?: any) => {
    const edits =
      typeof keyOrEdits === "object" && keyOrEdits !== null
        ? (keyOrEdits as Partial<T>)
        : ({ [keyOrEdits as string]: val } as Partial<T>);

    setValues((prev) => ({ ...prev, ...edits }));

    if (typeof window !== "undefined") {
      window.parent.postMessage({ type: "__edit_mode_set_keys", edits }, "*");
      window.dispatchEvent(new CustomEvent("tweakchange", { detail: edits }));
    }
  }, []);

  return [values, setTweak];
}
export default useTweaks;
