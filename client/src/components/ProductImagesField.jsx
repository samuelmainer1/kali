import { useState } from 'react';
import { fileToSquareDataUrl } from '../lib/imageUpload';

const MAX = 3;

export default function ProductImagesField({ images = [], onChange, hint }) {
  const [url, setUrl] = useState('');

  async function onFiles(e) {
    const files = [...(e.target.files || [])];
    e.target.value = '';
    if (!files.length) return;
    const next = [...images];
    try {
      for (const file of files) {
        if (next.length >= MAX) break;
        next.push(await fileToSquareDataUrl(file));
      }
      onChange(next.slice(0, MAX));
    } catch (err) {
      window.alert(err.message || 'Could not read that image.');
    }
  }

  function addUrl(e) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    if (!/^https?:\/\//i.test(trimmed) && !trimmed.startsWith('/') && !trimmed.startsWith('data:')) {
      window.alert('Paste a full image link starting with https://');
      return;
    }
    if (images.length >= MAX) {
      window.alert(`You can add up to ${MAX} photos.`);
      return;
    }
    onChange([...images.filter((x) => x !== trimmed), trimmed].slice(-MAX));
    setUrl('');
  }

  function remove(i) {
    onChange(images.filter((_, idx) => idx !== i));
  }

  function makeMain(i) {
    if (i === 0) return;
    const next = [...images];
    const [picked] = next.splice(i, 1);
    onChange([picked, ...next]);
  }

  return (
    <div className="rounded-xl border border-ink/10 p-4 space-y-3">
      <p className="text-sm font-semibold">Product photos (up to {MAX})</p>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        onChange={onFiles}
        className="block w-full text-sm"
      />
      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Or paste image link (https://…)"
          className="flex-1 rounded-xl border border-ink/10 px-3 py-2 text-sm"
        />
        <button type="button" onClick={addUrl} className="rounded-xl border border-ink/10 px-3 py-2 text-sm font-semibold">
          Add link
        </button>
      </div>
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((src, i) => (
            <div key={`${i}-${src.slice(-12)}`} className="relative">
              <img src={src} alt="" className="h-20 w-20 rounded-lg object-cover border border-ink/10" />
              {i === 0 && (
                <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1 text-[9px] font-semibold text-white">
                  Main
                </span>
              )}
              <div className="mt-1 flex gap-1">
                {i > 0 && (
                  <button type="button" className="text-[10px] font-semibold text-[#015837]" onClick={() => makeMain(i)}>
                    Main
                  </button>
                )}
                <button type="button" className="text-[10px] font-semibold text-ember" onClick={() => remove(i)}>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="text-[11px] text-ink-mute">
        {hint || 'Upload a file or paste a photo link. Square 800×800, max 150KB for uploads, up to 3 photos. Files over 20MB are refused.'}
      </p>
    </div>
  );
}
