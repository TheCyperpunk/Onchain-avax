"use client";

import { useEffect } from "react";

export function useLockBodyScroll(isLocked: boolean) {
  useEffect(() => {
    document.body.style.overflow = isLocked ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isLocked]);
}
