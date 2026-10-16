import { useId } from 'react';

/**
 * Globeflight brand mark — four interlocking crescent segments.
 */
export default function BrandMark({ className = 'h-12 w-12', showWordmark = false }) {
    const uid = useId().replace(/:/g, '');

    return (
        <div className={`flex items-center gap-3 ${showWordmark ? '' : ''}`}>
            <svg
                className={className}
                viewBox="0 0 120 120"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
            >
                <defs>
                    <clipPath id={`clip-${uid}`}>
                        <circle cx="60" cy="60" r="54" />
                    </clipPath>
                </defs>
                <circle cx="60" cy="60" r="54" fill="#F7F8FA" />
                <g clipPath={`url(#clip-${uid})`}>
                    {/* Top — yellow */}
                    <path
                        d="M60 10c22 0 41 14 48 34-12 6-26 6-38-1-10-6-18-16-22-28 4-3 8-5 12-5z"
                        fill="#F5C400"
                    />
                    <circle cx="88" cy="28" r="7" fill="#F5C400" />
                    {/* Right — green */}
                    <path
                        d="M110 60c0 22-14 41-34 48-6-12-6-26 1-38 6-10 16-18 28-22 3 4 5 8 5 12z"
                        fill="#2EAF4A"
                    />
                    <circle cx="92" cy="88" r="7" fill="#2EAF4A" />
                    {/* Bottom — red */}
                    <path
                        d="M60 110c-22 0-41-14-48-34 12-6 26-6 38 1 10 6 18 16 22 28-4 3-8 5-12 5z"
                        fill="#E30613"
                    />
                    <circle cx="32" cy="92" r="7" fill="#E30613" />
                    {/* Left — blue */}
                    <path
                        d="M10 60c0-22 14-41 34-48 6 12 6 26-1 38-6 10-16 18-28 22-3-4-5-8-5-12z"
                        fill="#00A5E3"
                    />
                    <circle cx="28" cy="32" r="7" fill="#00A5E3" />
                </g>
                <circle cx="60" cy="60" r="16" fill="white" />
                <circle cx="60" cy="60" r="54" stroke="#E5E7EB" strokeWidth="2" fill="none" />
            </svg>
            {showWordmark && (
                <div className="leading-tight">
                    <div className="font-display text-lg font-extrabold italic tracking-tight text-gf-ink dark:text-white">
                        Globeflight
                    </div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gf-forest dark:text-gf-green">
                        24 · seven · 365
                    </div>
                </div>
            )}
        </div>
    );
}
