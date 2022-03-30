import { apiEndpoint } from '../config'
import { Superhero } from '../types/Superhero';
import { RegisterSuperheroRequest } from '../types/RegisterSuperheroRequest';
import Axios from 'axios'
import { UpdateSuperheroRequest } from '../types/UpdateSuperheroRequest';

export async function getSuperheroes(idToken: string): Promise<Superhero[]> {
  console.log('Fetching superheroes')

  const response = await Axios.get(`${apiEndpoint}/superheroes`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    },
  })
  console.log('Superheroes:', response.data)
  return response.data.superheroes
}

export async function registerSuperhero(
  idToken: string,
  registerSuperheroRequest: RegisterSuperheroRequest
): Promise<Superhero> {
  const response = await Axios.post(`${apiEndpoint}/superheroes`,  JSON.stringify(registerSuperheroRequest), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    }
  })
  return response.data.superhero
}

export async function patchSuperhero(
  idToken: string,
  superheroId: string,
  updateSuperheroRequest: UpdateSuperheroRequest
): Promise<void> {
  await Axios.patch(`${apiEndpoint}/superheroes/${superheroId}`, JSON.stringify(updateSuperheroRequest), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    }
  })
}

export async function deleteSuperhero(
  idToken: string,
  superheroId: string
): Promise<void> {
  await Axios.delete(`${apiEndpoint}/superheroes/${superheroId}`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    }
  })
}

export async function getImageUploadUrl(
  idToken: string,
  superheroId: string
): Promise<string> {
  const response = await Axios.post(`${apiEndpoint}/superheroes/${superheroId}/image`, '', {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    }
  })
  return response.data.imageUploadUrl
}

export async function uploadFile(uploadUrl: string, file: Buffer): Promise<void> {
  await Axios.put(uploadUrl, file)
}
