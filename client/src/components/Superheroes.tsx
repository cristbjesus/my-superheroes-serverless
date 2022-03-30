import { History, Location } from 'history'
import update from 'immutability-helper'
import { PureComponent } from 'react'
import { Button, Divider, Grid, Header, Icon, Input, Image, Loader, Label, Form, TextArea, Container } from 'semantic-ui-react'
import { registerSuperhero, deleteSuperhero, getSuperheroes, patchSuperhero } from '../api/superheroes-api'
import Auth from '../auth/Auth'
import { Superhero } from '../types/Superhero'

interface SuperheroesProps {
  auth: Auth
  history: History,
  location: Location
}

interface SuperheroState {
  superheroId: string | undefined
  name: string
  backstory: string
  superpowers: string[]
}

interface SuperheroesState {
  superheroes: Superhero[]
  superpowerName: string
  superheroState: SuperheroState
  loadingSuperheroes: boolean
  editingSuperheroPos: number
}

interface SuperheroesLocationState {
  superheroState: SuperheroState
}

export class Superheroes extends PureComponent<SuperheroesProps, SuperheroesState> {
  state: SuperheroesState = {
    superpowerName: '',
    superheroes: [],
    superheroState: {
      superheroId: undefined,
      name: '',
      backstory: '',
      superpowers: []
    },
    loadingSuperheroes: true,
    editingSuperheroPos: -1
  }

  handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ superheroState: update(this.state.superheroState, { name: { $set: event.target.value } })})
  }

  handleSuperpowerNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ superpowerName: event.target.value })
  }

  handleBackstoryChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    this.setState({ superheroState: update(this.state.superheroState, { backstory: { $set: event.target.value } })})
  }

  onEdit = (pos: number) => {
    const superhero = this.state.superheroes[pos]
    this.setState({
      superpowerName: '',
      superheroState: update(this.state.superheroState, {
        superheroId: { $set: superhero.superheroId },
        name: { $set: superhero.name },
        backstory: { $set: superhero.backstory },
        superpowers: { $set: superhero.superpowers }
      }),
      editingSuperheroPos: pos
    })
  }

  onAddSuperpower = () => {
    const superheroState = this.state.superheroState
    this.setState({
      superpowerName: '',
      superheroState: update(superheroState, {
        superpowers: { $set: [...superheroState.superpowers, this.state.superpowerName] }
      })
    })
  }

  onDeleteSuperpower = async (superpower: string) => {
    const superheroState = this.state.superheroState
    this.setState({
      superheroState: update(superheroState, {
        superpowers: { $set: superheroState.superpowers.filter(item => item !== superpower) }
      })
    })
  }

  onSave = async () => {
    try {
      const superheroState = this.state.superheroState

      if (this.isEditing()) {
        const superhero = this.state.superheroes[this.state.editingSuperheroPos]
        await patchSuperhero(this.props.auth.getIdToken(), superhero.superheroId, {
          name: superheroState.name,
          backstory: superheroState.backstory,
          superpowers: superheroState.superpowers,
          public: superhero.public
        })
        this.setState({ 
          superpowerName: '',
          superheroes: update(this.state.superheroes, {
            [this.state.editingSuperheroPos]: {
              name: { $set: superheroState.name },
              backstory: { $set: superheroState.backstory },
              superpowers: { $set: superheroState.superpowers }
            }
          }),
          superheroState: update(superheroState, {
            superheroId: { $set: undefined },
            name: { $set: '' },
            backstory: { $set: '' },
            superpowers: { $set: [] }
          }),
          editingSuperheroPos: -1
        })
      } else {
        const superhero = await registerSuperhero(this.props.auth.getIdToken(), {
          name: superheroState.name,
          backstory: superheroState.backstory,
          superpowers: superheroState.superpowers
        })
        this.setState({ 
          superpowerName: '',
          superheroes: [...this.state.superheroes, superhero],
          superheroState: update(superheroState, {
            superheroId: { $set: undefined },
            name: { $set: '' },
            backstory: { $set: '' },
            superpowers: { $set: [] }
          })
        })
      }
    } catch {
      alert('Superhero registration failed')
    }
  }

  onCancelEdit = () => {
    this.setState({ 
      superpowerName: '',
      superheroState: update(this.state.superheroState, {
        superheroId: { $set: undefined },
        name: { $set: '' },
        backstory: { $set: '' },
        superpowers: { $set: [] }
      }),
      editingSuperheroPos: -1
    })
  }

  onEditImage = () => {
    const superheroState = this.state.superheroState
    this.props.history.push({
      pathname: `/superheroes/${superheroState.superheroId}/image`,
      state: {
        imageUrl: this.state.superheroes[this.state.editingSuperheroPos].imageUrl,
        superheroState
      }
    })
  }

  onDeleteSuperhero = async (superheroId: string) => {
    try {
      await deleteSuperhero(this.props.auth.getIdToken(), superheroId)
      this.setState({
        superheroes: this.state.superheroes.filter(superhero => superhero.superheroId !== superheroId)
      })
    } catch {
      alert('Superhero deletion failed')
    }
  }

  onTogglePublic = async (pos: number) => {
    try {
      const superhero = this.state.superheroes[pos]
      const superheroPublic = !superhero.public
      await patchSuperhero(this.props.auth.getIdToken(), superhero.superheroId, {
        name: superhero.name,
        backstory: superhero.backstory,
        superpowers: superhero.superpowers,
        public: superheroPublic
      })
      this.setState({
        superheroes: update(this.state.superheroes, {
          [pos]: { public: { $set: superheroPublic } }
        })
      })
    } catch {
      alert('Superhero update failed')
    }
  }

  isEditing(): boolean {
    return this.state.editingSuperheroPos !== -1
  }

  isCurrentUser(userId: string): boolean {
    return this.props.auth.getUserId() === userId
  }

  async componentDidMount() {
    try {
      const superheroes = await getSuperheroes(this.props.auth.getIdToken())
      this.setState({
        superheroes,
        loadingSuperheroes: false
      })

      const superheroState = (this.props.location.state as SuperheroesLocationState)?.superheroState

      if (superheroState) {
        this.setState({
          superheroState: superheroState,
          editingSuperheroPos: superheroes.findIndex(superhero => superhero.superheroId === superheroState.superheroId)
        })
      }
    } catch (e) {
      alert(`Failed to fetch superheroes: ${e.message}`)
    }
  }

  render() {
    return (
      <div>
        <Header as='h1'>Superheroes</Header>

        {this.renderRegisterSuperheroNameInput()}

        {this.renderRegisterSuperpowerInput()}

        {this.renderRegisterSuperpowersList()}

        {this.renderRegisterBackstoryTextArea()}

        {this.renderFormButtons()}

        {this.renderSuperheroes()}
      </div>
    )
  }

  renderRegisterSuperheroNameInput() {
    return (
      <Grid.Row>
        <Grid.Column width={16}>
          <Input 
            icon='id badge outline'
            iconPosition='left' 
            placeholder='Name' 
            onChange={this.handleNameChange}
            value={this.state.superheroState.name}
            fluid/>
        </Grid.Column>
      </Grid.Row>
    )
  }

  renderRegisterSuperpowerInput() {
    return (
      <Grid.Row style={{marginTop: '1em'}}>
        <Grid.Column width={16}>
          <Input
            action={{
              color: 'teal',
              labelPosition: 'left',
              icon: 'bolt',
              content: 'Add Superpower',
              onClick: this.onAddSuperpower
            }}
            fluid
            placeholder='Supernatural Strength'
            onChange={this.handleSuperpowerNameChange}
            value={this.state.superpowerName}
          />
        </Grid.Column>
      </Grid.Row>
    )
  }

  renderRegisterSuperpowersList() {
    return (
      <Grid padded>
        <Grid.Row>
          <Grid.Column width={16}>
            {this.state.superheroState.superpowers.length === 0 ? 'Empty superpower list' : 
              this.state.superheroState.superpowers.map((superpower) => {
                return (
                  <Label as='a' key={superpower}>
                    {superpower}
                    <Icon name='delete' onClick={() => this.onDeleteSuperpower(superpower)} />
                  </Label>
                )
              })
            }
          </Grid.Column>
        </Grid.Row>
      </Grid>
    )
  }

  renderRegisterBackstoryTextArea() {
    return (
      <Grid.Row style={{marginTop: '1em'}}>
        <Grid.Column width={16}>
          <Form>
            <TextArea
              rows={3}
              placeholder='A history or background for your superhero'
              onChange={this.handleBackstoryChange}
              value={this.state.superheroState.backstory} />
          </Form>
        </Grid.Column>
      </Grid.Row>
    )
  }

  renderFormButtons() {
    return (
      <Grid.Row style={{marginTop: '1em'}}>
        <Grid.Column width={16}>
          <Container textAlign="right">
            <Button primary onClick={this.onSave}>
              <Icon name='react' /> {this.isEditing() ? 'Update' : 'Register'}
            </Button>

            {this.isEditing() &&
              <Button onClick={this.onCancelEdit}>
                Cancel
              </Button>
            }

            {this.isEditing() &&
              <Button basic icon='file image outline' onClick={this.onEditImage} />
            }
          </Container>
          
        </Grid.Column>
        <Grid.Column width={16}>
          <Divider/>
        </Grid.Column>
      </Grid.Row>
    )
  }

  renderSuperheroes() {
    if (this.state.loadingSuperheroes) {
      return this.renderLoading()
    }

    return this.renderSuperheroesList()
  }

  renderLoading() {
    return (
      <Grid.Row>
        <Loader indeterminate active inline='centered'>
          Loading Superheroes
        </Loader>
      </Grid.Row>
    )
  }

  renderSuperheroesList() {
    return (
      <Grid padded>
        {this.state.superheroes.map((superhero, pos) => {
          return (
            <Grid.Row key={superhero.superheroId}>
              <Grid.Column width={this.isCurrentUser(superhero.userId) ? 12 : 16}>
                <h3>{superhero.name}</h3>
              </Grid.Column>
              {this.isCurrentUser(superhero.userId) &&
                <Grid.Column width={4} textAlign='right'>
                  <Button
                    color='grey'
                    icon={`eye${superhero.public ? '' : ' slash'}`}
                    onClick={() => this.onTogglePublic(pos)}
                    disabled={this.state.editingSuperheroPos === pos}
                    />
                  <Button
                    icon='pencil'
                    color='blue'
                    onClick={() => this.onEdit(pos)}
                    disabled={this.state.editingSuperheroPos === pos}
                    />
                  <Button
                    icon='delete'
                    color='red'
                    onClick={() => this.onDeleteSuperhero(superhero.superheroId)}
                    disabled={this.state.editingSuperheroPos === pos}
                    />
                </Grid.Column>
              }
              {superhero.superpowers.length > 0 &&
                <Grid.Column width={16}>
                  <strong>Superpowers:</strong> {superhero.superpowers.map((superpower, pos) => { return `${pos > 0 ? ' | ': ''}${superpower}` })}
                </Grid.Column>
              }
              {superhero.backstory &&
                <Grid.Column width={16}>
                  <strong>Backstory:</strong> {superhero.backstory}
                </Grid.Column>
              }
              {!this.isCurrentUser(superhero.userId) &&
                <Grid.Column width={16} style={{marginTop: '1em'}}>
                  <em>* Registered by: {superhero.userId}</em>
                </Grid.Column>
              }
              <Grid.Column width={16}>
                {superhero.imageUrl &&
                  <Image src={`${superhero.imageUrl}?${Date.now()}`} size='small' wrapped style={{marginTop: '1em'}} />
                }
              </Grid.Column>
              <Grid.Column width={16}>
                <Divider />
              </Grid.Column>
            </Grid.Row>
          )
        })}
      </Grid>
    )
  }
}
