import * as AWS from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { Superhero } from '../models/Superhero'
import { UpdateSuperhero } from '../models/UpdateSuperhero';

const AWSXRay = require('aws-xray-sdk')
const XAWS = AWSXRay.captureAWS(AWS)
const logger = createLogger('SuperheroesAccess')

export class SuperheroesAccess {
  constructor(
    private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
    private readonly superheroesTable = process.env.SUPERHEROES_TABLE,
    private readonly superheroesPublicIndex = process.env.SUPERHEROES_PUBLIC_INDEX,
    private readonly superheroesUserIdPublicIndex = process.env.SUPERHEROES_USER_ID_PUBLIC_INDEX
  ) { }

  async getSuperheroesForUser(userId: string): Promise<Superhero[]> {
    logger.info('Getting all public or current user superheroes')

    const nonpublicSuperheroes = await this.docClient.query({
      TableName: this.superheroesTable,
      IndexName: this.superheroesUserIdPublicIndex,
      ExpressionAttributeNames: { '#pub': 'public' },
      KeyConditionExpression: 'userId = :userId AND #pub = :publicSuperhero',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':publicSuperhero': 'N'
      }
    }).promise()

    const publicSuperheroes = await this.docClient.query({
      TableName: this.superheroesTable,
      IndexName: this.superheroesPublicIndex,
      ExpressionAttributeNames: { '#pub': 'public' },
      KeyConditionExpression: '#pub = :publicSuperhero',
      ExpressionAttributeValues: {
        ':publicSuperhero': 'Y'
      }
    }).promise()

    const superheroes = nonpublicSuperheroes.Items.concat(publicSuperheroes.Items)
    return superheroes as Superhero[]
  }

  async createSuperhero(superhero: Superhero): Promise<Superhero> {
    logger.info('Registering superhero')

    await this.docClient.put({
      TableName: this.superheroesTable,
      Item: superhero
    }).promise()

    return superhero
  }

  async updateSuperhero(userId: string, superheroId: string, updateSuperhero: UpdateSuperhero): Promise<void> {
    logger.info('Updating a superhero for a current user')

    await this.docClient.update({
      TableName: this.superheroesTable,
      Key: { userId, superheroId },
      ExpressionAttributeNames: { '#nm': 'name', '#pub': 'public' },
      UpdateExpression: 'set #nm=:superheroName, backstory=:backstory, superpowers=:superpowers, #pub=:publicSuperhero',
      ExpressionAttributeValues: {
        ':superheroName': updateSuperhero.name,
        ':backstory': updateSuperhero.backstory,
        ':superpowers': updateSuperhero.superpowers,
        ':publicSuperhero': updateSuperhero.public
    },
      ReturnValues: 'UPDATED_NEW'
    }).promise()
  }

  async deleteSuperhero(userId: string, superheroId: string): Promise<void> {
    logger.info('Deleting a superhero for a current user')

    await this.docClient.delete({
      TableName: this.superheroesTable,
      Key: { userId, superheroId }
    }).promise()
  }

  async updateSuperheroImageUrl(userId: string, superheroId: string, imageUploadUrl: string): Promise<void> {
    logger.info('Updating a superhero image url for a current user')

    await this.docClient.update({
      TableName: this.superheroesTable,
      Key: { userId, superheroId },
      UpdateExpression: 'set imageUrl=:imageUrl',
      ExpressionAttributeValues: {
        ':imageUrl': imageUploadUrl.split('?')[0]
      },
      ReturnValues: 'UPDATED_NEW'
    }).promise()
  }

  async getSuperheroForUser(userId: string, superheroId: string): Promise<Superhero> {
    logger.info('Get a superhero for a current user')

    const result = await this.docClient.get({
      TableName: this.superheroesTable,
      Key: { userId, superheroId: superheroId }
    }).promise()

    return result.Item as Superhero
  }
}
