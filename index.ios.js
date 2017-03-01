/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  Navigator,
  AppState
} from 'react-native';

import SendBird from 'sendbird'
/*  SCREENS  */
import Login from './src/screens/login'
import OpenChannel from './src/screens/openChannel';
import CreateChannel from './src/screens/createChannel';
import GroupChannel from './src/screens/groupChannel';
import Chat from './src/screens/chat';
import Invite from './src/screens/invite';
var SCREENS = {
  login: Login,
  openChannel: OpenChannel,
  createChannel: CreateChannel,
  groupChannel: GroupChannel,
  chat: Chat,
  inviteUser: Invite,
};

/*  CONFIGS  */
import {APP_ID} from './src/config/config'

export default class sendmebird extends Component {
  
  componentDidMount() {
    _sendbird = new SendBird({appId: APP_ID})
    
    AppState.addEventListener('change', function(currentAppState){
      if (currentAppState === 'active') {
        _sendbird.setForegroundState();
      } else if (currentAppState === 'background') {
        _sendbird.setBackgroundState();
      }
    });
  }

  render() {
    return (
      <Navigator
        initialRoute={{name: 'login'}}
        renderScene={this._renderScene}
        configureScene={() => {return Navigator.SceneConfigs.FloatFromRight;}}
        style={styles.container}
      />
    )
  }

  _renderScene(route, navigator) {
    let Component = SCREENS[route.name];
    return <Component route={route} navigator={navigator} />;
  }

  createComponent
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});

AppRegistry.registerComponent('sendmebird', () => sendmebird);
