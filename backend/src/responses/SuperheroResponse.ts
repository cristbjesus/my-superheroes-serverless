export interface SuperheroResponse {
  userId: string
  superheroId: string
  createdAt: string
  name: string
  backstory: string
  superpowers: string[]
  public: boolean
  imageUrl?: string
}