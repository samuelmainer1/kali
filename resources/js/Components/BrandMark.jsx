/**
 * Official Globeflight logo assets (from company brand files).
 *
 * - full/stacked: complete lockup (mark + Globeflight + 24 • seven • 365)
 * - mark only: four-colour pinwheel
 */
export default function BrandMark({
    className = 'h-12 w-auto',
    showWordmark = false,
    stacked = false,
}) {
    if (stacked || showWordmark) {
        return (
            <img
                src="/images/globeflight-logo.png"
                alt="Globeflight — 24 • seven • 365"
                className={`${className} object-contain object-left`}
                draggable={false}
            />
        );
    }

    return (
        <img
            src="/images/globeflight-mark.png"
            alt="Globeflight"
            className={`${className} object-contain`}
            draggable={false}
        />
    );
}
