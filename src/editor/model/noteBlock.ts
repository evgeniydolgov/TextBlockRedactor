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

export type NoteBlock = BlockContent & (
  | { type: 'paragraph'; props: DefaultBlockProps }
  | { type: 'heading'; props: DefaultBlockProps & { level: HeadingLevel; isToggleable: false } }
)

export type NoteDocument = NoteBlock[]
