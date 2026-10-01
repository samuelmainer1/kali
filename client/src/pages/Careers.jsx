import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHero from '../components/PageHero';
import { api } from '../lib/api';

function JobCard({ job }) {
  const [open, setOpen] = useState(false);
  const long = (job.description || '').trim();
  const preview = job.summary || '';

  return (
    <article className="rounded-2xl border border-ink/5 bg-white p-6 shadow-lift">
      <h2 className="font-display text-lg font-bold">{job.title}</h2>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[#f68b1e]">
        {job.location} · {job.type}
      </p>
      <p className="mt-3 text-sm text-ink-mute leading-relaxed">{preview}</p>
      {long ? (
        <>
          {open ? (
            <p className="mt-3 text-sm text-ink leading-relaxed whitespace-pre-line">{long}</p>
          ) : null}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="mt-3 text-sm font-semibold text-[#015837] hover:underline"
          >
            {open ? 'Read less' : 'Read more'}
          </button>
        </>
      ) : null}
    </article>
  );
}

export default function Careers() {
  const [openings, setOpenings] = useState([]);

  useEffect(() => {
    api
      .get('/jobs')
      .then((d) => setOpenings(d.jobs || []))
      .catch(() => setOpenings([]));
  }, []);

  return (
    <div>
      <PageHero
        crumbs={[{ label: 'Careers' }]}
        title="Careers at BigDrop"
        subtitle="Join the team building Kenya's marketplace with Globeflight fulfillment behind every delivery."
      />

      <div className="mx-auto max-w-4xl px-4 py-14 md:px-6">
        <p className="text-sm text-ink-mute leading-relaxed">
          BigDrop is a product of Globeflight Worldwide Express Ltd. We are growing our team across
          operations, vendor success, and customer experience. If you are passionate about e-commerce
          and logistics in Kenya, we would love to hear from you.
        </p>

        <div className="mt-10 space-y-4">
          {openings.map((job) => (
            <JobCard key={job.id || job.title} job={job} />
          ))}
          {openings.length === 0 && (
            <p className="text-sm text-ink-mute">No openings right now — check back soon or send us your CV.</p>
          )}
        </div>

        <div className="mt-10 rounded-2xl bg-[#1a1a1a] px-8 py-8 text-white">
          <h2 className="font-display text-xl font-bold">How to apply</h2>
          <p className="mt-2 text-sm text-white/75 leading-relaxed">
            Send your CV and a short cover letter to{' '}
            <a href="mailto:info@bigdrop.co.ke" className="text-[#f68b1e] hover:underline">
              info@bigdrop.co.ke
            </a>{' '}
            with the role title in the subject line. You can also reach our team through the{' '}
            <Link to="/contact" className="text-[#f68b1e] hover:underline">
              contact page
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
