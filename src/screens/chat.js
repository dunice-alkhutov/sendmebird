import React, { Component } from 'react'
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableHighlight,
  StyleSheet,
  PixelRatio,
  Modal,
  Alert,
  Platform,
  Keyboard,
  KeyboardAvoidingView,
  ListView
} from 'react-native'

import {PULLDOWN_DISTANCE} from '../config/config';
import Header from './components/header';
import moment from 'moment';
import Button from 'react-native-button';

// Android does keyboard height adjustment natively.
const ChatView = Platform.select({
  ios: () => KeyboardAvoidingView,
  android: () => View,
})();

import SendBird from 'sendbird';
var sb = null;
// const ImagePicker = require('react-native-image-picker');
import ImagePicker from 'react-native-image-picker';
var ipOptions = {
  title: 'Select Image File To Send',  
  mediaType: 'photo',
  noData: true 
};

export default class Chat extends Component {
  constructor(props) {
    super(props);
    sb = SendBird.getInstance();
    var ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
    this.state = {
      channel: props.route.channel,
      name: props.route.name,
      dataSource: ds.cloneWithRows([]),
      messageQuery: props.route.channel.createPreviousMessageListQuery(),
      messages: [],
      text: '',
      disabled: true,
      show: false,
      lastMessage: null,
      hasRendered: false,
    };
    this._onBackPress = this._onBackPress.bind(this);
    this._onSend = this._onSend.bind(this);
    this._onPhoto = this._onPhoto.bind(this);
    this._onChangeText = this._onChangeText.bind(this);
  }

  componentWillUnmount() {
    sb.removeChannelHandler('ChatView');
    sb.removeConnectionHandler('ChatView')
  }

  componentDidMount() {
    console.log("componentDidMount");      
    var _self = this;
    if (!_self.state.hasRendered){
      _self.state.hasRendered = true;
      _self._getChannelMessage(false);    
      if (_self.state.channel.channelType == 'group') {
          _self.state.channel.markAsRead();
      }

      // channel handler
      var ChannelHandler = new sb.ChannelHandler();
      ChannelHandler.onMessageReceived = function(channel, message){
        if (channel.url == _self.state.channel.url) {
          var _messages = [];
          _messages.push(message);          
          var _newMessageList = _messages.concat(_self.state.messages);
          _self.setState({
            messages: _newMessageList,
            dataSource: _self.state.dataSource.cloneWithRows(_newMessageList)
          });
          _self.state.lastMessage = message;
          if (_self.state.channel.channelType == 'group') {
            _self.state.channel.markAsRead();
            _self.state.channel.lastMessage = message;
          }        
        }
      };

      ChannelHandler.onUserJoined = function(channel, user) {
        _self.props.route.refresh(_self.state.channel);
      };
      ChannelHandler.onUserLeft = function(channel, user) {
        _self.props.route.refresh(_self.state.channel);
      };
      sb.addChannelHandler('ChatView', ChannelHandler);

      var ConnectionHandler = new sb.ConnectionHandler();
      ConnectionHandler.onReconnectSucceeded = function(){
        _self._getChannelMessage(true);
        _self.state.channel.refresh(function(){
          _self.props.route.refresh(_self.state.channel);          
        });
      }
      sb.addConnectionHandler('ChatView', ConnectionHandler);
    }
  }

  _getChannelMessage(refresh) {
    var _self = this;

    if(refresh){
      _self.state.messageQuery = _self.props.route.channel.createPreviousMessageListQuery();
      _self.state.messages = [];      
    }
    
    if (!this.state.messageQuery.hasMore) {
      return;
    }
    this.state.messageQuery.load(20, false, function(response, error){
      if (error) {
        console.log('Get Message List Fail.', error);
        return;
      }

      var _messages = [];
      for (var i = 0 ; i < response.length ; i++) {
        var _curr = response[i];    
        if (i > 0) {
          var _prev = response[i-1];
          if (_curr.createdAt - _prev.createdAt > (1000 * 60 * 60)) {
            if (i > 1 && !_messages[i-2].hasOwnProperty('isDate')) {              
              _messages.splice((i-1), 0, {isDate: true, createdAt: _prev.createdAt});
            }
          }
        } 
        _messages.push(_curr);
        _self.state.lastMessage = _curr;
      }

      var _newMessageList = _self.state.messages.concat(_messages.reverse());
      _self.setState({
        messages: _newMessageList,
        dataSource: _self.state.dataSource.cloneWithRows(_newMessageList)
      });
    });
  }

  _onChangeText(text) {
    this.setState({
      text: text,
      disabled: (text.trim().length > 0) ? false : true
    })
  }

  _onPhoto() {
    return
    var _self = this;

    if (Platform.OS === 'android'){
      sb.disableStateChange();
    }
    ImagePicker.showImagePicker(ipOptions, (response) => {            
      if (Platform.OS === 'android'){
        sb.enableStateChange();
      }
      if (response.didCancel) {
        console.log('User cancelled image picker');
      }
      else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
      }
      else if (response.customButton) {
        console.log('User tapped custom button: ', response.customButton);
      }
      else {
        let source = {uri:response.uri};
        
        if (response.name){
          source['name'] = response.fileName
        } else{
          paths = response.uri.split("/")
          source['name'] = paths[paths.length-1];
        }

        if (response.type){
          source['type'] = response.type; 
        }

        _self.state.channel.sendFileMessage(source, function(message, error){
          if (error) {
            console.log(error);
            return;
          }

          var _messages = [];
          _messages.push(message);
          if (_self.state.lastMessage && message.createdAt - _self.state.lastMessage.createdAt  > (1000 * 60 * 60)) {            
            _messages.push({isDate: true, createdAt: message.createdAt});
          }
          
          var _newMessageList = _messages.concat(_self.state.messages);
          _self.setState({
            messages: _newMessageList,
            dataSource: _self.state.dataSource.cloneWithRows(_newMessageList)
          });
          _self.state.lastMessage = message;
          _self.state.channel.lastMessage = message;
        });
      };
         
    });
  }

  _onSend() {
    var _self = this;
    if (!_self.state.text){
      return;
    }
    _self.state.channel.sendUserMessage(_self.state.text, '', function(message, error) {
      if (error) {
        console.log(error);
        return;
      }

      var _messages = [];
      _messages.push(message);
      if (_self.state.lastMessage && message.createdAt - _self.state.lastMessage.createdAt  > (1000 * 60 * 60)) {        
        _messages.push({isDate: true, createdAt: message.createdAt});
      }

      var _newMessageList = _messages.concat(_self.state.messages);
      _self.setState({
        messages: _newMessageList,
        dataSource: _self.state.dataSource.cloneWithRows(_newMessageList)
      });
      _self.state.lastMessage = message;
      _self.state.channel.lastMessage = message;
      _self.setState({text: '', disabled: true});
    });
  }

  _onBackPress() {
    this.props.route.refresh(this.state.channel);
    this.props.navigator.pop();
  }

  _onOpenMenu() {
    if (this.state.channel.channelType == 'open') {
      Alert.alert(
        'Open Channel',
        null,
        [
          {text: 'Invite users to this channel', onPress: () => {
            this.props.navigator.push({name: 'inviteUser', channel: this.state.channel});
          }},
          {text: 'Close'}
        ]
      )
    } else {
      var _self = this;
      Alert.alert(
        'Group Channel Event',
        null,
        [
          {text: 'Invite users to this channel', onPress: () => {
            this.props.navigator.push({name: 'inviteUser', channel: this.state.channel});
          }},
          {text: 'Leave this channel', onPress: () => {
            this.state.channel.leave(function(response, error) {
              if (error) {
                console.log(error);
                return;
              }
              _self.props.navigator.pop();
              setTimeout(function() {_self.props.route._onHideChannel(_self.state.channel);}, 500);
            });
          }},
          {text: 'Hide this channel', onPress: () => {
            this.state.channel.hide(function(response, error) {
              if (error) {
                console.log(error);
                return;
              }
              _self.props.navigator.pop();
              setTimeout(function() {_self.props.route._onHideChannel(_self.state.channel);}, 500);
            });
          }},
          {text: 'Member list', onPress: () => {
            _self.props.navigator.push({name: 'members', channel: _self.state.channel});
          }},
          {text: 'Close'}
        ]
      )
    }
  }

  render() {
    return (      
        <ChatView behavior="padding" style={styles.container}>
        <Header
          onBackPress={this._onBackPress.bind(this)}
          onOpenMenu={this._onOpenMenu.bind(this)}
          title={this.state.channel.name}
        />
        <View style={[styles.chatContainer, {transform: [{ scaleY: -1 }]}]}>
          <ListView
            enableEmptySections={true}
            onEndReached={() => this._getChannelMessage(false)}
            onEndReachedThreshold={PULLDOWN_DISTANCE}
            dataSource={this.state.dataSource}
            renderRow={(rowData) => {
              if (rowData.hasOwnProperty('isDate')) {
                return (
                  <View style={[styles.listItem, {transform: [{ scaleY: -1 }]}, {flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}]}>
                    <Text style={styles.dateText}>{moment(rowData.createdAt).calendar()}</Text>
                  </View>
                )
              } else if (rowData.messageType == 'user') {
                return (
                    <TouchableHighlight underlayColor='#f7f8fc' onPress={() => this._onUserPress(rowData.sender)}>
                      <View style={[styles.listItem, {transform: [{ scaleY: -1 }]}]}>
                        <View style={styles.listIcon}>
                          <Image style={styles.senderIcon}  source={{uri: rowData.sender.profileUrl.replace('http://', 'https://')}} />
                        </View>
                        <View style={styles.senderContainer}>
                          <Text style={[styles.senderText, {color: '#3e3e55'}]}>{rowData.sender.nickname}</Text>
                          <Text style={[styles.senderText, {color: '#343434', fontWeight: 'bold'}]}>{rowData.message}</Text>
                        </View>
                      </View>
                    </TouchableHighlight>
                  )                                                
                } else if (rowData.messageType == 'file') {                
                  return (
                    <TouchableHighlight underlayColor='#f7f8fc' onPress={() => this._onUserPress(rowData.sender)}>
                      <View style={[styles.listItem, {transform: [{ scaleY: -1 }]}]}>
                        <View style={styles.listIcon}>
                          <Image style={styles.senderIcon}  source={{uri: rowData.sender.profileUrl.replace('http://', 'https://')}} />
                        </View>
                        <View style={styles.senderContainer}>
                          <Text style={[styles.senderText, {color: '#3e3e55'}]}>{rowData.sender.nickname}</Text>
                          <Image style={{width: 100, height: 70}}  source={{uri: rowData.url.replace('http://', 'https://')}} />
                        </View>
                      </View>
                    </TouchableHighlight>
                  )                  
                } else if (rowData.messageType == 'admin') {
                  return (
                      <View style={[styles.adListItem, {transform: [{ scaleY: -1 }]}, {flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}]}>
                        <View style={styles.senderContainer}>
                          <Text style={[styles.senderText, {color: '#343434', fontWeight: 'bold'}]}>{rowData.message}</Text>
                        </View>
                      </View>
                      )
                } else {
                  return null
                }
              }
            }
          />
        </View>
        <View style={styles.inputContainer}>
          <Button
            style={styles.photoButton}
            onPress={this._onPhoto}
          >{'+'}</Button>
          <TextInput
            style={styles.textInput}
            placeholder={'Please type mesasge...'}
            ref='textInput'
            onChangeText={this._onChangeText}
            value={this.state.text}
            autoFocus={false}
            blurOnSubmit={false}
          />
          <Button
            style={styles.sendButton}
            onPress={this._onSend}
            disabled={this.state.disabled}
          >{'send'}</Button>
        </View>
      </ChatView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    backgroundColor: '#ffffff'
  },
  chatContainer: {
    flex: 10,
    justifyContent: 'center',
    alignItems: 'stretch',
    backgroundColor: '#f7f8fc'
  },
  inputContainer: {
    height: 44,
    borderTopWidth: 1 / PixelRatio.get(),
    borderColor: '#b2b2b2',
    flexDirection: 'row',
    paddingLeft: 10,
    paddingRight: 10,
  },
  textInput: {
    alignSelf: 'center',
    height: 30,
    width: 100,
    backgroundColor: '#FFF',
    flex: 1,
    padding: 0,
    margin: 0,
    fontSize: 15,
  },
  photoButton: {
    marginTop: 11,
    marginRight: 10,
  },
  sendButton: {
    marginTop: 11,
    marginLeft: 10,
  },
  listItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f7f8fc',
    padding: 5,
  },

  adListItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#e6e9f0',
    padding: 5,
    margin: 5,
  },
  
  listIcon: {
    justifyContent: 'flex-start',
    paddingLeft: 10,
    paddingRight: 15
  },
  senderIcon: {
    width: 30,
    height: 30
  },
  senderContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  senderText: {
    fontSize: 12,
    color: '#ababab'
  },
  dateText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#ababab',
    fontWeight: 'bold'
  }
});
