import { Link } from '@inertiajs/react';

export default function PageHeader({ title, description, actions }) {
    return (
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <h2 className="font-display text-2xl font-bold tracking-tight text-gf-ink dark:text-white">
                    {title}
                </h2>
                {description && (
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
                )}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
    );
}

export function HeaderLink({ href, children }) {
    return (
        <Link
            href={href}
            className="inline-flex items-center rounded-xl bg-gf-green px-4 py-2.5 text-sm font-semibold text-gf-ink transition hover:bg-gf-forest hover:text-white"
        >
            {children}
        </Link>
    );
}
