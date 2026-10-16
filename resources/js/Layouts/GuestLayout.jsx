import BrandMark from '@/Components/BrandMark';
import ThemeToggle from '@/Components/ThemeToggle';

export default function GuestLayout({ children, title, subtitle }) {
    return (
        <div className="relative min-h-screen overflow-hidden bg-slate-50 text-gf-ink dark:bg-slate-950 dark:text-slate-100">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-gf-yellow/30 blur-3xl" />
                <div className="absolute right-0 top-1/4 h-96 w-96 rounded-full bg-gf-blue/20 blur-3xl" />
                <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-gf-green/20 blur-3xl" />
                <div
                    className="absolute inset-0 opacity-[0.35] dark:opacity-20"
                    style={{
                        backgroundImage:
                            'radial-gradient(circle at 1px 1px, rgb(15 23 42 / 0.12) 1px, transparent 0)',
                        backgroundSize: '24px 24px',
                    }}
                />
            </div>

            <div className="relative z-10 flex min-h-screen flex-col">
                <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-8 sm:py-5">
                    <BrandMark className="h-14 w-auto sm:h-16" showWordmark stacked />
                    <ThemeToggle />
                </div>

                <div className="flex flex-1 items-center justify-center px-4 pb-16">
                    <div className="w-full max-w-md animate-fade-in">
                        {(title || subtitle) && (
                            <div className="mb-6 text-center">
                                {title && (
                                    <h1 className="font-display text-2xl font-extrabold tracking-tight text-gf-ink dark:text-white">
                                        {title}
                                    </h1>
                                )}
                                {subtitle && (
                                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>
                                )}
                            </div>
                        )}
                        <div className="rounded-2xl border border-white/60 bg-white/90 p-6 shadow-xl shadow-slate-200/60 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-none sm:p-8">
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
