# Serverless My Superheroes

My Superheroes application helps you register your own custom superheroes and view the ones that other people have registered. This application uses AWS Lambda and Serverless framework.

# Superhero fields

The application store superheroes data, and each superhero record contains the following fields:

* `userId` (string) - user who registered a superhero
* `superheroId` (string) - a unique id for a superhero
* `createdAt` (string) - date and time when a superhero was registered
* `name` (string) - name of a superhero
* `backstory` (string) - a history or background for a superhero
* `superpowers` (string) - A list of superpowers for a superhero (e.g. "Self-Duplication, Teleportation, Levitation")
* `public` (boolean) - 'Y' if a superhero is visible to all users, 'N' otherwise
* `imageUrl` (string) (optional) - a URL pointing to a superhero's image

# Functions

Implemented and configured functions in the `serverless.yml` file:

* `Auth` - this function implements a custom authorizer for API Gateway.

* `GetSuperheroes` - returns all public or current user superheroes.

It returns data that looks like this:

```json
{
  "superheroes": [
    {
      "userId": "1",
      "superheroId": "123",
      "createdAt": "2022-01-01T10:00:00.000Z",
      "name": "Constellation",
      "backstory": "During a time travel he...",
      "superpowers": ["Self-Duplication", "Levitation"],
      "public": false
    },
    {
      "userId": "2",
      "superheroId": "456",
      "createdAt": "2022-01-01T11:00:00.000Z",
      "name": "Snow Storm",
      "backstory": "A long time ago...",
      "superpowers": ["Mind Reading", "Immortality"],
      "public": true,
      "imageUrl": "http://example.com/image.png"
    }
  ]
}
```

* `registerSuperhero` - registers a new superhero for a current user.

It receives a new superhero to be registered in JSON format that looks like this:

```json
{
  "name": "Constellation",
  "backstory": "During a time travel he...",
  "superpowers": ["Self-Duplication", "Levitation"]
}
```

It returns a new hero that looks like this:

```json
{
  "superhero": {
    "userId": "1",
    "superheroId": "123",
    "createdAt": "2022-01-01T10:00:00.000Z",
    "name": "Constellation",
    "backstory": "During a time travel he...",
    "superpowers": ["Self-Duplication", "Levitation"],
    "public": false
  }
}
```

* `UpdateSuperhero` - updates a superhero registered by a current user.

It receives an object that contains four fields that can be updated in a superhero:

```json
{
  "name": "Dark Constellation",
  "backstory": "During a time travel she...",
  "superpowers": ["Illusion Manipulation", "Gravity Control"],
  "public": true
}
```

The id of an superhero that should be updated is passed as a URL parameter.

It returns an empty body.

* `DeleteSuperhero` - deletes a superhero registered by a current user. Expects an id of a superhero to remove.

It returns an empty body.

* `GenerateImgUploadUrl` - returns a pre-signed URL that can be used to upload an image file for a superhero.

It returns a JSON object that looks like this:

```json
{
  "imageUploadUrl": "https://s3-bucket-name.s3.eu-west-2.amazonaws.com/image.png"
}
```

All functions are connected to appropriate events from API Gateway.

# Frontend

The `client` folder contains a web application that uses the API developed in the project.

This frontend works with the serverless application that is developed.

## Authentication

The authentication implemented in this application uses an Auth0 application with asymmetrically encrypted JWT tokens.

## Logging

This project uses [Winston](https://github.com/winstonjs/winston) logger that creates [JSON formatted](https://stackify.com/what-is-structured-logging-and-why-developers-need-it/) log statements.

# How to run the application

## Backend

To deploy an application run the following commands:

```
cd backend
npm install
sls deploy -v
```

## Frontend

To run a client application first edit the `client/src/config.ts` file to set correct parameters. And then run the following commands:

```
cd client
npm install
npm run start
```

This should start a development server with the React application that will interact with the serverless My Superheroes application.

# Postman collection

To test the API you can use the Postman collection that contains sample requests.
