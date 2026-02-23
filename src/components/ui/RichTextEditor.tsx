import { useCallback, useMemo } from 'react'
import { createEditor, type Descendant, Editor, Element as SlateElement, Transforms } from 'slate'
import { Slate, Editable, withReact, type RenderElementProps, type RenderLeafProps } from 'slate-react'
import { withHistory } from 'slate-history'
import { Bold, Italic, List, ListOrdered, Heading2 } from 'lucide-react'

// Custom types for Slate
type CustomElement = {
  type: string
  children: CustomText[]
}

type CustomText = {
  text: string
  bold?: boolean
  italic?: boolean
}

declare module 'slate' {
  interface CustomTypes {
    Element: CustomElement
    Text: CustomText
  }
}

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

const HOTKEYS: Record<string, string> = {
  'mod+b': 'bold',
  'mod+i': 'italic',
}

const LIST_TYPES = ['numbered-list', 'bulleted-list']

export function RichTextEditor({ value, onChange, placeholder, disabled, className }: RichTextEditorProps) {
  const renderElement = useCallback((props: RenderElementProps) => <Element {...props} />, [])
  const renderLeaf = useCallback((props: RenderLeafProps) => <Leaf {...props} />, [])
  const editor = useMemo(() => withHistory(withReact(createEditor())), [])

  // Parse initial value
  const initialValue = useMemo((): Descendant[] => {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as Descendant[]
      }
    } catch {
      // If parsing fails or empty, return default
    }
    return [{ type: 'paragraph', children: [{ text: '' }] }]
  }, [])

  const handleChange = (newValue: Descendant[]) => {
    const isAstChange = editor.operations.some(op => 'set_selection' !== op.type)
    if (isAstChange) {
      onChange(JSON.stringify(newValue))
    }
  }

  const toggleBlock = (format: string) => {
    const isActive = isBlockActive(editor, format)
    const isList = LIST_TYPES.includes(format)

    Transforms.unwrapNodes(editor, {
      match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && LIST_TYPES.includes(n.type as string),
      split: true,
    })

    const newProperties: Partial<SlateElement> = {
      type: isActive ? 'paragraph' : isList ? 'list-item' : (format as any),
    }
    Transforms.setNodes<SlateElement>(editor, newProperties)

    if (!isActive && isList) {
      const block = { type: format, children: [] }
      Transforms.wrapNodes(editor, block)
    }
  }

  const toggleMark = (format: string) => {
    const isActive = isMarkActive(editor, format)
    if (isActive) {
      Editor.removeMark(editor, format)
    } else {
      Editor.addMark(editor, format, true)
    }
  }

  return (
    <div className={`border border-border rounded-lg overflow-hidden ${disabled ? 'opacity-60 cursor-not-allowed' : ''} ${className}`}>
      <Slate editor={editor} initialValue={initialValue} onChange={handleChange}>
        {/* Toolbar */}
        <div className="flex items-center gap-1 p-2 bg-admin-gray-bg border-b border-border flex-wrap">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault()
              toggleMark('bold')
            }}
            className={`p-2 rounded hover:bg-admin-hover-bg transition-colors cursor-pointer ${
              isMarkActive(editor, 'bold') ? 'bg-admin-hover-bg' : ''
            }`}
            title="Bold (Ctrl+B)"
          >
            <Bold className="size-4" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault()
              toggleMark('italic')
            }}
            className={`p-2 rounded hover:bg-admin-hover-bg transition-colors cursor-pointer ${
              isMarkActive(editor, 'italic') ? 'bg-admin-hover-bg' : ''
            }`}
            title="Italic (Ctrl+I)"
          >
            <Italic className="size-4" />
          </button>

          <div className="w-px h-6 bg-border mx-1" />

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault()
              toggleBlock('heading-two')
            }}
            className={`p-2 rounded hover:bg-admin-hover-bg transition-colors cursor-pointer ${
              isBlockActive(editor, 'heading-two') ? 'bg-admin-hover-bg' : ''
            }`}
            title="Heading 2"
          >
            <Heading2 className="size-4" />
          </button>

          <div className="w-px h-6 bg-border mx-1" />

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault()
              toggleBlock('bulleted-list')
            }}
            className={`p-2 rounded hover:bg-admin-hover-bg transition-colors cursor-pointer ${
              isBlockActive(editor, 'bulleted-list') ? 'bg-admin-hover-bg' : ''
            }`}
            title="Bullet List"
          >
            <List className="size-4" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault()
              toggleBlock('numbered-list')
            }}
            className={`p-2 rounded hover:bg-admin-hover-bg transition-colors cursor-pointer ${
              isBlockActive(editor, 'numbered-list') ? 'bg-admin-hover-bg' : ''
            }`}
            title="Numbered List"
          >
            <ListOrdered className="size-4" />
          </button>
        </div>

        {/* Editor Content */}
        <div className="relative">
          <Editable
            renderElement={renderElement}
            renderLeaf={renderLeaf}
            placeholder={placeholder || 'Start writing...'}
            spellCheck
            autoFocus={false}
            readOnly={disabled}
            onKeyDown={(event) => {
              for (const hotkey in HOTKEYS) {
                if (isHotkey(hotkey, event as any)) {
                  event.preventDefault()
                  const mark = HOTKEYS[hotkey]
                  toggleMark(mark)
                }
              }
            }}
            className="min-h-[150px] p-3 focus:outline-none"
            style={{ lineHeight: '1.5' }}
          />
        </div>
      </Slate>
    </div>
  )
}

// Helper functions
const isBlockActive = (editor: Editor, format: string) => {
  const { selection } = editor
  if (!selection) return false

  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === format,
    })
  )

  return !!match
}

const isMarkActive = (editor: Editor, format: string) => {
  const marks = Editor.marks(editor)
  return marks ? marks[format as keyof typeof marks] === true : false
}

const isHotkey = (hotkey: string, event: any) => {
  const keys = hotkey.split('+')
  const modKey = keys[0] === 'mod'
  const key = keys[keys.length - 1]

  const isMod = (event.ctrlKey || event.metaKey)

  if (modKey && !isMod) return false
  return event.key.toLowerCase() === key.toLowerCase()
}

// Rendering components
const Element = ({ attributes, children, element }: RenderElementProps) => {
  const style = { textAlign: (element as any).align }
  switch ((element as any).type) {
    case 'bulleted-list':
      return (
        <ul style={style} {...attributes} className="list-disc list-outside ml-6">
          {children}
        </ul>
      )
    case 'heading-two':
      return (
        <h2 style={style} {...attributes} className="text-xl font-bold mt-4 mb-2">
          {children}
        </h2>
      )
    case 'list-item':
      return (
        <li style={style} {...attributes}>
          {children}
        </li>
      )
    case 'numbered-list':
      return (
        <ol style={style} {...attributes} className="list-decimal list-outside ml-6">
          {children}
        </ol>
      )
    default:
      return (
        <p style={style} {...attributes} className="m-0 leading-normal">
          {children}
        </p>
      )
  }
}

const Leaf = ({ attributes, children, leaf }: RenderLeafProps) => {
  if ((leaf as any).bold) {
    children = <strong>{children}</strong>
  }

  if ((leaf as any).italic) {
    children = <em>{children}</em>
  }

  return <span {...attributes}>{children}</span>
}
