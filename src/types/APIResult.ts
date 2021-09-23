export interface Highlight {
  body: string[]
  title: string[]
}

export interface Document {
  // eslint-disable-next-line camelcase
  mdn_url: string
  score: number
  title: string
  locale: string
  slug: string
  popularity: number
  summary: string
  highlight: Highlight
}

export interface APIResult {
  documents: Document[]
}
