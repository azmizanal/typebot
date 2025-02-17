import { NextApiRequest, NextApiResponse } from 'next'
import { GoogleSpreadsheet } from 'google-spreadsheet'
import { getAuthenticatedGoogleClient } from 'libs/google-sheets'
import {
  badRequest,
  isDefined,
  methodNotAllowed,
  notAuthenticated,
} from 'utils'
import { withSentry, setUser } from '@sentry/nextjs'
import { getAuthenticatedUser } from 'services/api/utils'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const user = await getAuthenticatedUser(req)
  if (!user) return notAuthenticated(res)

  setUser({ email: user.email ?? undefined, id: user.id })
  if (req.method === 'GET') {
    const credentialsId = req.query.credentialsId as string | undefined
    if (!credentialsId) return badRequest(res)

    const spreadsheetId = req.query.id.toString()
    const doc = new GoogleSpreadsheet(spreadsheetId)
    const client = await getAuthenticatedGoogleClient(user.id, credentialsId)
    if (!client)
      return res
        .status(404)
        .send({ message: "Couldn't find credentials in database" })
    doc.useOAuth2Client(client)
    await doc.loadInfo()
    return res.send({
      sheets: (
        await Promise.all(
          Array.from(Array(doc.sheetCount)).map(async (_, idx) => {
            const sheet = doc.sheetsByIndex[idx]
            try {
              await sheet.loadHeaderRow()
            } catch (err) {
              return
            }
            return {
              id: sheet.sheetId,
              name: sheet.title,
              columns: sheet.headerValues,
            }
          })
        )
      ).filter(isDefined),
    })
  }
  return methodNotAllowed(res)
}

export default withSentry(handler)
