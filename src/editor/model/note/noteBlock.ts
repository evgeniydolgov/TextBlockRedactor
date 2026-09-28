export type HeadingLevel = 1 | 2 | 3

export type DefaultBlockProps = {
  backgroundColor: 'default'
  textColor: 'default'
  textAlignment: 'left'
}

export const defaultBlockProps: DefaultBlockProps = {
  backgroundColor: 'default',
  textColor: 'default',
  textAlignment: 'left',
}

export type NoteText = { type: 'text'; text: string; styles: Record<string, never> }

type BlockContent = {
  id: string
  content: NoteText[]
  children: []
}

export type TextBlock = BlockContent & (
  | { type: 'paragraph'; props: DefaultBlockProps }
  | { type: 'heading'; props: DefaultBlockProps & { level: HeadingLevel; isToggleable: false } }
)

export type NoteDocument = NoteBlock[]

export type AttachmentType = 'image' | 'file'
export const fileProps = { backgroundColor: 'default', name: '', url: '', caption: '' } as const
export const imageProps = { ...fileProps, textAlignment: 'left', showPreview: true, previewWidth: undefined } as const
type FileMetadata = {
  url: string
  name: string
  caption: string
}
export type FileBlockProps = Omit<typeof fileProps, keyof FileMetadata> & FileMetadata
export type ImageBlockProps = Omit<typeof imageProps, keyof FileMetadata> & FileMetadata
export type AttachmentBlock = { id: string; content?: undefined; children: [] } & (
  | { type: 'file'; props: FileBlockProps }
  | { type: 'image'; props: ImageBlockProps }
)
export type NoteBlock = TextBlock | AttachmentBlock

export function isAttachmentType(type: unknown): type is AttachmentType {
  return type === 'image' || type === 'file'
}

export function createAttachment(type: 'image', id: string): Extract<AttachmentBlock, { type: 'image' }>
export function createAttachment(type: 'file', id: string): Extract<AttachmentBlock, { type: 'file' }>
export function createAttachment(type: AttachmentType, id: string): AttachmentBlock
export function createAttachment(type: AttachmentType, id: string): AttachmentBlock {
  return type === 'image'
    ? { id, type, props: { ...imageProps }, children: [] }
    : { id, type, props: { ...fileProps }, children: [] }
}
