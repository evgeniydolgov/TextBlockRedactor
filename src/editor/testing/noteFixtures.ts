import { createAttachment, type AttachmentBlock, type TextBlock, type HeadingLevel } from '../model/note/noteBlock'

export function paragraph(id = 'p1', text = ''): Extract<TextBlock, { type: 'paragraph' }> {
  return {
    id, type: 'paragraph',
    props: { backgroundColor: 'default', textColor: 'default', textAlignment: 'left' },
    content: text ? [{ type: 'text', text, styles: {} }] : [], children: [],
  }
}

export function heading(level: HeadingLevel, id = `h${level}`, text = ''): Extract<TextBlock, { type: 'heading' }> {
  return {
    ...paragraph(id, text), type: 'heading',
    props: {
      backgroundColor: 'default', textColor: 'default', textAlignment: 'left',
      level, isToggleable: false,
    },
  }
}

export function mixedNote(): TextBlock[] {
  return [paragraph('p1', '  Привет 🌍 '), heading(1, 'h1', 'Один'),
    heading(2, 'h2', 'Два'), heading(3), paragraph('empty')]
}

export function attachmentNote() {
  return [...mixedNote(), createAttachment('image', 'image1'), createAttachment('file', 'file1')]
}

export function populatedImage(id = 'image1'): Extract<AttachmentBlock, { type: 'image' }> {
  const image = createAttachment('image', id)
  return { ...image, props: { ...image.props, url: 'stored-image-id', name: 'photo.png', caption: 'Подпись' } }
}
