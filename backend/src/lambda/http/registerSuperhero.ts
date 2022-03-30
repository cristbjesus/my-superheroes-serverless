import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import { RegisterSuperheroRequest } from '../../requests/RegisterSuperheroRequest'
import { getUserId } from '../utils';
import { registerSuperhero } from '../../businessLogic/superheroes'

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const registerSuperheroRequest: RegisterSuperheroRequest = JSON.parse(event.body)
    const userId = getUserId(event)

    const superhero = await registerSuperhero(registerSuperheroRequest, userId)
  
    return {
      statusCode: 201,
      body: JSON.stringify({ superhero })
    }
  }
)

handler.use(
  cors({
    credentials: true
  })
)
