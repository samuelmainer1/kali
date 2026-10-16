import { Link } from '@inertiajs/react';

export default function Pagination({ links = [] }) {
    if (!links.length || links.length <= 3) {
        return null;
    }

    return (
        <div className="mt-4 flex flex-wrap items-center gap-2">
            {links.map((link, index) => {
                const label = link.label
                    .replace('&laquo; Previous', 'Previous')
                    .replace('Next &raquo;', 'Next');

                if (!link.url) {
                    return (
                        <span
                            key={`${label}-${index}`}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-400 dark:border-slate-700"
                            dangerouslySetInnerHTML={{ __html: label }}
                        />
                    );
                }

                return (
                    <Link
                        key={`${label}-${index}`}
                        href={link.url}
                        className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                            link.active
                                ? 'border-gf-forest bg-gf-forest text-white'
                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
                        }`}
                        dangerouslySetInnerHTML={{ __html: label }}
                    />
                );
            })}
        </div>
    );
}
