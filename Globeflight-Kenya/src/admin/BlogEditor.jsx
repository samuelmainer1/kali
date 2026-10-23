import { useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { uploadImage } from './adminApi';

function ToolButton({ active, children, ...props }) {
  return (
    <button
      type="button"
      {...props}
      className={`rounded-md px-2 py-1 text-sm font-medium ${active ? 'bg-[#88C300] text-white' : 'text-gray-700 hover:bg-gray-100'}`}
    >
      {children}
    </button>
  );
}

export default function BlogEditor({ value, onChange }) {
  const fileRef = useRef(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        link: { openOnClick: false },
      }),
      Image,
      Placeholder.configure({ placeholder: 'Write the post...' }),
    ],
    content: value || '',
    onUpdate: ({ editor: current }) => onChange(current.getHTML()),
  });

  async function addImage(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !editor) return;
    setUploading(true);
    setError('');
    try {
      const url = await uploadImage(file);
      editor.chain().focus().setImage({ src: url }).run();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  function addLink() {
    if (!editor) return;
    const previous = editor.getAttributes('link').href || 'https://';
    const href = window.prompt('Link address', previous);
    if (href === null) return;
    if (!href.trim()) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: href.trim() }).run();
  }

  if (!editor) return <p className="text-sm text-gray-500">Opening the editor...</p>;

  return (
    <div className="blog-editor rounded-lg border border-gray-300 bg-white">
      <div className="flex flex-wrap gap-1 border-b px-2 py-2">
        <ToolButton active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>Bold</ToolButton>
        <ToolButton active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>Italic</ToolButton>
        <ToolButton active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>Heading</ToolButton>
        <ToolButton active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>List</ToolButton>
        <ToolButton active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>Numbered</ToolButton>
        <ToolButton active={editor.isActive('link')} onClick={addLink}>Link</ToolButton>
        <ToolButton onClick={() => fileRef.current?.click()}>{uploading ? 'Uploading...' : 'Image'}</ToolButton>
      </div>
      <EditorContent editor={editor} />
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={addImage} />
      {error && <p className="border-t px-3 py-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
