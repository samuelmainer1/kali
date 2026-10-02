export default function StarRating({ rating = 0, size = 14, showValue = false }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <span className="bd-stars" style={{ fontSize: size }} aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= full || (n === full + 1 && half);
        return (
          <span key={n} className={filled ? 'bd-star on' : 'bd-star'}>
            ★
          </span>
        );
      })}
      {showValue && <span className="bd-star-val">{Number(rating).toFixed(1)}</span>}
    </span>
  );
}
