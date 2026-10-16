export default function PrimaryButton({
    className = '',
    disabled,
    children,
    ...props
}) {
    return (
        <button
            {...props}
            className={
                `inline-flex items-center rounded-xl border border-transparent bg-gf-forest px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-gf-ink focus:outline-none focus:ring-2 focus:ring-gf-green focus:ring-offset-2 active:bg-gf-ink disabled:opacity-40 ${className}`
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
