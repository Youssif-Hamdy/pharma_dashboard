import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

type ToastActionVariant = 'primary' | 'secondary' | 'danger'

export interface ToastAction {
  label: string
  variant?: ToastActionVariant
  onClick: () => void
}

export interface ToastOptions {
  type: ToastType
  title: string
  description?: string
  duration?: number
  actions?: ToastAction[]
}

interface InternalToast extends ToastOptions {
  id: string
  duration: number
  /** عند الضغط على ✕ (مثل إلغاء تأكيد الحذف) */
  onCloseRequested?: () => void
}

interface ToastContextValue {
  show: (options: ToastOptions) => string
  success: (title: string, description?: string) => string
  error: (title: string, description?: string) => string
  warning: (title: string, description?: string) => string
  info: (title: string, description?: string) => string
  confirm: (options: {
    title: string
    description?: string
    confirmLabel?: string
    cancelLabel?: string
    danger?: boolean
  }) => Promise<boolean>
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const typeStyles: Record<
  ToastType,
  { icon: typeof CheckCircle2; box: string; iconColor: string }
> = {
  success: {
    icon: CheckCircle2,
    box: 'bg-emerald-50 border-emerald-100/80',
    iconColor: 'text-emerald-600',
  },
  error: {
    icon: AlertCircle,
    box: 'bg-rose-50 border-rose-100/80',
    iconColor: 'text-rose-600',
  },
  warning: {
    icon: AlertTriangle,
    box: 'bg-amber-50 border-amber-100/80',
    iconColor: 'text-amber-700',
  },
  info: {
    icon: Info,
    box: 'border-[color-mix(in_srgb,var(--primary)_12%,transparent)] bg-[var(--primary-light)]',
    iconColor: 'text-[var(--primary)]',
  },
}

function ToastView({
  toast,
  onDismiss,
}: {
  toast: InternalToast
  onDismiss: () => void
}) {
  const cfg = typeStyles[toast.type]
  const Icon = cfg.icon
  const hasActions = toast.actions && toast.actions.length > 0

  return (
    <div
      className="toast-animate-in pointer-events-auto w-[min(100vw-2rem,22rem)] rounded-2xl border border-gray-200/90 bg-white/95 p-4 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.18)] backdrop-blur-md"
      role="status"
    >
      <div className="flex gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${cfg.box}`}
        >
          <Icon size={20} className={cfg.iconColor} strokeWidth={2} aria-hidden />
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-sm font-semibold leading-snug text-gray-900">{toast.title}</p>
          {toast.description && (
            <p className="mt-1.5 text-xs leading-relaxed text-gray-600">{toast.description}</p>
          )}
          {hasActions && (
            <div className="mt-3 flex flex-wrap justify-end gap-2">
              {toast.actions!.map((a, i) => {
                const v = a.variant ?? 'secondary'
                const base =
                  'cursor-pointer rounded-xl px-3.5 py-2 text-xs font-medium transition-transform active:scale-[0.98]'
                const cls =
                  v === 'danger'
                    ? `${base} bg-rose-600 text-white hover:bg-rose-700`
                    : v === 'primary'
                      ? `${base} text-white hover:opacity-92`
                      : `${base} border border-gray-200 bg-white text-gray-600 hover:bg-gray-50`
                const style = v === 'primary' ? { background: 'var(--primary)' } : undefined
                return (
                  <button key={i} type="button" className={cls} style={style} onClick={a.onClick}>
                    {a.label}
                  </button>
                )
              })}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            toast.onCloseRequested?.()
            onDismiss()
          }}
          className="-m-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          aria-label="إغلاق"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<InternalToast[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const show = useCallback((options: ToastOptions) => {
    const id = crypto.randomUUID()
    const hasActions = options.actions && options.actions.length > 0
    const duration =
      options.duration ?? (hasActions ? 0 : 4200)

    const wrappedActions = options.actions?.map((a) => ({
      ...a,
      onClick: () => {
        a.onClick()
        setToasts((prev) => prev.filter((t) => t.id !== id))
      },
    }))

    setToasts((prev) => [
      ...prev,
      {
        ...options,
        id,
        duration,
        actions: wrappedActions,
      },
    ])

    if (duration > 0) {
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, duration)
    }

    return id
  }, [])

  const success = useCallback(
    (title: string, description?: string) => show({ type: 'success', title, description }),
    [show],
  )
  const error = useCallback(
    (title: string, description?: string) => show({ type: 'error', title, description }),
    [show],
  )
  const warning = useCallback(
    (title: string, description?: string) => show({ type: 'warning', title, description }),
    [show],
  )
  const info = useCallback(
    (title: string, description?: string) => show({ type: 'info', title, description }),
    [show],
  )

  const confirm = useCallback(
    (opts: {
      title: string
      description?: string
      confirmLabel?: string
      cancelLabel?: string
      danger?: boolean
    }) =>
      new Promise<boolean>((resolve) => {
        const id = crypto.randomUUID()
        let settled = false
        const finish = (v: boolean) => {
          if (settled) return
          settled = true
          setToasts((prev) => prev.filter((t) => t.id !== id))
          resolve(v)
        }
        setToasts((prev) => [
          ...prev,
          {
            id,
            type: 'warning',
            title: opts.title,
            description: opts.description,
            duration: 0,
            onCloseRequested: () => finish(false),
            actions: [
              {
                label: opts.cancelLabel ?? 'إلغاء',
                variant: 'secondary',
                onClick: () => finish(false),
              },
              {
                label: opts.confirmLabel ?? 'تأكيد',
                variant: opts.danger === false ? 'primary' : 'danger',
                onClick: () => finish(true),
              },
            ],
          },
        ])
      }),
    [],
  )

  const value: ToastContextValue = {
    show,
    success,
    error,
    warning,
    info,
    confirm,
    dismiss,
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed z-[400] flex max-h-[calc(100vh-2rem)] flex-col gap-3 overflow-y-auto overscroll-contain"
        style={{ bottom: '1.25rem', left: '1.25rem' }}
      >
        {toasts.map((t) => (
          <ToastView key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
