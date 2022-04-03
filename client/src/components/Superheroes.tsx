import { History, Location } from 'history'
import update from 'immutability-helper'
import { PureComponent } from 'react'
import { 
  Button, 
  Divider, 
  Grid, 
  Header, 
  Icon, 
  Input, 
  Image, 
  Loader, 
  Label, 
  Form, 
  TextArea, 
  Container, 
  Confirm,
  Popup,
  Message
} from 'semantic-ui-react'
import { registerSuperhero, deleteSuperhero, getSuperheroes, patchSuperhero } from '../api/superheroes-api'
import Auth from '../auth/Auth'
import { Superhero } from '../types/Superhero'

const { v4: uuidv4 } = require('uuid');

enum SuperheroesMessageType {
  Error,
  Warning,
  Success,
}

interface SuperheroesMessage {
  id: string
  content: string
  type: SuperheroesMessageType
}

interface SuperheroesProps {
  auth: Auth
  history: History
  location: Location
}

interface SuperheroState {
  superheroId?: string
  name: string
  backstory: string
  superpowers: string[]
}

interface SuperheroesState {
  superheroes: Superhero[]
  superpowerName: string
  superheroState: SuperheroState
  loadingSuperheroes: boolean
  messages: SuperheroesMessage[],
  deletingSuperheroPos: number
}

interface SuperheroesLocationState {
  superheroState: SuperheroState
}

export class Superheroes extends PureComponent<SuperheroesProps, SuperheroesState> {

  editingSuperheroPos = -1;
  messagesTimeouts: NodeJS.Timeout[] = [];
  duplicatedSuperpowerMessageId?: string;

  state: SuperheroesState = {
    superpowerName: '',
    superheroes: [],
    superheroState: {
      name: '',
      backstory: '',
      superpowers: []
    },
    loadingSuperheroes: true,
    messages: [],
    deletingSuperheroPos: -1
  }

  async componentDidMount() {
    try {
      const superheroes = await getSuperheroes(this.props.auth.getIdToken())

      this.setState({ superheroes, loadingSuperheroes: false })

      const superheroState = (this.props.location.state as SuperheroesLocationState)?.superheroState

      if (superheroState) {
        this.editingSuperheroPos = superheroes.findIndex(superhero => superhero.superheroId === superheroState.superheroId)

        this.setState({ superheroState: superheroState })

        this.showMessage('Editing superhero!', SuperheroesMessageType.Warning, 2000)
      }
    } catch {
      this.showMessage('Failed to fetch superheroes!')
    }
  }

  componentWillUnmount() {
    this.messagesTimeouts.forEach(messageTimeout => clearTimeout(messageTimeout))
  }

  handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ superheroState: update(this.state.superheroState, { name: { $set: event.target.value } })})
  }

  handleSuperpowerNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const superpowerName = event.target.value

    if (this.state.superheroState.superpowers.indexOf(superpowerName) !== -1) {
      this.duplicatedSuperpowerMessageId = this.showMessage('Superpower has already been added!', SuperheroesMessageType.Warning, -1)
    } else {
      this.hideDuplicatedSuperpowerMessage()
    }

    this.setState({ superpowerName })
  }

  onAddSuperpower = () => {
    const superpowerName = this.state.superpowerName
    const superheroState = this.state.superheroState
    const superpowers = superheroState.superpowers

    this.setState({ superpowerName: '' })

    if (superpowers.indexOf(superpowerName) !== -1) {
      this.hideDuplicatedSuperpowerMessage()
      return
    }

    this.setState({ superheroState: update(superheroState, { superpowers: { $set: [ ...superpowers, superpowerName ] } }) })
  }

  onDeleteSuperpower = async (pos: number) => {
    const superpowers = [...this.state.superheroState.superpowers]
    const deletedSuperpower = superpowers.splice(pos, 1)[0]

    if (this.state.superpowerName === deletedSuperpower) {
      this.hideDuplicatedSuperpowerMessage()
    }

    this.setState({ superheroState: update(this.state.superheroState, { superpowers: { $set: superpowers } }) })
  }

  handleBackstoryChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    this.setState({ superheroState: update(this.state.superheroState, { backstory: { $set: event.target.value } })})
  }

  onSave = async () => {
    try {
      const superheroState = this.state.superheroState
      const superheroName = superheroState.name
      const superheroBackstory = superheroState.backstory
      const superheroSuperpowers = superheroState.superpowers
      const superheroes = this.state.superheroes
      const idToken = this.props.auth.getIdToken()

      let successMessage: string;

      if (this.isEditing()) {
        const pos = this.editingSuperheroPos
        const superhero = superheroes[pos]

        await patchSuperhero(idToken, superhero.superheroId, {
          name: superheroName,
          backstory: superheroBackstory,
          superpowers: superheroSuperpowers,
          public: superhero.public
        })

        this.setState({ 
          superheroes: (update(superheroes, {
            [pos]: {
              name: { $set: superheroName },
              backstory: { $set: superheroBackstory },
              superpowers: { $set: superheroSuperpowers }
            }
          }))
        })

        successMessage = 'Superhero updated!'
      } else {
        const superhero = await registerSuperhero(idToken, {
          name: superheroName,
          backstory: superheroBackstory,
          superpowers: superheroSuperpowers
        })

        this.setState({ superheroes: [...superheroes, superhero] })

        successMessage = 'Superhero registered!'
      }

      this.clearSuperhero()

      this.showMessage(successMessage, SuperheroesMessageType.Success, 2000)
    } catch {
      this.showMessage('Superhero registration failed!')
    }
  }

  onCancelEdit = () => {
    this.clearSuperhero()
  }

  onEditImage = () => {
    const superheroState = this.state.superheroState

    this.props.history.push({
      pathname: `/superheroes/${superheroState.superheroId}/image`,
      state: {
        imageUrl: this.state.superheroes[this.editingSuperheroPos].imageUrl,
        superheroState
      }
    })
  }

  showMessage = (content: string, type = SuperheroesMessageType.Error, timeout = 3000): string => {
    const id = uuidv4()
    const message: SuperheroesMessage = { id, content, type };
    this.setState({ messages: [ ...this.state.messages, message ] })

    if (timeout !== -1) {
      this.messagesTimeouts.push(setTimeout(
        () => this.hideMessage(id),
        3000))
    }

    return id
  }

  hideMessage = (id: string) => {
    this.setState({ messages: this.state.messages.filter(message => message.id !== id) })
  }

  hideDuplicatedSuperpowerMessage = () => {
    this.hideMessage(this.duplicatedSuperpowerMessageId as string)
    this.duplicatedSuperpowerMessageId = undefined
  }

  onTogglePublic = async (pos: number) => {
    try {
      const superhero = this.state.superheroes[pos]
      const newSuperheroPublic = !superhero.public

      await patchSuperhero(this.props.auth.getIdToken(), superhero.superheroId, {
        name: superhero.name,
        backstory: superhero.backstory,
        superpowers: superhero.superpowers,
        public: newSuperheroPublic
      })

      this.setState({ superheroes: update(this.state.superheroes, { [pos]: { public: { $set: newSuperheroPublic } } }) })
    } catch {
      this.showMessage('Superhero update failed!')
    }
  }

  onEdit = (pos: number) => {
    const newSuperheroState: SuperheroState = { ...this.state.superheroes[pos] }

    this.hideDuplicatedSuperpowerMessage()
    this.updateSuperheroState(newSuperheroState, pos)
  }

  onDelete = async () => {
    try {
      const pos = this.state.deletingSuperheroPos
      const superheroes = this.state.superheroes

      await deleteSuperhero(this.props.auth.getIdToken(), superheroes[pos].superheroId)

      const newSuperheroes = [...superheroes]
      newSuperheroes.splice(pos, 1)

      this.setState({ superheroes: newSuperheroes, deletingSuperheroPos: -1 })

      this.showMessage('Superhero deleted!', SuperheroesMessageType.Success, 2000)
    } catch {
      this.showMessage('Superhero deletion failed!')
    }
  }

  closeDeleteConfirmModal = () => {
    this.setState({ deletingSuperheroPos: -1 })
  }

  openDeleteConfirmModal = (pos: number) => {
    this.setState({ deletingSuperheroPos: pos })
  }

  clearSuperhero = () => {
    const newSuperheroState: SuperheroState = { name: '', backstory: '', superpowers: [] }

    this.hideDuplicatedSuperpowerMessage()
    this.updateSuperheroState(newSuperheroState)
  }

  updateSuperheroState = (superheroState: SuperheroState, editingSuperheroPos = -1) => {
    this.setState({
      superpowerName: '',
      superheroState: update(this.state.superheroState, {
        superheroId: { $set: superheroState.superheroId },
        name: { $set: superheroState.name },
        backstory: { $set: superheroState.backstory },
        superpowers: { $set: superheroState.superpowers }
      })
    })

    this.editingSuperheroPos = editingSuperheroPos
  }

  isCurrentUser = (userId: string): boolean => {
    return this.props.auth.getUserId() === userId
  }

  isEditing = (): boolean => {
    return this.editingSuperheroPos !== -1
  }

  render() {
    return (
      <div>
        <Header as='h1'>Superheroes</Header>

        {this.renderNameInput()}
        {this.renderSuperpowerInput()}
        {this.renderSuperpowersList()}
        {this.renderBackstoryTextArea()}
        {this.renderFormButtons()}
        {this.renderMessages()}
        {this.renderSuperheroes()}
        {this.renderDeleteConfirmModal()}
      </div>
    )
  }

  renderNameInput() {
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

  renderSuperpowerInput() {
    return (
      <Grid.Row style={{marginTop: '1em'}}>
        <Grid.Column width={16}>
          <Input
            action={{
              color: 'teal',
              labelPosition: 'left',
              icon: 'bolt',
              content: 'Add Superpower',
              disabled: !this.state.superpowerName,
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

  renderSuperpowersList() {
    return (
      <Grid padded>
        <Grid.Row>
          <Grid.Column width={16}>
            {this.state.superheroState.superpowers.length === 0 ? 'Empty Superpower List' : 
              this.state.superheroState.superpowers.map((superpower, pos) => {
                return (
                  <Label as='a' key={superpower}>
                    {superpower}
                    <Icon name='delete' onClick={() => this.onDeleteSuperpower(pos)} />
                  </Label>
                )
              })
            }
          </Grid.Column>
        </Grid.Row>
      </Grid>
    )
  }

  renderBackstoryTextArea() {
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
              <Popup 
                content='Edit Superhero Image' 
                trigger={<Button basic icon='file image outline' onClick={this.onEditImage} />}
                />
            }
          </Container>
        </Grid.Column>

        <Grid.Column width={16}>
          <Divider/>
        </Grid.Column>
      </Grid.Row>
    )
  }

  renderMessages() {
    return (
      <Container style={{marginTop: '1em'}}>
        {this.state.messages.length === 0 ? '' : this.state.messages.map((message) => {
          return (
            <Message
              key={message.id}
              error={message.type === SuperheroesMessageType.Error}
              warning={message.type === SuperheroesMessageType.Warning}
              success={message.type === SuperheroesMessageType.Success}>
              <Message.Header>{message.content}</Message.Header>
            </Message>
          )
        })}
      </Container>
    )
  }

  renderSuperheroes() {
    return this.state.loadingSuperheroes ? this.renderLoading() : this.renderSuperheroesList()
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
                  <Popup 
                    content={`Make the Superhero ${superhero.public ? 'Private' : 'Public'}`} 
                    trigger={
                      <Button
                        color='grey'
                        icon={`eye${superhero.public ? '' : ' slash'}`}
                        onClick={() => this.onTogglePublic(pos)}
                        disabled={this.editingSuperheroPos === pos} />
                    } />

                  <Popup 
                    content='Edit Superhero' 
                    trigger={
                      <Button
                        icon='pencil'
                        color='blue'
                        onClick={() => this.onEdit(pos)}
                        disabled={this.editingSuperheroPos === pos} />
                    } />
                    
                  <Popup 
                    content='Delete Superhero' 
                    trigger={
                      <Button
                        icon='delete'
                        color='red'
                        onClick={() => this.openDeleteConfirmModal(pos)}
                        disabled={this.editingSuperheroPos === pos} />
                    } />
                </Grid.Column>
              }

              {superhero.superpowers.length > 0 &&
                <Grid.Column width={16} style={{marginTop: '1em'}}>
                  <strong>Superpowers:</strong> {superhero.superpowers.map((superpower, pos) => { return `${pos > 0 ? ' | ': ''}${superpower}` })}
                </Grid.Column>
              }

              {superhero.backstory &&
                <Grid.Column width={16} style={{marginTop: '1em'}}>
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

  renderDeleteConfirmModal() {
    return (
      <Confirm
        open={this.state.deletingSuperheroPos !== -1}
        content='Are you sure you want to delete this item?'
        onCancel={this.closeDeleteConfirmModal}
        onConfirm={this.onDelete}
        confirmButton={{ primary: false, content: 'OK', color: 'red' }}
        />
    )
  }
}
