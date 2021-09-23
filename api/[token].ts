import axios from 'axios'
import { APIResult, Document } from '../src/types/APIResult'
import { InlineQueryResultArticle, Update } from '@grammyjs/types'
import { VercelRequest, VercelResponse } from '@vercel/node'
import { config } from '../src/config'

const makeInlineResult = (apiDocument: Document): InlineQueryResultArticle => ({
  type: 'article',
  id: apiDocument.slug,
  title: apiDocument.title,
  input_message_content: {
    message_text: `<a href="${apiDocument.mdn_url}>${apiDocument.title}</a>`,
    parse_mode: 'HTML'
  }
})

export default async function handler (req: VercelRequest, res: VercelResponse) {
  if (req.query.token !== config.telegramToken) {
    return res.status(403).send('Invalid token')
  }

  try {
    const update: Update = req.body

    if (!update.inline_query) {
      return res.status(204).end()
    }

    const query = update.inline_query.query

    await axios
      .get<APIResult>(`https://developer.mozilla.org/api/v1/search?q=${query}`)
      .then((response) => response.data)
      .then((results) => results.documents.map(makeInlineResult))
      .then((results) =>
        res.status(200).json({
          method: 'answerInlineQuery',
          inline_query_id: update.inline_query.id,
          results
        })
      )
  } catch (err) {
    console.error(err)
    res.status(204).end()
  }
}
