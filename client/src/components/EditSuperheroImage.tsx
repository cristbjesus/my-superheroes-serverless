import { PureComponent } from 'react'
import { Form, Button, Image, Icon } from 'semantic-ui-react'
import { History, Location } from 'history'
import Auth from '../auth/Auth'
import { getImageUploadUrl, uploadFile } from '../api/superheroes-api'

enum UploadState {
  NoUpload,
  FetchingPresignedUrl,
  UploadingFile,
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

export class EditSuperheroImage extends PureComponent<
  EditSuperheroImageProps,
  EditSuperheroImageState
> {
  state: EditSuperheroImageState = {
    file: undefined,
    uploadState: UploadState.NoUpload
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
        alert('File should be selected')
        return
      }

      this.setUploadState(UploadState.FetchingPresignedUrl)
      const imageUploadUrl = await getImageUploadUrl(this.props.auth.getIdToken(), this.props.match.params.superheroId)

      this.setUploadState(UploadState.UploadingFile)
      await uploadFile(imageUploadUrl, this.state.file)

      alert('File was uploaded!')
    } catch (e) {
      alert('Could not upload a file: ' + e.message)
    } finally {
      this.setUploadState(UploadState.NoUpload)
    }

    this.goToHome()
  }

  goToHome = () => {
    this.props.history.push({
      pathname: `/`,
      state: {
        superheroState: this.getSuperheroState()
      }
    })
  }

  setUploadState(uploadState: UploadState) {
    this.setState({
      uploadState
    })
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

        <h3 style={{marginTop: '1em'}}>{`Upload${this.getOldImageUrl() ? ' new' : ''} image`}</h3>

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
      <div>
        {this.state.uploadState === UploadState.FetchingPresignedUrl && <p>Uploading image metadata</p>}
        {this.state.uploadState === UploadState.UploadingFile && <p>Uploading file</p>}
        {this.getSuperheroState() &&
          <Button animated disabled={this.state.uploadState !== UploadState.NoUpload} onClick={this.goToHome}>
            <Button.Content hidden>Back</Button.Content>
            <Button.Content visible>
              <Icon name='arrow left' />
            </Button.Content>
          </Button>
        }
        <Button primary animated='fade' loading={this.state.uploadState !== UploadState.NoUpload} type='submit'>
          <Button.Content hidden>Upload</Button.Content>
          <Button.Content visible>
            <Icon name='cloud upload' />
          </Button.Content>
        </Button>
      </div>
    )
  }
}
