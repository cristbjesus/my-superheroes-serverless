import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'

import { updateSuperhero } from '../../businessLogic/superheroes'
import { UpdateSuperheroRequest } from '../../requests/UpdateSuperheroRequest'
import { getUserId } from '../utils'

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const superheroId = event.pathParameters.superheroId
    const updateSuperheroRequest: UpdateSuperheroRequest = JSON.parse(event.body)
    const userId = getUserId(event)
    const result = await updateSuperhero(userId, superheroId, updateSuperheroRequest)
  
    if (result instanceof Error) {
      return {
        statusCode: result.statusCode,
        body: JSON.stringify({ error: result.message })
      }
    }

    return {
      statusCode: 204,
      body: ''
    }
  }
)

handler
  .use(httpErrorHandler())
  .use(
    cors({
      credentials: true
    })
  )
