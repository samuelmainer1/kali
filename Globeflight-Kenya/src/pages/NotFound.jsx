import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

export default function NotFound() {
  return (
    <section className="px-4 pt-40 pb-24 text-center">
      <Helmet>
        <title>Page not found | Globeflight Kenya</title>
        <meta name="description" content="This page is not available. Go back to Globeflight Kenya services, tracking, or contact." />
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href="https://globeflight.co.ke/" />
        <meta property="og:title" content="Page not found | Globeflight Kenya" />
        <meta property="og:description" content="This page is not available. Go back to Globeflight Kenya services, tracking, or contact." />
        <meta property="og:url" content="https://globeflight.co.ke/" />
        <meta name="twitter:title" content="Page not found | Globeflight Kenya" />
        <meta name="twitter:description" content="This page is not available. Go back to Globeflight Kenya services, tracking, or contact." />
        <meta name="twitter:url" content="https://globeflight.co.ke/" />
      </Helmet>
      <p className="text-sm font-semibold tracking-wide text-[#6ea000]">404</p>
      <h1 className="mt-3 text-4xl font-bold text-gray-900">This page is not available</h1>
      <p className="mx-auto mt-4 max-w-xl text-lg text-gray-600">
        The address may have changed. You can go back to the home page, or open services, tracking, or contact.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link to="/" className="rounded-lg bg-[#88C300] px-5 py-3 font-semibold text-white hover:bg-[#6ea000]">
          Home
        </Link>
        <Link to="/services" className="rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-800 hover:border-[#88C300]">
          Services
        </Link>
        <Link to="/track" className="rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-800 hover:border-[#88C300]">
          Track
        </Link>
        <Link to="/contact-us" className="rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-800 hover:border-[#88C300]">
          Contact
        </Link>
      </div>
    </section>
  );
}
