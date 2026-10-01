import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CalendarDays, User } from 'lucide-react';
import { api } from '../lib/api';
import PageHero from '../components/PageHero';

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [params] = useSearchParams();
  const tag = (params.get('tag') || '').trim();

  useEffect(() => {
    api
      .get('/blog')
      .then((d) => setPosts(d.posts || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const tags = useMemo(() => {
    const set = new Set();
    for (const p of posts) {
      for (const t of p.tags || []) if (t) set.add(t);
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [posts]);

  const visible = useMemo(() => {
    if (!tag) return posts;
    const needle = tag.toLowerCase();
    return posts.filter((p) => (p.tags || []).some((t) => String(t).toLowerCase() === needle));
  }, [posts, tag]);

  return (
    <div>
      <PageHero
        crumbs={[{ label: 'Blog' }]}
        title="The BigDrop Journal"
        subtitle="Stories on fulfillment, selling online, and growing a business with Globeflight Kenya."
      />

      <div className="mx-auto max-w-7xl px-4 py-14 md:px-6">
        {loading && <p className="text-sm text-ink-mute">Loading articles…</p>}
        {error && <p className="text-sm text-ember">{error}</p>}

        {tags.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            <Link
              to="/blog"
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${!tag ? 'bg-ink text-white' : 'bg-mist text-ink-soft'}`}
            >
              All
            </Link>
            {tags.map((t) => (
              <Link
                key={t}
                to={`/blog?tag=${encodeURIComponent(t)}`}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  tag.toLowerCase() === t.toLowerCase() ? 'bg-ink text-white' : 'bg-mist text-ink-soft'
                }`}
              >
                {t}
              </Link>
            ))}
          </div>
        )}

        {!loading && !error && visible.length === 0 && (
          <p className="text-sm text-ink-mute">
            {tag ? `No live articles tagged “${tag}”.` : 'No articles published yet — check back soon.'}
          </p>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((post, i) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 3) * 0.06 }}
              className="group flex flex-col overflow-hidden rounded-2xl border border-ink/5 bg-white shadow-lift transition hover:-translate-y-1 hover:shadow-xl"
            >
              <Link to={`/blog/${post.slug}`} className="block aspect-[16/10] overflow-hidden bg-mist">
                <img
                  src={post.image}
                  alt={post.imageAlt || post.title}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </Link>
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-center gap-3 text-xs text-ink-mute">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {new Date(post.publishedAt).toLocaleDateString('en-KE', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    {post.author}
                  </span>
                </div>
                <h2 className="mt-3 font-display text-lg font-bold leading-snug group-hover:text-ember">
                  <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                </h2>
                <p className="mt-2 flex-1 text-sm text-ink-mute line-clamp-3">{post.excerpt}</p>
                <Link
                  to={`/blog/${post.slug}`}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-ember"
                >
                  Read more <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </div>
  );
}
