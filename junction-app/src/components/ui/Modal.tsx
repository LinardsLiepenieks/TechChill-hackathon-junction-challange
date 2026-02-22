"use client";

import { useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-lg bg-background border border-border p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-medium">{title}</h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground transition-colors text-lg leading-none cursor-pointer"
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        <div className="text-muted whitespace-pre-line leading-relaxed text-sm">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
