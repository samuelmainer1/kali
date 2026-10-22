import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  FileText,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Mail,
  MessageSquareQuote,
  Plus,
  Truck,
} from 'lucide-react';
import { api, getToken, setToken, uploadImage } from './adminApi';
import TrackingAdmin from './TrackingAdmin';
import BlogEditor from './BlogEditor';

const inputClass =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#88C300] focus:ring-2 focus:ring-[#88C300]/30';

const nav = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/tracking', label: 'Tracking', icon: Truck },
  { to: '/admin/blogs', label: 'Blogs', icon: FileText },
  { to: '/admin/categories', label: 'Categories', icon: FolderTree },
  { to: '/admin/jobs', label: 'Jobs', icon: Briefcase },
  { to: '/admin/testimonials', label: 'Testimonials', icon: MessageSquareQuote },
  { to: '/admin/messages', label: 'Messages', icon: Mail },
];

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-gray-700">{label}</span>
      {children}
    </label>
  );
}

function Notice({ error, message }) {
  if (!error && !message) return null;
  return (
    <p className={`mb-4 rounded-lg px-3 py-2 text-sm ${error ? 'bg-red-50 text-red-700' : 'bg-[#88C300]/15 text-[#3d5a00]'}`}>
      {error || message}
    </p>
  );
}

function PageHeader({ title, text, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
        {text && <p className="mt-1 max-w-2xl text-sm text-gray-600">{text}</p>}
      </div>
      {action}
    </div>
  );
}

function PrimaryButton({ children, ...props }) {
  return (
    <button
      {...props}
      className="inline-flex items-center gap-2 rounded-lg bg-[#88C300] px-4 py-2 text-sm font-semibold text-white hover:bg-[#6ea000] disabled:opacity-60"
    >
      {children}
    </button>
  );
}

function GhostButton({ children, ...props }) {
  return (
    <button
      {...props}
      className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
    >
      {children}
    </button>
  );
}

function Login({ onSuccess }) {
  const [email, setEmail] = useState('admin@globeflight.co.ke');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await api('/auth/login', { method: 'POST', body: { email, password } });
      setToken(data.token);
      onSuccess(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f7ef] px-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#6ea000]">Globeflight</p>
        <h1 className="mt-2 text-2xl font-semibold text-gray-900">Welcome back</h1>
        <p className="mt-1 text-sm text-gray-600">Sign in to manage shipments, blogs, messages, and newsletter emails.</p>
        <Notice error={error} />
        <div className="mt-6 space-y-4">
          <Field label="Email">
            <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Field label="Password">
            <input className={inputClass} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </Field>
        </div>
        <button
          type="submit"
          disabled={busy}
          className="mt-6 w-full rounded-lg bg-[#88C300] py-2.5 font-semibold text-white hover:bg-[#6ea000] disabled:opacity-60"
        >
          {busy ? 'Signing in...' : 'Sign in'}
        </button>
        <p className="mt-4 text-xs leading-5 text-gray-500">
          Local login is in server/LOCAL_LOGIN.txt. It does not work on the live website.
        </p>
      </form>
    </div>
  );
}

function Shell({ user, onLogout, children }) {
  return (
    <div className="min-h-screen bg-[#f6f7f4] md:flex">
      <aside className="bg-[#14210c] text-white md:w-64 md:shrink-0">
        <div className="px-5 py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#88C300]">Globeflight</p>
          <p className="mt-1 text-lg font-semibold">Admin dashboard</p>
          <p className="mt-1 text-xs text-white/60">Local copy you can edit</p>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-4 md:block md:space-y-1 md:px-3">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm ${
                    isActive ? 'bg-[#88C300] text-white' : 'text-white/80 hover:bg-white/10'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="hidden border-t border-white/10 px-5 py-4 md:block">
          <p className="truncate text-sm text-white/80">{user.email}</p>
          <button onClick={onLogout} className="mt-3 inline-flex items-center gap-2 text-sm text-white/70 hover:text-white">
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between border-b bg-white px-4 py-3 md:hidden">
          <span className="truncate text-sm text-gray-600">{user.email}</span>
          <button onClick={onLogout} className="text-sm font-medium text-gray-700">Sign out</button>
        </div>
        <main className="px-4 py-6 sm:px-8">{children}</main>
      </div>
    </div>
  );
}

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/stats')
      .then((res) => setStats(res.data))
      .catch((err) => setError(err.message));
  }, []);

  const cards = [
    ['Shipments', stats?.shipments, '/admin/tracking'],
    ['Blog posts', stats?.blogs, '/admin/blogs'],
    ['Categories', stats?.categories, '/admin/categories'],
    ['Jobs', stats?.jobs, '/admin/jobs'],
    ['Testimonials', stats?.testimonials, '/admin/testimonials'],
    ['Messages', stats?.contacts, '/admin/messages'],
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        text="Create shipments and move them through each stage. The public track page reads these records. Blogs and the other sections are editable here too. Services are part of the website."
      />
      <Notice error={error} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(([label, value, to]) => (
          <NavLink key={label} to={to} className="rounded-2xl border bg-white p-5 shadow-sm hover:border-[#88C300]">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900">{value ?? '—'}</p>
          </NavLink>
        ))}
      </div>
      <div className="mt-6 rounded-2xl border bg-white p-5 text-sm leading-6 text-gray-600">
        <p>Newsletter subscribers saved locally: {stats?.subscribers ?? 0}. Job applications saved locally: {stats?.applications ?? 0}.</p>
        <p className="mt-2">Every save writes to <span className="font-medium text-gray-800">server/data/db.json</span>. Refresh the public page to see the change.</p>
      </div>
    </div>
  );
}

function useItems(path) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api(path);
      const data = res.data;
      setItems(Array.isArray(data) ? data : data?.blogs || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [path]);

  return { items, loading, error, refresh, setError };
}

function ListTable({ columns, rows, onEdit, onDelete }) {
  if (!rows.length) {
    return <p className="rounded-xl border bg-white px-4 py-8 text-center text-sm text-gray-500">Nothing here yet.</p>;
  }
  const showActions = Boolean(onEdit || onDelete);
  return (
    <div className="overflow-hidden rounded-xl border bg-white">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="px-4 py-3 font-medium">{column.label}</th>
            ))}
            {showActions && <th className="px-4 py-3 font-medium">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t">
              {columns.map((column) => (
                <td key={column.key} className="max-w-xs truncate px-4 py-3 text-gray-800">
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
              {showActions && (
                <td className="whitespace-nowrap px-4 py-3">
                  {onEdit && (
                    <button onClick={() => onEdit(row)} className="mr-3 font-medium text-[#4f7300] hover:underline">Edit</button>
                  )}
                  {onDelete && (
                    <button onClick={() => onDelete(row)} className="font-medium text-red-600 hover:underline">Delete</button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FormShell({ title, error, message, onSubmit, onCancel, children }) {
  return (
    <form onSubmit={onSubmit} className="max-w-3xl rounded-2xl border bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">{title}</h2>
      <Notice error={error} message={message} />
      <div className="space-y-4">{children}</div>
      <div className="mt-6 flex gap-3">
        <PrimaryButton type="submit">Save</PrimaryButton>
        <GhostButton type="button" onClick={onCancel}>Cancel</GhostButton>
      </div>
    </form>
  );
}

function TextInput({ label, value, onChange, ...props }) {
  return (
    <Field label={label}>
      <input className={inputClass} value={value} onChange={(e) => onChange(e.target.value)} {...props} />
    </Field>
  );
}

function Area({ label, value, onChange, rows = 4 }) {
  return (
    <Field label={label}>
      <textarea className={inputClass} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

function Check({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-700">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

function BlogAdmin() {
  const { items, loading, error, refresh, setError } = useItems('/blogs');
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    api('/categories').then((res) => setCategories(res.data || [])).catch(() => {});
  }, []);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => `${item.title} ${item.slug}`.toLowerCase().includes(q));
  }, [items, query]);

  async function remove(item) {
    if (!window.confirm(`Delete “${item.title}”?`)) return;
    try {
      await api(`/blogs/${item.id}`, { method: 'DELETE' });
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <PageHeader
        title="Blogs"
        text="These are the posts currently on the public blog. Edits appear at /blog."
        action={<PrimaryButton type="button" onClick={() => setEditing({})}><Plus className="h-4 w-4" /> New post</PrimaryButton>}
      />
      {editing ? (
        <BlogForm
          initial={editing.id ? editing : null}
          categories={categories}
          onCancel={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refresh();
          }}
        />
      ) : (
        <>
          <Notice error={error} />
          <input className={`${inputClass} mb-4 max-w-sm`} placeholder="Search posts" value={query} onChange={(e) => setQuery(e.target.value)} />
          {loading ? <p className="text-sm text-gray-500">Loading posts...</p> : (
            <ListTable
              rows={rows}
              onEdit={setEditing}
              onDelete={remove}
              columns={[
                { key: 'title', label: 'Title' },
                { key: 'category', label: 'Category', render: (row) => row.category?.name || '—' },
                { key: 'status', label: 'Status', render: (row) => (row.isPublished === false ? 'Draft' : 'Published') },
              ]}
            />
          )}
        </>
      )}
    </div>
  );
}

function BlogForm({ initial, categories, onCancel, onSaved }) {
  const imageRef = useRef(null);
  const [preview, setPreview] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [form, setForm] = useState({
    title: initial?.title || '',
    slug: initial?.slug || '',
    shortDescription: initial?.shortDescription || '',
    content: initial?.content || '',
    featuredImage: initial?.featuredImage || '',
    categoryId: initial?.categoryId || categories[0]?.id || '',
    tags: Array.isArray(initial?.tags) ? initial.tags.join(', ') : '',
    readTime: initial?.readTime || 5,
    isPublished: initial?.isPublished !== false,
    isFeatured: !!initial?.isFeatured,
    metaTitle: initial?.metaTitle || '',
    metaDescription: initial?.metaDescription || '',
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const set = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));

  async function uploadFeatured(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploadingImage(true);
    setError('');
    try {
      set('featuredImage')(await uploadImage(file));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingImage(false);
    }
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      const path = initial?.id ? `/blogs/${initial.id}` : '/blogs';
      await api(path, { method: initial?.id ? 'PUT' : 'POST', body: form });
      setMessage('Saved.');
      onSaved();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <FormShell title={initial?.id ? 'Edit post' : 'New post'} error={error} message={message} onSubmit={submit} onCancel={onCancel}>
      <TextInput label="Title" value={form.title} onChange={set('title')} required />
      <TextInput label="Slug" value={form.slug} onChange={set('slug')} placeholder="Leave blank to build it from the title" />
      <Area label="Short description" value={form.shortDescription} onChange={set('shortDescription')} />
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Post</span>
          <button type="button" className="text-sm font-medium text-[#4f7300]" onClick={() => setPreview((current) => !current)}>
            {preview ? 'Back to editor' : 'Preview'}
          </button>
        </div>
        {preview ? (
          <div className="blog-preview rounded-lg border border-gray-300 bg-white px-4 py-3" dangerouslySetInnerHTML={{ __html: form.content || '<p>Nothing to preview yet.</p>' }} />
        ) : (
          <BlogEditor key={initial?.id || 'new'} value={form.content} onChange={set('content')} />
        )}
      </div>
      <TextInput label="Featured image URL" value={form.featuredImage} onChange={set('featuredImage')} />
      <div>
        <button type="button" className="text-sm font-medium text-[#4f7300]" onClick={() => imageRef.current?.click()}>
          {uploadingImage ? 'Uploading image...' : 'Upload featured image'}
        </button>
        <input ref={imageRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={uploadFeatured} />
        {form.featuredImage && <img src={form.featuredImage} alt="" className="mt-3 h-32 w-full rounded-lg object-cover" />}
      </div>
      <Field label="Category">
        <select className={inputClass} value={form.categoryId} onChange={(e) => set('categoryId')(e.target.value)}>
          <option value="">None</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
      </Field>
      <TextInput label="Tags, separated by commas" value={form.tags} onChange={set('tags')} />
      <TextInput label="Read time (minutes)" type="number" value={form.readTime} onChange={set('readTime')} />
      <TextInput label="Meta title" value={form.metaTitle} onChange={set('metaTitle')} />
      <Area label="Meta description" value={form.metaDescription} onChange={set('metaDescription')} rows={2} />
      <div className="flex gap-6">
        <Check label="Published" checked={form.isPublished} onChange={set('isPublished')} />
        <Check label="Featured" checked={form.isFeatured} onChange={set('isFeatured')} />
      </div>
    </FormShell>
  );
}

function CategoryAdmin() {
  const { items, loading, error, refresh, setError } = useItems('/categories');
  const [editing, setEditing] = useState(null);

  async function remove(item) {
    if (!window.confirm(`Delete “${item.name}”?`)) return;
    try {
      await api(`/categories/${item.id}`, { method: 'DELETE' });
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <PageHeader
        title="Categories"
        text="Blog categories used by the menu and the blog pages."
        action={<PrimaryButton type="button" onClick={() => setEditing({})}><Plus className="h-4 w-4" /> New category</PrimaryButton>}
      />
      {editing ? (
        <CategoryForm
          initial={editing.id ? editing : null}
          onCancel={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refresh();
          }}
        />
      ) : (
        <>
          <Notice error={error} />
          {loading ? <p className="text-sm text-gray-500">Loading categories...</p> : (
            <ListTable
              rows={items}
              onEdit={setEditing}
              onDelete={remove}
              columns={[
                { key: 'name', label: 'Name' },
                { key: 'slug', label: 'Slug' },
                { key: 'active', label: 'Active', render: (row) => (row.isActive === false ? 'No' : 'Yes') },
              ]}
            />
          )}
        </>
      )}
    </div>
  );
}

function CategoryForm({ initial, onCancel, onSaved }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    slug: initial?.slug || '',
    description: initial?.description || '',
    isActive: initial?.isActive !== false,
  });
  const [error, setError] = useState('');
  const set = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));

  async function submit(event) {
    event.preventDefault();
    try {
      const path = initial?.id ? `/categories/${initial.id}` : '/categories';
      await api(path, { method: initial?.id ? 'PUT' : 'POST', body: form });
      onSaved();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <FormShell title={initial?.id ? 'Edit category' : 'New category'} error={error} onSubmit={submit} onCancel={onCancel}>
      <TextInput label="Name" value={form.name} onChange={set('name')} required />
      <TextInput label="Slug" value={form.slug} onChange={set('slug')} />
      <Area label="Description" value={form.description || ''} onChange={set('description')} />
      <Check label="Active" checked={form.isActive} onChange={set('isActive')} />
    </FormShell>
  );
}

function JobAdmin() {
  const { items, loading, error, refresh, setError } = useItems('/jobs');
  const [applications, setApplications] = useState([]);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    api('/applications').then((res) => setApplications(res.data || [])).catch(() => {});
  }, [items]);

  async function remove(item) {
    if (!window.confirm(`Delete “${item.title}”?`)) return;
    try {
      await api(`/jobs/${item.id}`, { method: 'DELETE' });
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <PageHeader
        title="Jobs"
        text="The live careers page has no open roles, so this list starts empty. Add a job and it shows at /jobs."
        action={<PrimaryButton type="button" onClick={() => setEditing({})}><Plus className="h-4 w-4" /> New job</PrimaryButton>}
      />
      {editing ? (
        <JobForm
          initial={editing.id ? editing : null}
          onCancel={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refresh();
          }}
        />
      ) : (
        <>
          <Notice error={error} />
          {loading ? <p className="text-sm text-gray-500">Loading jobs...</p> : (
            <ListTable
              rows={items}
              onEdit={setEditing}
              onDelete={remove}
              columns={[
                { key: 'title', label: 'Title' },
                { key: 'location', label: 'Location' },
                { key: 'status', label: 'Status', render: (row) => (row.isClosed ? 'Closed' : 'Open') },
              ]}
            />
          )}
          <h2 className="mb-3 mt-8 text-lg font-semibold text-gray-900">Applications</h2>
          {applications.length === 0 ? (
            <p className="text-sm text-gray-500">Applications submitted on the local site will show up here.</p>
          ) : (
            <ListTable
              rows={applications}
              columns={[
                { key: 'name', label: 'Name' },
                { key: 'email', label: 'Email' },
                { key: 'jobTitle', label: 'Job' },
              ]}
            />
          )}
        </>
      )}
    </div>
  );
}

function JobForm({ initial, onCancel, onSaved }) {
  const [form, setForm] = useState({
    title: initial?.title || '',
    slug: initial?.slug || '',
    department: initial?.department || '',
    location: initial?.location || 'Nairobi',
    jobType: initial?.jobType || 'full-time',
    description: initial?.description || '',
    requirements: initial?.requirements || '',
    responsibilities: initial?.responsibilities || '',
    applicationDeadline: initial?.applicationDeadline ? String(initial.applicationDeadline).slice(0, 10) : '',
    isClosed: !!initial?.isClosed,
  });
  const [error, setError] = useState('');
  const set = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));

  async function submit(event) {
    event.preventDefault();
    try {
      const path = initial?.id ? `/jobs/${initial.id}` : '/jobs';
      await api(path, { method: initial?.id ? 'PUT' : 'POST', body: form });
      onSaved();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <FormShell title={initial?.id ? 'Edit job' : 'New job'} error={error} onSubmit={submit} onCancel={onCancel}>
      <TextInput label="Title" value={form.title} onChange={set('title')} required />
      <TextInput label="Slug" value={form.slug} onChange={set('slug')} />
      <TextInput label="Department" value={form.department} onChange={set('department')} />
      <TextInput label="Location" value={form.location} onChange={set('location')} />
      <Field label="Type">
        <select className={inputClass} value={form.jobType} onChange={(e) => set('jobType')(e.target.value)}>
          <option value="full-time">Full-time</option>
          <option value="part-time">Part-time</option>
          <option value="contract">Contract</option>
          <option value="internship">Internship</option>
        </select>
      </Field>
      <Area label="Description" value={form.description} onChange={set('description')} rows={6} />
      <Area label="Requirements" value={form.requirements} onChange={set('requirements')} />
      <Area label="Responsibilities" value={form.responsibilities} onChange={set('responsibilities')} />
      <TextInput label="Application deadline" type="date" value={form.applicationDeadline} onChange={set('applicationDeadline')} />
      <Check label="Closed" checked={form.isClosed} onChange={set('isClosed')} />
    </FormShell>
  );
}

function TestimonialAdmin() {
  const { items, loading, error, refresh, setError } = useItems('/testimonials');
  const [editing, setEditing] = useState(null);

  async function remove(item) {
    if (!window.confirm(`Delete the review from ${item.name}?`)) return;
    try {
      await api(`/testimonials/${item.id}`, { method: 'DELETE' });
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <PageHeader
        title="Testimonials"
        text="Published reviews from the public site. They show in the client quotes section."
        action={<PrimaryButton type="button" onClick={() => setEditing({})}><Plus className="h-4 w-4" /> New review</PrimaryButton>}
      />
      {editing ? (
        <TestimonialForm
          initial={editing.id ? editing : null}
          onCancel={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refresh();
          }}
        />
      ) : (
        <>
          <Notice error={error} />
          {loading ? <p className="text-sm text-gray-500">Loading reviews...</p> : (
            <ListTable
              rows={items}
              onEdit={setEditing}
              onDelete={remove}
              columns={[
                { key: 'name', label: 'Name' },
                { key: 'company', label: 'Company' },
                { key: 'rating', label: 'Rating' },
              ]}
            />
          )}
        </>
      )}
    </div>
  );
}

function TestimonialForm({ initial, onCancel, onSaved }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    position: initial?.position || 'Client',
    company: initial?.company || '',
    content: initial?.content || '',
    rating: initial?.rating || 5,
    isPublished: initial?.isPublished !== false,
  });
  const [error, setError] = useState('');
  const set = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));

  async function submit(event) {
    event.preventDefault();
    try {
      const path = initial?.id ? `/testimonials/${initial.id}` : '/testimonials';
      await api(path, { method: initial?.id ? 'PUT' : 'POST', body: form });
      onSaved();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <FormShell title={initial?.id ? 'Edit review' : 'New review'} error={error} onSubmit={submit} onCancel={onCancel}>
      <TextInput label="Name" value={form.name} onChange={set('name')} required />
      <TextInput label="Position" value={form.position} onChange={set('position')} />
      <TextInput label="Company" value={form.company} onChange={set('company')} />
      <Area label="Review" value={form.content} onChange={set('content')} rows={5} />
      <TextInput label="Rating" type="number" min="1" max="5" value={form.rating} onChange={set('rating')} />
      <Check label="Published" checked={form.isPublished} onChange={set('isPublished')} />
    </FormShell>
  );
}

function Messages() {
  const contacts = useItems('/contacts');
  const subscribers = useItems('/subscribers');

  async function remove(item) {
    if (!window.confirm('Delete this message?')) return;
    try {
      await api(`/contacts/${item.id}`, { method: 'DELETE' });
      contacts.refresh();
    } catch (err) {
      contacts.setError(err.message);
    }
  }

  return (
    <div>
      <PageHeader
        title="Messages"
        text="Contact form messages and newsletter signups from this local site. Messages already stored on the live site are not copied here."
      />
      <Notice error={contacts.error} />
      <h2 className="mb-3 text-lg font-semibold text-gray-900">Contact messages</h2>
      {contacts.loading ? <p className="text-sm text-gray-500">Loading messages...</p> : (
        <ListTable
          rows={contacts.items}
          onDelete={remove}
          columns={[
            { key: 'name', label: 'Name' },
            { key: 'email', label: 'Email' },
            { key: 'message', label: 'Message' },
          ]}
        />
      )}
      <h2 className="mb-3 mt-8 text-lg font-semibold text-gray-900">Newsletter</h2>
      <Notice error={subscribers.error} />
      {subscribers.loading ? <p className="text-sm text-gray-500">Loading subscribers...</p> : subscribers.items.length === 0 ? (
        <p className="text-sm text-gray-500">No local subscribers yet.</p>
      ) : (
        <ul className="divide-y rounded-xl border bg-white">
          {subscribers.items.map((item) => (
            <li key={item.id} className="px-4 py-3 text-sm text-gray-800">{item.email}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AdminApp() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!getToken()) {
      setReady(true);
      return;
    }
    api('/auth/me')
      .then((res) => setUser(res.data))
      .catch(() => setToken(null))
      .finally(() => setReady(true));
  }, []);

  if (!import.meta.env.DEV) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f7ef] px-4">
        <div className="max-w-lg rounded-2xl bg-white p-8 shadow-xl">
          <h1 className="text-2xl font-semibold text-gray-900">Local admin only</h1>
          <p className="mt-3 text-sm leading-6 text-gray-600">
            This dashboard edits the copy of the site in this project. Run it with the local dev server.
            The live dashboard stays at globeflight.co.ke/admin.
          </p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">Loading admin...</div>;
  }

  if (!user) return <Login onSuccess={setUser} />;

  function logout() {
    setToken(null);
    setUser(null);
    navigate('/admin');
  }

  return (
    <Shell user={user} onLogout={logout}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="tracking" element={<TrackingAdmin />} />
        <Route path="blogs" element={<BlogAdmin />} />
        <Route path="categories" element={<CategoryAdmin />} />
        <Route path="jobs" element={<JobAdmin />} />
        <Route path="testimonials" element={<TestimonialAdmin />} />
        <Route path="messages" element={<Messages />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </Shell>
  );
}
