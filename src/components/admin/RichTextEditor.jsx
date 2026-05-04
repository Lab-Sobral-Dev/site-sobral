import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';

export default function RichTextEditor({ value, onChange }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || '',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '', false);
    }
  }, [value, editor]);

  if (!editor) return null;

  const btn = (action, label, active) => (
    <button
      type="button"
      onClick={action}
      className={`px-2 py-1 text-[12px] rounded font-[600] transition-colors ${
        active ? 'bg-orange text-white' : 'bg-[#f0f0f0] text-ink-light hover:bg-[#e0e0e0]'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="border border-line rounded-[8px] overflow-hidden">
      <div className="flex gap-1.5 p-2 border-b border-line bg-[#fafafa] flex-wrap">
        {btn(() => editor.chain().focus().toggleBold().run(), 'N', editor.isActive('bold'))}
        {btn(() => editor.chain().focus().toggleItalic().run(), 'I', editor.isActive('italic'))}
        {btn(() => editor.chain().focus().toggleBulletList().run(), '• Lista', editor.isActive('bulletList'))}
        {btn(() => editor.chain().focus().toggleOrderedList().run(), '1. Lista', editor.isActive('orderedList'))}
        {btn(() => editor.chain().focus().toggleHeading({ level: 2 }).run(), 'H2', editor.isActive('heading', { level: 2 }))}
      </div>
      <EditorContent
        editor={editor}
        className="p-3 text-[14px] min-h-[100px] [&_.ProseMirror]:outline-none [&_.ProseMirror_p]:mb-2 [&_.ProseMirror_h2]:text-[20px] [&_.ProseMirror_h2]:font-[800] [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-5 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-5"
      />
    </div>
  );
}
