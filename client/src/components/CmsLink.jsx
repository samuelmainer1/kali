import { Link } from 'react-router-dom';

export default function CmsLink({ href, className, children, onClick }) {
  const to = href || '/';
  if (/^https?:\/\//i.test(to) || to.startsWith('mailto:') || to.startsWith('tel:')) {
    return (
      <a href={to} className={className} target={to.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" onClick={onClick}>
        {children}
      </a>
    );
  }
  return (
    <Link to={to} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}
