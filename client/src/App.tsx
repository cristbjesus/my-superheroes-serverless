import { Component } from 'react'
import { History, Location } from 'history'
import { Link, Route, Router, Switch } from 'react-router-dom'
import { Grid, Icon, Menu, Segment } from 'semantic-ui-react'
import Auth from './auth/Auth'
import { EditSuperheroImage } from './components/EditSuperheroImage'
import { LogIn } from './components/LogIn'
import { NotFound } from './components/NotFound'
import { Superheroes } from './components/Superheroes'

export interface AppProps {}

export interface AppProps {
  auth: Auth
  history: History
  location: Location
}

export interface AppState {}

export default class App extends Component<AppProps, AppState> {
  constructor(props: AppProps) {
    super(props)

    this.handleLogin = this.handleLogin.bind(this)
    this.handleLogout = this.handleLogout.bind(this)
  }

  handleLogin() {
    this.props.auth.login()
  }

  handleLogout() {
    this.props.auth.logout()
  }

  render() {
    return (
      <div>
        <Segment style={{ padding: '2em 0em' }} vertical>
          <Grid container stackable verticalAlign='middle'>
            <Grid.Row>
              <Grid.Column width={16}>
                <Router history={this.props.history}>
                  {this.generateMenu()}

                  {this.generateCurrentPage()}
                </Router>
              </Grid.Column>
            </Grid.Row>
          </Grid>
        </Segment>
      </div>
    )
  }

  generateMenu() {
    if (this.props.auth.isAuthenticated()) {
      return (
        <Menu secondary style={{marginBottom: '3em'}}>
          <Menu.Item
            name='home'
            active={this.props.location.pathname === '/'}
            >
            <Link to='/'>Home</Link>
          </Menu.Item>

          <Menu.Menu position='right'>
            <Menu.Item>
            <Icon name='user' /> {this.props.auth.getUserId()}
            </Menu.Item>
            <Menu.Item
              name='logout'
              onClick={this.handleLogout}
            />
          </Menu.Menu>
        </Menu>
      )
    }
  }

  generateCurrentPage() {
    if (!this.props.auth.isAuthenticated()) {
      return <LogIn auth={this.props.auth} />
    }

    return (
      <Switch>
        <Route
          path='/'
          exact
          render={props => {
            return <Superheroes {...props} auth={this.props.auth} />
          }}
        />

        <Route
          path='/superheroes/:superheroId/image'
          exact
          render={props => {
            return <EditSuperheroImage {...props} auth={this.props.auth} />
          }}
        />

        <Route component={NotFound} />
      </Switch>
    )
  }
}
