import { SuperheroesAccess } from './superheroesAccess'
import { ImageUtils } from './imageUtils';
import { Superhero } from '../models/Superhero'
import { RegisterSuperheroRequest } from '../requests/RegisterSuperheroRequest'
import { UpdateSuperheroRequest } from '../requests/UpdateSuperheroRequest'
import { SuperheroResponse } from '../responses/SuperheroResponse';
import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'
import * as createError from 'http-errors'

const logger = createLogger('Superheroes')
const superheroesAccess = new SuperheroesAccess()
const imageUtils = new ImageUtils()

export async function getSuperheroesForUser(userId: string): Promise<SuperheroResponse[]> {
  const superheroes = await superheroesAccess.getSuperheroesForUser(userId)
  return superheroes.map(superhero => buildSuperheroResponse(superhero))
}

export async function registerSuperhero(
  registerSuperheroRequest: RegisterSuperheroRequest,
  userId: string
): Promise<SuperheroResponse> {
  logger.info('Create superhero request: ', registerSuperheroRequest)

  const superheroId = uuid.v4()

  const superhero = await superheroesAccess.createSuperhero({
    userId,
    superheroId,
    createdAt: new Date().toISOString(),
    name: registerSuperheroRequest.name,
    backstory: registerSuperheroRequest.backstory,
    superpowers: registerSuperheroRequest.superpowers,
    public: 'N'
  })

  return buildSuperheroResponse(superhero)
}

export async function updateSuperhero(
  userId: string,
  superheroId: string,
  updateSuperheroRequest: UpdateSuperheroRequest
): Promise<void | createError.HttpError> {
  logger.info('Update superhero request: ', updateSuperheroRequest)

  const superhero = await superheroesAccess.getSuperheroForUser(userId, superheroId)

  if (!superhero) {
    logger.error('Superhero not found for current user')
    return createError(404, 'This superhero does not exist or was not registered by the current user!')
  }

  return await superheroesAccess.updateSuperhero(
    userId, 
    superheroId, 
    {
      name: updateSuperheroRequest.name,
      backstory: updateSuperheroRequest.backstory,
      superpowers: updateSuperheroRequest.superpowers,
      public: updateSuperheroRequest.public ? 'Y' : 'N'
    })
}

export async function deleteSuperhero(
  userId: string,
  superheroId: string
): Promise<void | createError.HttpError> {
  logger.info('Delete superhero request: ', { userId, superheroId })

  const superhero = await superheroesAccess.getSuperheroForUser(userId, superheroId)

  if (!superhero) {
    logger.error('Superhero not found for current user')
    return createError(404, 'This superhero does not exist or was not registered by the current user!')
  }

  imageUtils.deleteImage(superheroId)

  return await superheroesAccess.deleteSuperhero(userId, superheroId)
}

export async function createImagePresignedUrl(
  userId: string,
  superheroId: string
): Promise<string | createError.HttpError> {
  logger.info('Create image presigned url request: ', { userId, superheroId })

  const superhero = await superheroesAccess.getSuperheroForUser(userId, superheroId)

  if (!superhero) {
    logger.error('Superhero not found for current user')
    return createError(404, 'This superhero does not exist or was not registered by the current user!')
  }

  const imageUploadUrl = imageUtils.createImagePresignedUrl(superheroId)

  await superheroesAccess.updateSuperheroImageUrl(userId, superheroId, imageUploadUrl)

  return imageUploadUrl
}

function buildSuperheroResponse(superhero: Superhero): SuperheroResponse {
  return {
    userId: superhero.userId,
    superheroId: superhero.superheroId,
    createdAt: superhero.createdAt,
    name: superhero.name,
    backstory: superhero.backstory,
    superpowers: superhero.superpowers,
    public: superhero.public === 'Y',
    imageUrl: superhero.imageUrl
  }
}
