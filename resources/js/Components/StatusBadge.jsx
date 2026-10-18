export default function StatusBadge({ active }) {
    return (
        <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                active
                    ? 'bg-gf-green/15 text-gf-forest dark:text-gf-green'
                    : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
            }`}
        >
            {active ? 'Active' : 'Inactive'}
        </span>
    );
}
