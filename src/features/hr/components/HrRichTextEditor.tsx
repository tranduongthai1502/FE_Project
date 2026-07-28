import { useEffect, useRef, useState, type ChangeEvent, type MouseEvent } from 'react'
import { EditorContent, useEditor, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import styles from '../styles/HrDashboard.module.css'
import { formatFileSize, validateRichTextAttachment } from '../services/hrFileAttachmentLogic'
import { getRichTextPlainText } from '../services/hrRichTextUtils'

function RichTextToolbar({ editor, onAttachFile, onCommandRun }: { editor: Editor | null; onAttachFile: () => void; onCommandRun: () => void }) {
  const runCommand = (event: MouseEvent<HTMLButtonElement>, command: () => boolean) => {
    event.preventDefault()
    event.stopPropagation()
    if (!editor) return
    command()
    onCommandRun()
    window.setTimeout(() => editor.commands.focus(), 0)
  }
  return (
    <div className={styles.richTextToolbar}>
      <button type="button" tabIndex={-1} className={editor?.isActive('bold') ? styles.activeRichTextTool : undefined} onClick={(event) => event.preventDefault()} onMouseDown={(event) => runCommand(event, () => editor?.chain().focus().toggleBold().run() ?? false)} aria-label="Bold">
        <svg width="9" height="12" viewBox="0 0 9 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M0 11.6667V0H4.60417C5.50694 0 6.34028 0.277778 7.10417 0.833333C7.86806 1.38889 8.25 2.15972 8.25 3.14583C8.25 3.85417 8.09028 4.39931 7.77083 4.78125C7.45139 5.16319 7.15278 5.4375 6.875 5.60417C7.22222 5.75694 7.60764 6.04167 8.03125 6.45833C8.45486 6.875 8.66667 7.5 8.66667 8.33333C8.66667 9.56944 8.21528 10.434 7.3125 10.9271C6.40972 11.4201 5.5625 11.6667 4.77083 11.6667H0ZM2.52083 9.33333H4.6875C5.35417 9.33333 5.76042 9.16319 5.90625 8.82292C6.05208 8.48264 6.125 8.23611 6.125 8.08333C6.125 7.93056 6.05208 7.68403 5.90625 7.34375C5.76042 7.00347 5.33333 6.83333 4.625 6.83333H2.52083V9.33333ZM2.52083 4.58333H4.45833C4.91667 4.58333 5.25 4.46528 5.45833 4.22917C5.66667 3.99306 5.77083 3.72917 5.77083 3.4375C5.77083 3.10417 5.65278 2.83333 5.41667 2.625C5.18056 2.41667 4.875 2.3125 4.5 2.3125H2.52083V4.58333Z" fill="currentColor" />
        </svg>
      </button>
      <button type="button" tabIndex={-1} className={editor?.isActive('italic') ? styles.activeRichTextTool : undefined} onClick={(event) => event.preventDefault()} onMouseDown={(event) => runCommand(event, () => editor?.chain().focus().toggleItalic().run() ?? false)} aria-label="Italic">
        <svg width="11" height="12" viewBox="0 0 11 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M0 11.6667V9.58333H3.33333L5.83333 2.08333H2.5V0H10.8333V2.08333H7.91667L5.41667 9.58333H8.33333V11.6667H0Z" fill="currentColor" />
        </svg>
      </button>
      <button type="button" tabIndex={-1} className={editor?.isActive('bulletList') ? styles.activeRichTextTool : undefined} onClick={(event) => event.preventDefault()} onMouseDown={(event) => runCommand(event, () => editor?.chain().focus().toggleBulletList().run() ?? false)} aria-label="Bullet list">
        <svg width="15" height="14" viewBox="0 0 15 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M5 12.5V10.8333H15V12.5H5ZM5 7.5V5.83333H15V7.5H5ZM5 2.5V0.833333H15V2.5H5ZM1.66667 13.3333C1.20833 13.3333 0.815972 13.1701 0.489583 12.8438C0.163194 12.5174 0 12.125 0 11.6667C0 11.2083 0.163194 10.816 0.489583 10.4896C0.815972 10.1632 1.20833 10 1.66667 10C2.125 10 2.51736 10.1632 2.84375 10.4896C3.17014 10.816 3.33333 11.2083 3.33333 11.6667C3.33333 12.125 3.17014 12.5174 2.84375 12.8438C2.51736 13.1701 2.125 13.3333 1.66667 13.3333ZM1.66667 8.33333C1.20833 8.33333 0.815972 8.17014 0.489583 7.84375C0.163194 7.51736 0 7.125 0 6.66667C0 6.20833 0.163194 5.81597 0.489583 5.48958C0.815972 5.16319 1.20833 5 1.66667 5C2.125 5 2.51736 5.16319 2.84375 5.48958C3.17014 5.81597 3.33333 6.20833 3.33333 6.66667C3.33333 7.125 3.17014 7.51736 2.84375 7.84375C2.51736 8.17014 2.125 8.33333 1.66667 8.33333ZM1.66667 3.33333C1.20833 3.33333 0.815972 3.17014 0.489583 2.84375C0.163194 2.51736 0 2.125 0 1.66667C0 1.20833 0.163194 0.815972 0.489583 0.489583C0.815972 0.163194 1.20833 0 1.66667 0C2.125 0 2.51736 0.163194 2.84375 0.489583C3.17014 0.815972 3.33333 1.20833 3.33333 1.66667C3.33333 2.125 3.17014 2.51736 2.84375 2.84375C2.51736 3.17014 2.125 3.33333 1.66667 3.33333Z" fill="currentColor" />
        </svg>
      </button>
      <button type="button" tabIndex={-1} onClick={(event) => event.preventDefault()} onMouseDown={(event) => { event.preventDefault(); event.stopPropagation(); onAttachFile() }} aria-label="Attach file" title="Attach file">
        <svg width="17" height="9" viewBox="0 0 17 9" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M7.5 8.33333H4.16667C3.01389 8.33333 2.03125 7.92708 1.21875 7.11458C0.40625 6.30208 0 5.31944 0 4.16667C0 3.01389 0.40625 2.03125 1.21875 1.21875C2.03125 0.40625 3.01389 0 4.16667 0H7.5V1.66667H4.16667C3.47222 1.66667 2.88194 1.90972 2.39583 2.39583C1.90972 2.88194 1.66667 3.47222 1.66667 4.16667C1.66667 4.86111 1.90972 5.45139 2.39583 5.9375C2.88194 6.42361 3.47222 6.66667 4.16667 6.66667H7.5V8.33333ZM5 5V3.33333H11.6667V5H5ZM9.16667 8.33333V6.66667H12.5C13.1944 6.66667 13.7847 6.42361 14.2708 5.9375C14.7569 5.45139 15 4.86111 15 4.16667C15 3.47222 14.7569 2.88194 14.2708 2.39583C13.7847 1.90972 13.1944 1.66667 12.5 1.66667H9.16667V0H12.5C13.6528 0 14.6354 0.40625 15.4479 1.21875C16.2604 2.03125 16.6667 3.01389 16.6667 4.16667C16.6667 5.31944 16.2604 6.30208 15.4479 7.11458C14.6354 7.92708 13.6528 8.33333 12.5 8.33333H9.16667Z" fill="currentColor" />
        </svg>
      </button>
    </div>
  )
}

export function JobRichTextEditor({
  hasError,
  onChange,
  placeholder,
  value,
}: {
  hasError?: boolean
  onChange: (value: string) => void
  placeholder: string
  value: string
}) {
  const [toolbarVersion, setToolbarVersion] = useState(0)
  const [attachmentTotalSize, setAttachmentTotalSize] = useState(0)
  const [attachmentError, setAttachmentError] = useState('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const refreshToolbar = () => setToolbarVersion((version) => version + 1)
  const editor = useEditor({
    content: value || '',
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
      }),
    ],
    editorProps: {
      attributes: {
        class: styles.richTextEditor,
        'data-placeholder': placeholder,
      },
    },
    onUpdate: ({ editor: activeEditor }) => {
      onChange(activeEditor.isEmpty ? '' : activeEditor.getHTML())
      refreshToolbar()
    },
    onSelectionUpdate: refreshToolbar,
    onTransaction: refreshToolbar,
  })

  useEffect(() => {
    if (!editor || editor.getHTML() === value || (editor.isEmpty && !value)) return
    editor.commands.setContent(value || '', { emitUpdate: false })
  }, [editor, value])

  const openFilePicker = () => {
    setAttachmentError('')
    fileInputRef.current?.click()
  }
  const attachSelectedFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !editor) return

    const validation = await validateRichTextAttachment(file, attachmentTotalSize)
    if (validation.error) {
      setAttachmentError(validation.error)
      window.setTimeout(() => editor.commands.focus(), 0)
      return
    }

    const objectUrl = URL.createObjectURL(file)
    const label = `${file.name} (${formatFileSize(file.size)})`
    editor
      .chain()
      .focus()
      .insertContent({
        type: 'text',
        text: label,
        marks: [{ type: 'link', attrs: { href: objectUrl, target: '_blank', rel: 'noopener noreferrer', title: file.name } }],
      })
      .insertContent(' ')
      .run()

    setAttachmentTotalSize(validation.nextTotalSize)
    setAttachmentError('')
    refreshToolbar()
    window.setTimeout(() => editor.commands.focus(), 0)
  }

  return (
    <div className={`${styles.richTextBox} ${hasError ? styles.jobInputError : ''}`.trim()}>
      <RichTextToolbar editor={editor} onAttachFile={openFilePicker} onCommandRun={refreshToolbar} key={toolbarVersion} />
      <EditorContent editor={editor} />
      <input ref={fileInputRef} className={styles.richTextFileInput} type="file" onChange={attachSelectedFile} aria-label="Attach file" />
      <small className={styles.richTextAttachmentError} aria-hidden={!attachmentError}>{attachmentError || 'Attachment error'}</small>
    </div>
  )
}

export function RichTextDisplay({ fallback, value }: { fallback: string; value?: string }) {
  if (!getRichTextPlainText(value)) return <p>{fallback}</p>

  return <div className={styles.richTextDisplay} dangerouslySetInnerHTML={{ __html: value || '' }} />
}

function RequirementCheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <circle cx="15" cy="15" r="13" stroke="#B62B06" strokeWidth="2.5" />
      <path d="M9 15.3L13 19.3L21.5 10.8" stroke="#B62B06" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function RequirementsDisplay({ fallback, value }: { fallback: string; value?: string }) {
  if (!getRichTextPlainText(value)) return <p>{fallback}</p>

  const parser = new DOMParser()
  const doc = parser.parseFromString(value || '', 'text/html')
  const items = Array.from(doc.querySelectorAll('li'))
    .map((item) => item.textContent?.trim() || '')
    .filter(Boolean)

  if (items.length === 0) return <RichTextDisplay fallback={fallback} value={value} />

  return (
    <ul className={styles.jobRequirementList}>
      {items.map((item, index) => (
        <li key={`${item}-${index}`}>
          <RequirementCheckIcon />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}
