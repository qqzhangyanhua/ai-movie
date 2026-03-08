import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { create } from 'zustand'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Toast Store ───────────────────────────────

type ToastType = 'success' | 'error' | 'info'

interface Toast {
    id: string
    message: string
    type: ToastType
    duration?: number
}

interface ToastStore {
    toasts: Toast[]
    addToast: (message: string, type?: ToastType, duration?: number) => void
    removeToast: (id: string) => void
}

let toastId = 0

export const useToastStore = create<ToastStore>((set) => ({
    toasts: [],
    addToast: (message, type = 'info', duration = 3000) => {
        const id = String(++toastId)
        set((state) => ({
            toasts: [...state.toasts.slice(-2), { id, message, type, duration }],
        }))
    },
    removeToast: (id) =>
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
        })),
}))

// Convenience helpers — import these anywhere
export const toast = {
    success: (msg: string) => useToastStore.getState().addToast(msg, 'success'),
    error: (msg: string) => useToastStore.getState().addToast(msg, 'error', 5000),
    info: (msg: string) => useToastStore.getState().addToast(msg, 'info'),
}

// ─── Icons ─────────────────────────────────────

const iconMap: Record<ToastType, typeof CheckCircle> = {
    success: CheckCircle,
    error: XCircle,
    info: Info,
}

const colorMap: Record<ToastType, string> = {
    success: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    error: 'text-red-400 bg-red-500/10 border-red-500/20',
    info: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
}

// ─── Single Toast Item ─────────────────────────

function ToastItem({ toast: t }: { toast: Toast }) {
    const removeToast = useToastStore((s) => s.removeToast)
    const Icon = iconMap[t.type]

    useEffect(() => {
        const timer = setTimeout(() => removeToast(t.id), t.duration ?? 3000)
        return () => clearTimeout(timer)
    }, [t.id, t.duration, removeToast])

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 80, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={cn(
                'pointer-events-auto flex items-center gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-xl',
                colorMap[t.type]
            )}
        >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="text-sm font-medium text-foreground">{t.message}</span>
            <button
                onClick={() => removeToast(t.id)}
                className="ml-2 shrink-0 rounded-full p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
                <X className="h-3.5 w-3.5" />
            </button>
        </motion.div>
    )
}

// ─── Toast Container (mount once in App.tsx) ───

export function ToastContainer() {
    const toasts = useToastStore((s) => s.toasts)

    return (
        <div className="fixed top-5 right-5 z-[100] flex flex-col gap-2.5 pointer-events-none">
            <AnimatePresence mode="popLayout">
                {toasts.map((t) => (
                    <ToastItem key={t.id} toast={t} />
                ))}
            </AnimatePresence>
        </div>
    )
}
