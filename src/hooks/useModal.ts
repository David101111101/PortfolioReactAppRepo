import { useEffect, useRef } from "react";

// This hook manages the behavior of a modal dialog, including focus management, scroll locking, and keyboard interactions. It ensures that when the modal is open, focus is trapped within it, and that pressing the Escape key will close the modal. It also handles restoring focus to the previously focused element when the modal is closed.
type UseModalOptions<T extends HTMLElement> = {
  isOpen: boolean;
  onRequestClose: () => void;
  initialFocusRef?: React.RefObject<T | null>;
  restoreFocusRef?: React.RefObject<HTMLElement | null>;
};

export function useModal<T extends HTMLElement>({
  isOpen,
  onRequestClose,
  initialFocusRef,
  restoreFocusRef,
}: UseModalOptions<T>) {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const previousOverflow = useRef<string>("");

  useEffect(() => {
    if (!isOpen) return;

    const el = modalRef.current;
    if (!el) return;


    // ===== reduced motion detection
    const prefersReducedMotion =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ===== autofocus
    requestAnimationFrame(() => {
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
      } else {
        el.focus();
      }
    });

    const restoreScroll = () => {
      document.body.style.overflow = previousOverflow.current;
    };

    const restoreFocus = () => {
      if (restoreFocusRef?.current) {
        // small delay avoids animation race
        setTimeout(() => {
          restoreFocusRef.current?.focus();
        }, prefersReducedMotion ? 0 : 180);
      }
    };

    const requestCloseSafe = () => {
      restoreScroll();
      restoreFocus();
      onRequestClose();
    };

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        requestCloseSafe();
      }

      // ===== focus trap
      if (e.key === "Tab") {
        const focusable = el.querySelectorAll<HTMLElement>(
          'button, input, textarea, a[href], select, [tabindex]:not([tabindex="-1"])'
        );

        if (!focusable.length) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }

        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKey);

    return () => {
      restoreScroll();
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen, onRequestClose, initialFocusRef, restoreFocusRef]);

  return modalRef;
}