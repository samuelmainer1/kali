import { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { CheckCircle2, XCircle, X } from 'lucide-react';

/**
 * Flash toast notifications from Inertia shared flash props.
 */
export default function ToastStack() {
    const { flash } = usePage().props;
    const [toasts, setToasts] = useState([]);

    useEffect(() => {
        const next = [];
        if (flash?.success) {
            next.push({ id: Date.now() + 1, type: 'success', message: flash.success });
        }
        if (flash?.error) {
            next.push({ id: Date.now() + 2, type: 'error', message: flash.error });
        }
        if (flash?.status) {
            next.push({ id: Date.now() + 3, type: 'success', message: flash.status });
        }
        if (next.length) {
            setToasts((current) => [...current, ...next]);
        }
    }, [flash?.success, flash?.error, flash?.status]);

    useEffect(() => {
        if (!toasts.length) {
            return undefined;
        }
        const timer = setTimeout(() => {
            setToasts((current) => current.slice(1));
        }, 4200);
        return () => clearTimeout(timer);
    }, [toasts]);

    if (!toasts.length) {
        return null;
    }

    return (
        <div className="pointer-events-none fixed right-4 top-4 z-[80] flex w-full max-w-sm flex-col gap-2">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className="pointer-events-auto flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-lg animate-slide-in dark:border-slate-700 dark:bg-slate-900"
                >
                    {toast.type === 'success' ? (
                        <CheckCircle2 className="mt-0.5 h-5 w-5 text-gf-green" />
                    ) : (
                        <XCircle className="mt-0.5 h-5 w-5 text-gf-red" />
                    )}
                    <p className="flex-1 text-sm text-slate-700 dark:text-slate-200">{toast.message}</p>
                    <button
                        type="button"
                        className="text-slate-400 hover:text-slate-600"
                        onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            ))}
        </div>
    );
}
