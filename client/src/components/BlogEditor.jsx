import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Pencil, Trash2, X } from 'lucide-react';
import { api } from '../lib/api';
import { fileToBlogDataUrl } from '../lib/imageUpload';
import { safeHttpUrl } from '../lib/blogMarkup';
import BlogBody from './BlogBody';

const emptyForm = {
  title: '',
  slug: '',
  excerpt: '',
  metaDescription: '',
  content: '',
  image: '',
  imageAlt: '',
  author: 'BigDrop Team',
  tags: '',
  ctaLabel: '',
  ctaUrl: '',
  published: true,
};

function postToForm(post) {
  return {
    title: post.title || '',
    slug: post.slug || '',
    excerpt: post.excerpt || '',
    metaDescription: post.metaDescription || '',
    content: post.content || '',
    image: post.image || '',
    imageAlt: post.imageAlt || '',
    author: post.author || 'BigDrop Team',
    tags: Array.isArray(post.tags) ? post.tags.join(', ') : String(post.tags || ''),
    ctaLabel: post.ctaLabel || '',
    ctaUrl: post.ctaUrl || '',
    published: post.published !== false,
  };
}

export default function BlogEditor({ posts, flash, onError, onChanged }) {
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const bodyRef = useRef(null);

  function set(field) {
    return (e) => {
      const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      setForm((f) => ({ ...f, [field]: value }));
    };
  }

  function insertAtCursor(snippet, selectHint) {
    const el = bodyRef.current;
    if (!el) {
      setForm((f) => ({ ...f, content: `${f.content}\n${snippet}` }));
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = form.content.slice(start, end);
    let insert = snippet;
    if (selectHint && selected) insert = snippet.replace(selectHint, selected);
    const next = form.content.slice(0, start) + insert + form.content.slice(end);
    setForm((f) => ({ ...f, content: next }));
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + insert.length;
      el.setSelectionRange(pos, pos);
    });
  }

  function insertLink() {
    const el = bodyRef.current;
    const selected = el ? form.content.slice(el.selectionStart, el.selectionEnd) : '';
    const label = selected || window.prompt('Link text') || 'Read more';
    const url = window.prompt('Website URL (https://…)', 'https://');
    const href = safeHttpUrl(url);
    if (!href) {
      onError('Enter a full http:// or https:// website address.');
      return;
    }
    insertAtCursor(`[${label}](${href})`);
  }

  async function onFile(file) {
    if (!file) return;
    try {
      const data = await fileToBlogDataUrl(file);
      setForm((f) => ({ ...f, image: data }));
    } catch (err) {
      onError(err.message);
    }
  }

  function startEdit(post) {
    setEditingId(post.id);
    setForm(postToForm(post));
    setPreview(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setPreview(false);
  }

  async function save(asPublished) {
    setBusy(true);
    try {
      const payload = {
        ...form,
        published: asPublished,
        tags: form.tags,
      };
      if (!form.image?.startsWith('data:')) delete payload.image;
      if (editingId) {
        await api.patch(`/admin/blog/${editingId}`, payload);
        flash(asPublished ? 'Article updated' : 'Draft saved');
      } else {
        await api.post('/admin/blog', payload);
        flash(asPublished ? 'Article published' : 'Draft saved');
      }
      resetForm();
      await onChanged();
    } catch (err) {
      onError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function togglePost(post) {
    try {
      await api.patch(`/admin/blog/${post.id}`, { published: post.published === false });
      flash(post.published === false ? 'Published' : 'Unpublished');
      await onChanged();
    } catch (err) {
      onError(err.message);
    }
  }

  async function removePost(id) {
    if (!confirm('Delete this article?')) return;
    try {
      await api.delete(`/admin/blog/${id}`);
      if (editingId === id) resetForm();
      flash('Article deleted');
      await onChanged();
    } catch (err) {
      onError(err.message);
    }
  }

  const field = 'mt-1 w-full rounded-xl border border-ink/10 px-3 py-2.5';
  const tool = 'rounded-lg border border-ink/10 px-2.5 py-1 text-xs font-semibold hover:bg-mist';

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-2">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save(form.published);
        }}
        className="space-y-3 rounded-2xl border border-ink/5 bg-white p-6 shadow-lift"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-xl font-bold">{editingId ? 'Edit article' : 'New article'}</h2>
          {editingId ? (
            <button type="button" onClick={resetForm} className="text-xs font-semibold text-ink-mute">
              Cancel edit
            </button>
          ) : null}
        </div>

        <label className="block text-sm">
          <span className="text-ink-mute">Title (H1)</span>
          <input required placeholder="Article title" value={form.title} onChange={set('title')} className={field} />
        </label>
        <label className="block text-sm">
          <span className="text-ink-mute">URL slug</span>
          <input
            placeholder="ecommerce-fulfillment-kenya"
            value={form.slug}
            onChange={set('slug')}
            className={field}
          />
          <span className="mt-1 block text-[11px] text-ink-mute">Leave blank to generate from the title. Live URL: /blog/{form.slug || '…'}</span>
        </label>
        <label className="block text-sm">
          <span className="text-ink-mute">Short excerpt (blog cards)</span>
          <input placeholder="One or two lines on the journal cards" value={form.excerpt} onChange={set('excerpt')} className={field} />
        </label>
        <label className="block text-sm">
          <span className="text-ink-mute">Meta description (Google)</span>
          <textarea
            rows={2}
            maxLength={320}
            placeholder="The line Google can show under the title in search"
            value={form.metaDescription}
            onChange={set('metaDescription')}
            className={field}
          />
          <span className="mt-1 block text-[11px] text-ink-mute">{form.metaDescription.length}/320</span>
        </label>

        <div>
          <span className="text-sm text-ink-mute">Article body</span>
          <div className="mt-1 mb-2 flex flex-wrap gap-1.5">
            <button type="button" className={tool} onClick={() => insertAtCursor('\n## Heading\n', 'Heading')}>
              H2
            </button>
            <button type="button" className={tool} onClick={() => insertAtCursor('\n### Heading\n', 'Heading')}>
              H3
            </button>
            <button type="button" className={tool} onClick={() => insertAtCursor('\n#### Heading\n', 'Heading')}>
              H4
            </button>
            <button type="button" className={tool} onClick={() => insertAtCursor('\n> Your quote\n', 'Your quote')}>
              Quote
            </button>
            <button type="button" className={tool} onClick={insertLink}>
              Link
            </button>
          </div>
          <textarea
            ref={bodyRef}
            required
            rows={12}
            placeholder={'Write the article.\n\n## A section heading\n\n> A pulled-out quote\n\nA paragraph with a [website link](https://example.com).'}
            value={form.content}
            onChange={set('content')}
            className={field + ' font-mono text-sm'}
          />
        </div>

        <label className="block text-sm">
          <span className="text-ink-mute">Link button label (optional)</span>
          <input placeholder="Visit Globeflight Kenya" value={form.ctaLabel} onChange={set('ctaLabel')} className={field} />
        </label>
        <label className="block text-sm">
          <span className="text-ink-mute">Link button URL</span>
          <input placeholder="https://www.globeflight.co.ke" value={form.ctaUrl} onChange={set('ctaUrl')} className={field} />
        </label>
        <label className="block text-sm">
          <span className="text-ink-mute">Tags / category (comma separated)</span>
          <input placeholder="fulfillment, delivery" value={form.tags} onChange={set('tags')} className={field} />
        </label>
        <label className="block text-sm">
          <span className="text-ink-mute">Author</span>
          <input value={form.author} onChange={set('author')} className={field} />
        </label>
        <label className="block text-sm">
          <span className="text-ink-mute">Cover image</span>
          <input type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0])} className="mt-1 block text-sm" />
          {form.image ? <img src={form.image} alt="" className="mt-2 h-20 w-auto rounded border object-cover" /> : null}
        </label>
        <label className="block text-sm">
          <span className="text-ink-mute">Cover image alt text</span>
          <input placeholder="Describe the photo for accessibility and Google" value={form.imageAlt} onChange={set('imageAlt')} className={field} />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.published} onChange={set('published')} />
          Live on the site (untick to keep as a draft)
        </label>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setPreview(true)}
            className="rounded-xl border border-ink/10 px-4 py-2.5 text-sm font-semibold"
          >
            Preview
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => save(false)}
            className="rounded-xl border border-ink/10 px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
          >
            Save draft
          </button>
          <button type="submit" disabled={busy} className="rounded-xl bg-ember px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
            {busy ? 'Saving…' : editingId ? (form.published ? 'Update' : 'Save') : form.published ? 'Publish' : 'Save draft'}
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {posts.map((p) => (
          <div key={p.id} className="rounded-2xl border border-ink/5 bg-white p-4 shadow-lift">
            <p className="font-semibold">{p.title}</p>
            <p className="text-xs text-ink-mute">
              {p.published === false ? 'Draft' : 'Live'} · /blog/{p.slug}
              {p.tags?.length ? ` · ${p.tags.join(', ')}` : ''}
            </p>
            <div className="mt-2 flex flex-wrap gap-3">
              <button type="button" onClick={() => startEdit(p)} className="inline-flex items-center gap-1 text-xs font-semibold text-leaf">
                <Pencil className="h-3 w-3" /> Edit
              </button>
              <Link to={`/blog/${p.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-ink-mute">
                <Eye className="h-3 w-3" /> {p.published === false ? 'Preview' : 'View'}
              </Link>
              <button type="button" onClick={() => togglePost(p)} className="text-xs font-semibold text-ember">
                {p.published === false ? 'Publish' : 'Unpublish'}
              </button>
              <button type="button" onClick={() => removePost(p.id)} className="inline-flex items-center gap-1 text-xs font-semibold text-red-600">
                <Trash2 className="h-3 w-3" /> Delete
              </button>
            </div>
          </div>
        ))}
        {posts.length === 0 && <p className="text-sm text-ink-mute">No articles yet.</p>}
      </div>

      {preview ? (
        <div className="bd-doc-modal" role="dialog" aria-modal="true" aria-label="Article preview">
          <div className="bd-doc-modal-backdrop" onClick={() => setPreview(false)} />
          <div className="bd-doc-modal-panel">
            <div className="bd-doc-modal-toolbar">
              <strong>Preview — not live until you publish</strong>
              <button type="button" className="bd-doc-modal-close" onClick={() => setPreview(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="bd-doc-sheet p-6">
              {form.image ? <img src={form.image} alt={form.imageAlt || form.title} className="mb-4 max-h-48 w-full rounded object-cover" /> : null}
              <h1 className="font-display text-3xl font-bold">{form.title || 'Untitled'}</h1>
              {form.excerpt ? <p className="mt-2 text-sm text-ink-mute">{form.excerpt}</p> : null}
              <div className="mt-6">
                <BlogBody content={form.content} ctaLabel={form.ctaLabel} ctaUrl={form.ctaUrl} />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
