"use client";

import type { ReactNode } from "react";

export default function AppHeader({ children }: { children: ReactNode }) {
  return <header className="bg-black/80 backdrop-blur-md px-6 py-2">{children}</header>;
}
