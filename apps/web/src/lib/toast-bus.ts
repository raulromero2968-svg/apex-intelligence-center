export type ToastPayload = { title: string; description?: string };

export function fireToast(payload: ToastPayload) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('toast', { detail: payload }));
}

