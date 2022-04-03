import { PureComponent } from 'react'
import { Form, Button, Image, Icon, Message, Container } from 'semantic-ui-react'
import { History, Location } from 'history'
import Auth from '../auth/Auth'
import { getImageUploadUrl, uploadFile } from '../api/superheroes-api'

enum UploadState {
  NoUpload,
  FetchingPresignedUrl,
  UploadingFile,
  UploadedSuccessfully,
  UploadFailed
}

interface EditSuperheroImageLocationState {
  imageUrl: string
  superheroState: unknown
}

interface EditSuperheroImageProps {
  match: {
    params: {
      superheroId: string
    }
  }
  history: History
  location: Location
  auth: Auth
}

interface EditSuperheroImageState {
  file: any
  uploadState: UploadState
}

export class EditSuperheroImage extends PureComponent<EditSuperheroImageProps, EditSuperheroImageState> {

  messageTimeouts: NodeJS.Timeout[] = [];

  state: EditSuperheroImageState = {
    file: undefined,
    uploadState: UploadState.NoUpload
  }

  componentWillUnmount() {
    this.messageTimeouts.forEach(messageTimeout => clearTimeout(messageTimeout))
  }

  handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files

    if (!files) return

    this.setState({
      file: files[0]
    })
  }

  handleSubmit = async (event: React.SyntheticEvent) => {
    event.preventDefault()

    try {
      if (!this.state.file) {
        return
      }

      this.setUploadState(UploadState.FetchingPresignedUrl)
      const imageUploadUrl = await getImageUploadUrl(this.props.auth.getIdToken(), this.props.match.params.superheroId)

      this.setUploadState(UploadState.UploadingFile)

      await uploadFile(imageUploadUrl, this.state.file)

      this.setUploadState(UploadState.UploadedSuccessfully)

      this.messageTimeouts.push(setTimeout(this.goToHome, 2000))
    } catch {
      this.setUploadState(UploadState.UploadFailed)

      this.messageTimeouts.push(setTimeout(
        () => this.setUploadState(UploadState.NoUpload),
        3000))
    }
  }

  goToHome = () => {
    this.props.history.push({
      pathname: `/`,
      state: { superheroState: this.getSuperheroState() }
    })
  }

  setUploadState(uploadState: UploadState) {
    this.setState({ uploadState })
  }

  getOldImageUrl() {
    return (this.props.location.state as EditSuperheroImageLocationState).imageUrl
  }

  getSuperheroState() {
    return (this.props.location.state as EditSuperheroImageLocationState).superheroState
  }

  render() {
    return (
      <div>
        <h1>
          Superhero {this.props.match.params.superheroId}
        </h1>

        {this.renderImage()}

        <h3 style={{marginTop: '1em'}}>{`Upload${this.getOldImageUrl() ? ' New' : ''} Image`}</h3>

        <Form onSubmit={this.handleSubmit}>
          <Form.Field>
            <label>File</label>
            <input
              type='file'
              accept='image/*'
              placeholder='Image to upload'
              onChange={this.handleFileChange}
            />
          </Form.Field>

          {this.renderButtons()}
        </Form>
      </div>
    )
  }

  renderImage() {
    const oldImageUrl = this.getOldImageUrl()

    if (oldImageUrl) {
      return (
        <Image src={oldImageUrl} size='small' wrapped />
      )
    }
  }

  renderButtons() {
    return (
      <Container>
        {this.renderUploadStatusMessages(this.state.uploadState)}
        {this.getSuperheroState() &&
          <Button animated disabled={this.state.uploadState !== UploadState.NoUpload} onClick={this.goToHome}>
            <Button.Content hidden>Back</Button.Content>
            <Button.Content visible>
              <Icon name='arrow left' />
            </Button.Content>
          </Button>
        }
        <Button 
          primary 
          animated='fade' 
          disabled={this.state.uploadState !== UploadState.NoUpload || !this.state.file} 
          type='submit'>
          <Button.Content hidden>Upload</Button.Content>
          <Button.Content visible>
            <Icon name='cloud upload' />
          </Button.Content>
        </Button>
      </Container>
    )
  }

  renderUploadStatusMessages(uploadState: UploadState) {
    switch (uploadState) {
      case UploadState.FetchingPresignedUrl:
      case UploadState.UploadingFile:
        return (
          <Message icon>
            <Icon name='circle notched' loading />
            <Message.Content>
              <Message.Header>Just one second</Message.Header>
              <p>{`Uploading ${this.state.uploadState === UploadState.FetchingPresignedUrl ? 'image metadata' : 'file'}`}</p>
            </Message.Content>
          </Message>
        )
      case UploadState.UploadedSuccessfully:
        return (
          <Message positive>
            <Message.Header>File uploaded!</Message.Header>
          </Message>
        )
      case UploadState.UploadFailed:
        return (
          <Message negative>
            <Message.Header>File upload failed!</Message.Header>
          </Message>
        )
    }
  }
}
