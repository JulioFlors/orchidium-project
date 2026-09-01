'use client'

import React from 'react'

interface FormattedTextProps {
  text: string
  className?: string
}

/**
 * Componente para renderizar texto multilínea con formato básico Markdown (saltos de línea, negrita, cursiva).
 */
export function FormattedText({ text, className }: FormattedTextProps) {
  if (!text) return null

  const parseInlineMarkdown = (content: string): React.ReactNode[] => {
    // Regex para identificar:
    // 1. ***texto*** o ___texto___ (negrita y cursiva)
    // 2. **texto** o __texto__ (negrita)
    // 3. *texto* o _texto_ (cursiva)
    const regex =
      /(\*\*\*(.*?)\*\*\*|___(.*?)___|\*\*(.*?)\*\*|__(.*?)__|(?<!\w)\*(.*?)\*(?!\w)|(?<!\w)_(.*?)_(?!\w))/g

    const nodes: React.ReactNode[] = []
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = regex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        nodes.push(content.slice(lastIndex, match.index))
      }

      const [fullMatch, , boldItalic1, boldItalic2, bold1, bold2, italic1, italic2] = match
      const key = `fmt-${match.index}-${fullMatch}`

      const boldItalicText = boldItalic1 ?? boldItalic2
      const boldText = bold1 ?? bold2
      const italicText = italic1 ?? italic2

      if (boldItalicText !== undefined) {
        nodes.push(
          <strong key={key} className="font-semibold text-primary">
            <em>{boldItalicText}</em>
          </strong>,
        )
      } else if (boldText !== undefined) {
        nodes.push(
          <strong key={key} className="font-semibold text-primary">
            {boldText}
          </strong>,
        )
      } else if (italicText !== undefined) {
        nodes.push(
          <em key={key} className="italic">
            {italicText}
          </em>,
        )
      }

      lastIndex = regex.lastIndex
    }

    if (lastIndex < content.length) {
      nodes.push(content.slice(lastIndex))
    }

    return nodes
  }

  return (
    <div className={`whitespace-pre-line text-pretty ${className ?? ''}`}>
      {parseInlineMarkdown(text)}
    </div>
  )
}
