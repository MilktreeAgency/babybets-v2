import DOMPurify from 'dompurify'
import { type Descendant } from 'slate'

interface RichTextDisplayProps {
  content: string
  className?: string
}

export function RichTextDisplay({ content, className = '' }: RichTextDisplayProps) {
  // Convert Slate JSON to HTML
  const convertToHTML = (nodes: Descendant[]): string => {
    return nodes.map((node) => serializeNode(node)).join('')
  }

  const serializeNode = (node: any): string => {
    if ('text' in node) {
      let text = escapeHtml(node.text)
      if (node.bold) {
        text = `<strong>${text}</strong>`
      }
      if (node.italic) {
        text = `<em>${text}</em>`
      }
      return text
    }

    const children = node.children.map((n: any) => serializeNode(n)).join('')

    switch (node.type) {
      case 'paragraph':
        // Skip empty paragraphs or add a break
        return children.trim() ? `<p>${children}</p>` : '<br>'
      case 'heading-two':
        return `<h2>${children}</h2>`
      case 'bulleted-list':
        return `<ul class="list-disc list-outside ml-6 my-2">${children}</ul>`
      case 'numbered-list':
        return `<ol class="list-decimal list-outside ml-6 my-2">${children}</ol>`
      case 'list-item':
        return `<li class="mb-1">${children}</li>`
      default:
        return children
    }
  }

  const escapeHtml = (text: string): string => {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  let htmlContent = ''

  try {
    const parsed = JSON.parse(content)
    if (Array.isArray(parsed)) {
      htmlContent = convertToHTML(parsed)
    } else {
      // Fallback: treat as plain text and wrap in paragraph
      htmlContent = `<p>${escapeHtml(content)}</p>`
    }
  } catch {
    // If parsing fails, treat as plain text and wrap in paragraph
    // Check if it already has HTML tags
    if (content.includes('<') && content.includes('>')) {
      htmlContent = content
    } else {
      // Plain text - convert newlines to paragraphs
      htmlContent = content
        .split('\n')
        .filter(line => line.trim())
        .map(line => `<p>${escapeHtml(line)}</p>`)
        .join('')
    }
  }

  // Sanitize HTML to prevent XSS attacks
  const sanitizedContent = DOMPurify.sanitize(htmlContent, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    ADD_ATTR: ['target'],
  })

  // Add target="_blank" to all links for external opening
  const contentWithTargetBlank = sanitizedContent.replace(
    /<a /g,
    '<a target="_blank" rel="noopener noreferrer" '
  )

  return (
    <div
      className={`prose prose-sm max-w-none [&_p]:mb-2 [&_ul]:my-2 [&_ol]:my-2 ${className}`}
      dangerouslySetInnerHTML={{ __html: contentWithTargetBlank }}
    />
  )
}
