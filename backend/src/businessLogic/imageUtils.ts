import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'

const XAWS = AWSXRay.captureAWS(AWS)

export class ImageUtils {
  constructor(
    private readonly s3 = new XAWS.S3({ signatureVersion: 'v4' })
  ) { }

  createImagePresignedUrl(superheroId: string): string {
    return this.s3.getSignedUrl('putObject', {
      Bucket: process.env.IMAGES_S3_BUCKET,
      Key: superheroId,
      Expires: +process.env.SIGNED_URL_EXPIRATION
    })
  }

  deleteImage(superheroId: string): void {
    this.s3.deleteObject({
      Bucket: process.env.IMAGES_S3_BUCKET,
      Key: superheroId
    })
  }
}
