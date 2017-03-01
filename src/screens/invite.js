import React, { Component } from 'react'
import {
  View,
  Text,
  Image,
  TextInput,
  Alert,
  ListView,
  TouchableHighlight,
  StyleSheet
} from 'react-native'

import {APP_ID, PULLDOWN_DISTANCE} from '../config/config';
import Header from './components/header';
import moment from 'moment';
import SendBird from 'sendbird';
var sb = null;

var checkIcon = require('../assets/images/add.png');

export default class Invite extends Component {
  constructor(props) {
    super(props);
    sb = SendBird.getInstance();
    var ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
    this.state = {
      channel: props.route.channel,
      list: [],
      dataSource: ds.cloneWithRows([]),
      listQuery: sb.createUserListQuery(),
      inviteList: []
    };
    this._onUserPress = this._onUserPress.bind(this);
  }

  componentWillMount() {
    this._getUserList();
  }

  _onUserPress(rowData) {
    var _self = this;
    var _inviteList = _self.state.inviteList;
    var _userList = _self.state.list.map((user) => {
      if (user.userId == rowData.userId) {
        if (user.check) {
            user.check = false;
            _inviteList = _inviteList.filter((userId) => {
              return userId !== user.userId;
            })
        } else {
          user.check = true;
          _inviteList.push(user);
        }
      }
      return user
    });
    _self.setState({inviteList: _inviteList});
    _self.setState({list: _userList}, () => {
      var ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
      _self.setState({dataSource: ds.cloneWithRows(_self.state.list)});
    });
  }

  _onInvite() {
    var _self = this;
    if (!_self.state.channel) {
      sb.GroupChannel.createChannel(this.state.inviteList, false, function(channel, error) {
        if (error) {
          console.log(error);
          return;
        }
        _self.props.navigator.replace({name: 'chat', channel: channel, refresh: _self.props.route.refresh});
      });
    } else {
      var _inviteIds = this.state.inviteList.map(function(user) {return user.userId});
      _self.state.channel.inviteWithUserIds(_inviteIds, function(response, error) {
        if (error) {
          console.log(error);
          return;
        }
        _self.props.navigator.pop();
      });
    }
  }

  _getUserList() {
    var _self = this;
    this.state.listQuery.next(function(response, error) {
      if (error) {
        console.log('Get User List Fail.', error);
        return;
      }

      var _response = response.filter((user) => {
        user.check = false;
        return user.userId !== sb.currentUser.userId;
      });
      _self.setState({list: _self.state.list.concat(_response)}, () => {
        _self.setState({
          dataSource: _self.state.dataSource.cloneWithRows(_self.state.list)
        });
      });
    });
  }

  _onBackPress() {
    this.props.navigator.pop();
  }

  _onlineStyle(online) {
    return {
      textAlign: 'center',
      fontSize: 12,
      color: (online == 'online') ? '#6E5BAA' : '#ababab',
      fontWeight: (online == 'online') ? 'bold' : 'normal'
    }
  }

  _checkStyle(rowData) {
    return {
      width: 20,
      height: 20,
      opacity: (rowData.check == true)? 1 : 0.2
    }
  }

  render() {
    return (
      <View style={styles.container}>
        <Header
          onBackPress={this._onBackPress.bind(this)}
          title='User List'
           />

        <View style={styles.listContainer}>
          <ListView
            enableEmptySections={true}
            onEndReached={() => this._getUserList()}
            onEndReachedThreshold={PULLDOWN_DISTANCE}
            dataSource={this.state.dataSource}
            renderRow={(rowData) => {
            return (
              <TouchableHighlight onPress={() => this._onUserPress(rowData)}>
                <View style={styles.listItem}>
                  <View style={styles.listIcon}>
                    <Image style={styles.profileIcon} source={{uri: rowData.profileUrl.replace('http://', 'https://')}} />
                  </View>
                  <View style={styles.listInfo}>
                    <Text style={styles.titleLabel}>{rowData.nickname}</Text>
                  </View>
                  <View style={{flex: 2, flexDirection: 'row', alignItems: 'flex-end', marginRight: 10}}>
                    <View style={{flex: 1, alignItems: 'flex-end'}}>
                      <Image style={this._checkStyle(rowData)} source={checkIcon} />
                    </View>
                     <View style={{flex: 1, flexDirection: 'column', alignItems: 'flex-end'}}>
                       <Text style={this._onlineStyle(rowData.connectionStatus)}>{rowData.connectionStatus}</Text>
                       <Text style={styles.descText}>{(rowData.lastSeenAt == 0) ? '-' : moment(rowData.lastSeenAt).format('MM/DD HH:mm')}</Text>
                     </View>
                  </View>
                </View>
               </TouchableHighlight>
             )}}
           />
        </View>
      </View>
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
  listContainer: {
    flex: 11,
    justifyContent: 'center',
    alignItems: 'stretch'
  },
  listItem: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7f8fc',
    borderBottomWidth: 0.5,
    borderColor: '#D0DBE4',
    padding: 5
  },
  listIcon: {
    justifyContent: 'flex-start',
    paddingLeft: 10,
    paddingRight: 15
  },
  profileIcon: {
    width: 30,
    height: 30
  },
  listInfo: {
    flex: 1,
    justifyContent: 'flex-start'
  },
  titleLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#60768b'
  },
  descText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#ababab',
    fontWeight: 'bold'
  }
});
