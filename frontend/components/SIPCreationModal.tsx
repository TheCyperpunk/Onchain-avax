"use client";

import type { ReactNode } from "react";

interface SIPCreationModalProps {
  isOpen: boolean;
  children: ReactNode;
}

export default function SIPCreationModal({ isOpen, children }: SIPCreationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-6">
      {children}
    </div>
  );
}
