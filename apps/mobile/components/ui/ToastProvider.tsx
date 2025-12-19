import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Toast, ToastState } from "./Toast";

type ToastApi = {
  showToast: (text: string, durationMs?: number) => void;
  hideToast: () => void;
  toast: ToastState;
};

const ToastContext = createContext<ToastApi | null>(null);

type Props = {
  children: React.ReactNode;
  defaultDurationMs?: number;
};

export function ToastProvider({ children, defaultDurationMs = 3000 }: Props) {
  const [toast, setToast] = useState<ToastState>({ visible: false, text: "" });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const hideToast = useCallback(() => {
    clear();
    setToast((t) => (t.visible ? { ...t, visible: false } : t));
  }, [clear]);

  const showToast = useCallback(
    (text: string, durationMs = defaultDurationMs) => {
      clear();
      setToast({ visible: true, text });

      if (durationMs > 0) {
        timerRef.current = setTimeout(() => {
          setToast((t) => ({ ...t, visible: false }));
          timerRef.current = null;
        }, durationMs);
      }
    },
    [clear, defaultDurationMs]
  );

  // ✅ unmount cleanup
  useEffect(() => clear, [clear]);

  const value: ToastApi = { showToast, hideToast, toast };

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* ✅ App root'ta tek Toast */}
      <Toast visible={toast.visible} text={toast.text} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
