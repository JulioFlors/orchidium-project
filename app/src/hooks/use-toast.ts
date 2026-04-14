import { useToastStore, type ToastType } from '@/store/toast/toast.store'

export function useToast() {
  const addToast = useToastStore((state) => state.addToast)

  return {
    toast: (message: string, type: ToastType = 'info', duration?: number) =>
      addToast(message, type, duration),
    success: (message: string, duration?: number) => addToast(message, 'success', duration),
    error: (message: string, duration?: number) => addToast(message, 'error', duration),
    warning: (message: string, duration?: number) => addToast(message, 'warning', duration),
    info: (message: string, duration?: number) => addToast(message, 'info', duration),
  }
}
