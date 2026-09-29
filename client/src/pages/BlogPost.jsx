import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CalendarDays, Check, Copy, Facebook, Share2, Tag, User } from 'lucide-react';
import { api } from '../lib/api';
import { applyPageMeta, applyShopMeta, SITE_TITLE } from '../lib/pageMeta';
import BlogBody from '../components/BlogBody';

function articleUrl(slug) {
  if (typeof window === 'undefined') return `/blog/${slug}`;
  return `${window.location.origin}/blog/${slug}`;
}

function absoluteSrc(src) {
  if (!src) return '';
  if (src.startsWith('data:')) return '';
  if (/^https?:\/\//i.test(src)) return src;
  if (typeof window === 'undefined') return src;
  return `${window.location.origin}${src.startsWith('/') ? src : `/${src}`}`;
}

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError('');
    api
      .get(`/blog/${slug}`)
      .then((d) => setPost(d.post))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!post) return undefined;
    const published = post.published !== false;
    const url = articleUrl(post.slug);
    applyPageMeta({
      title: `${post.title} | BigDrop Kenya`,
      description: post.metaDescription || post.excerpt || '',
      image: absoluteSrc(post.image),
      canonical: published ? url : '',
      noindex: !published,
      type: 'article',
      jsonLd: published
        ? {
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: post.title,
            description: post.metaDescription || post.excerpt || '',
            image: absoluteSrc(post.image) || undefined,
            datePublished: post.publishedAt,
            dateModified: post.updatedAt || post.publishedAt,
            author: { '@type': 'Person', name: post.author || 'BigDrop Team' },
            publisher: { '@type': 'Organization', name: 'BigDrop Kenya' },
            mainEntityOfPage: url,
            url,
          }
        : null,
    });
    return () => applyShopMeta();
  }, [post]);

  const shareUrl = post ? articleUrl(post.slug) : '';
  const shareText = post ? `${post.title} — ${SITE_TITLE}` : '';
  const waHref = useMemo(
    () => (post ? `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}` : '#'),
    [post, shareText, shareUrl]
  );
  const fbHref = useMemo(
    () => (post ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` : '#'),
    [post, shareUrl]
  );

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy this link', shareUrl);
    }
  }

  if (loading) {
    return <div className="mx-auto max-w-3xl px-4 py-24 text-center text-sm text-ink-mute">Loading article…</div>;
  }

  if (error || !post) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-bold">Article not found</h1>
        <p className="mt-2 text-sm text-ink-mute">{error || 'This post may have been moved or removed.'}</p>
        <Link to="/blog" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-leaf hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to journal
        </Link>
      </div>
    );
  }

  return (
    <div>
      <section className="relative overflow-hidden text-white">
        <div className="absolute inset-0 bg-[#1a1a1a]" />
        <img
          src={post.image}
          alt={post.imageAlt || post.title}
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#111]/90 via-[#1a1a1a]/88 to-[#1a1a1a]" />
        <div className="relative mx-auto max-w-3xl px-4 py-16 md:px-6">
          <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Back to journal
          </Link>
          {post.published === false ? (
            <p className="mt-4 inline-flex rounded-md bg-amber-500 px-2.5 py-1 text-xs font-semibold text-black">
              Draft preview — not in Google or the public journal
            </p>
          ) : null}
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 font-display text-3xl md:text-4xl font-bold leading-tight text-balance text-white"
          >
            {post.title}
          </motion.h1>
          <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-white/80">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              {new Date(post.publishedAt).toLocaleDateString('en-KE', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              {post.author}
            </span>
          </div>
        </div>
      </section>

      <article className="mx-auto max-w-3xl px-4 py-14 md:px-6">
        <BlogBody content={post.content} ctaLabel={post.ctaLabel} ctaUrl={post.ctaUrl} />

        <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-ink/5 pt-6">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-mute">
            <Share2 className="h-3.5 w-3.5" /> Share
          </span>
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-[#25D366] px-3 py-1.5 text-xs font-semibold text-white"
          >
            WhatsApp
          </a>
          <a
            href={fbHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg bg-[#1877F2] px-3 py-1.5 text-xs font-semibold text-white"
          >
            <Facebook className="h-3.5 w-3.5" /> Facebook
          </a>
          <button
            type="button"
            onClick={copyLink}
            className="inline-flex items-center gap-1 rounded-lg border border-ink/10 px-3 py-1.5 text-xs font-semibold"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-leaf" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy link'}
          </button>
        </div>

        {post.tags?.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Link
                key={tag}
                to={`/blog?tag=${encodeURIComponent(tag)}`}
                className="inline-flex items-center gap-1.5 rounded-md bg-mist px-3 py-1.5 text-xs font-semibold text-ink-soft hover:text-leaf"
              >
                <Tag className="h-3 w-3 text-leaf" /> {tag}
              </Link>
            ))}
          </div>
        )}

        <div className="mt-10 rounded-2xl bg-ink text-white p-6 shadow-lift">
          <p className="font-display text-xl font-bold">Ready to sell on BigDrop?</p>
          <p className="mt-2 text-sm text-white/70">
            Let Globeflight handle storage and delivery while you focus on growing sales.
          </p>
          <Link
            to="/register?role=vendor"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-ember px-5 py-2.5 text-sm font-semibold hover:bg-ember-deep"
          >
            Apply as a vendor
          </Link>
        </div>
      </article>
    </div>
  );
}
