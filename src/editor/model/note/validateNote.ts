import type { NoteDocument } from './noteBlock'
import { fileProps, imageProps, isAttachmentType } from './noteBlock'

function fail(path: string): never {
  throw new Error(`Некорректная заметка: ${path}`)
}

function record(value: unknown, path: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) fail(path)
  return value as Record<string, unknown>
}

function keys(value: Record<string, unknown>, allowed: string[], path: string) {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) fail(`${path}.${key}`)
  }
}

export function validateNote(value: unknown): asserts value is NoteDocument {
  if (!Array.isArray(value)) fail('initialContent: ожидается массив блоков')
  const ids = new Set<string>()
  value.forEach((item, index) => {
    const path = `blocks[${index}]`
    const block = record(item, path)
    keys(block, ['id', 'type', 'props', 'content', 'children'], path)
    if (typeof block.id !== 'string' || !block.id.trim() || ids.has(block.id)) fail(`${path}.id`)
    ids.add(block.id)
    if (!Array.isArray(block.children) || block.children.length) fail(`${path}.children`)
    if (isAttachmentType(block.type)) {
      const props = record(block.props, `${path}.props`)
      const defaults = block.type === 'image' ? imageProps : fileProps
      keys(props, Object.keys(defaults), `${path}.props`)
      for (const [key, value] of Object.entries(defaults)) {
        if (['url', 'name', 'caption'].includes(key)) {
          if (typeof props[key] !== 'string') fail(`${path}.props.${key}`)
          continue
        }
        if (props[key] !== value) fail(`${path}.props.${key}`)
      }
      if (block.content !== undefined) fail(`${path}.content`)
      return
    }
    if (block.type !== 'paragraph' && block.type !== 'heading') fail(`${path}.type`)
    const props = record(block.props, `${path}.props`)
    const propKeys = ['backgroundColor', 'textColor', 'textAlignment']
    if (block.type === 'heading') propKeys.push('level', 'isToggleable')
    keys(props, propKeys, `${path}.props`)
    if (props.backgroundColor !== 'default') fail(`${path}.props.backgroundColor`)
    if (props.textColor !== 'default') fail(`${path}.props.textColor`)
    if (props.textAlignment !== 'left') fail(`${path}.props.textAlignment`)
    if (block.type === 'heading') {
      if (![1, 2, 3].includes(props.level as number)) fail(`${path}.props.level`)
      if (props.isToggleable !== false) fail(`${path}.props.isToggleable`)
    }
    if (!Array.isArray(block.children) || block.children.length) fail(`${path}.children`)
    if (!Array.isArray(block.content)) fail(`${path}.content`)
    block.content.forEach((part, partIndex) => {
      const partPath = `${path}.content[${partIndex}]`
      const text = record(part, partPath)
      keys(text, ['type', 'text', 'styles'], partPath)
      if (text.type !== 'text') fail(`${partPath}.type`)
      if (typeof text.text !== 'string') fail(`${partPath}.text`)
      const styles = record(text.styles, `${partPath}.styles`)
      if (Object.keys(styles).length) fail(`${partPath}.styles`)
    })
  })
}
