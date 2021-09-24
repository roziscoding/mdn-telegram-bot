import axios, { AxiosError, AxiosResponse } from 'axios'
import { APIResult, Document } from '../src/types/APIResult'
import { InlineQueryResultArticle, Update } from '@grammyjs/types'
import { VercelRequest, VercelResponse } from '@vercel/node'
import { config } from '../src/config'

const makeInlineResult = (apiDocument: Document): InlineQueryResultArticle => ({
  type: 'article',
  id: apiDocument.slug,
  title: apiDocument.title,
  description: apiDocument.summary.replace(/\n/gi, ''),
  input_message_content: {
    message_text: `<b>${apiDocument.title}</b>\n\n${apiDocument.summary.replace(
      /\n/gi,
      ''
    )}`,
    parse_mode: 'HTML'
  },
  reply_markup: {
    inline_keyboard: [
      [
        {
          text: 'View on MDN',
          url: `https://developer.mozilla.org${apiDocument.mdn_url}`
        }
      ]
    ]
  }
})

const isAxiosError = (
  err: any
): err is AxiosError & { response: AxiosResponse<any> } => {
  return Object.keys(err).includes('request')
}

const telegram = axios.create({
  baseURL: `https://api.telegram.org/bot${config.telegramToken}`
})

export default async function handler (req: VercelRequest, res: VercelResponse) {
  if (req.query.token !== config.telegramToken) {
    return res.status(403).send('Invalid token')
  }

  try {
    const update: Update = req.body
    const inlineQuery = update.inline_query

    if (!inlineQuery) {
      return res.status(204).end()
    }

    const query = inlineQuery.query

    console.log('Received update', JSON.stringify(update, null, 4))

    await axios
      .get<APIResult>(`https://developer.mozilla.org/api/v1/search?q=${query}`)
      .then((response) => response.data)
      .then((results) => results.documents.map(makeInlineResult))
      .then((results) => ({
        inline_query_id: inlineQuery.id,
        results
      }))
      .then((formattedResults) =>
        telegram.post('/answerInlineQuery', formattedResults)
      )
      .then(() => {
        res.status(204).end()
      })
  } catch (err) {
    if (isAxiosError(err)) {
      console.error(err.response.data)
    }

    if (!isAxiosError(err)) {
      console.error(err)
    }

    res.status(204).end()
  }
}
