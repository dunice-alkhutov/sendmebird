import React, { Component } from 'react'
import {
  View,
  Text,
  Image,
  StyleSheet
} from 'react-native'

import ImageButton from './imageButton';

var backIcon = require('../../assets/images/back.png');
var addIcon = require('../../assets/images/add.png');
var listIcon = require('../../assets/images/menu.png');
const UNDERLAYCOLOR = '#4e4273'

export default class Header extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.leftButton}>
          <ImageButton
            underlayColor={UNDERLAYCOLOR}
            onPress={this.props.onBackPress}
            imageStyle={styles.imageButton}
            image={backIcon}
          />
        </View>

        <View style={styles.titleView}>
          <Text style={styles.titleLabel}>{this.props.title}</Text>
        </View>

        <View style={styles.rightButton}>
          {this._renderButton()}
        </View>
      </View>
    );
  }

  _renderButton() {
    if (this.props.onCreateOpenChannel) {
      return (
        <ImageButton
          underlayColor={UNDERLAYCOLOR}
          onPress={this.props.onCreateOpenChannel}
          imageStyle={[styles.imageButton, {width: 20, height: 20}]}
          image={addIcon}
        />
      )
    } else if (this.props.onOpenMenu) {
        return (
          <ImageButton
            underlayColor={UNDERLAYCOLOR}
            onPress={this.props.onOpenMenu}
            imageStyle={[styles.imageButton]}
            image={listIcon}
          />
        )
    } else if (this.props.onGroupChannel) {
      return (
        <ImageButton
          underlayColor={UNDERLAYCOLOR}
          onPress={this.props.onGroupChannel}
          imageStyle={[styles.imageButton]}
          image={listIcon}
        />
      )
    } else if (this.props.onInvite) {
      return (
        <ImageButton
          underlayColor={'#4e4273'}
          onPress={this.props.onInvite}
          imageStyle={[styles.imageButton, {width: 20, height: 20}]}
          image={addIcon}
        />
      )
    }
  }

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#4e4273',
    paddingTop: 20,
    paddingBottom: 2,
  },
  titleView: {
    flex: 1,
    justifyContent: 'flex-start'
  },
  titleLabel: {
    color:'#fff',
    textAlign:'center',
    fontWeight:'bold',
    fontSize: 18
  },
  leftButton: {
    justifyContent: 'flex-start',
    paddingLeft: 5
  },
  rightButton: {
    justifyContent: 'flex-end',
    paddingRight: 10
  },
  imageButton: {
    width: 30,
    height: 30
  }
});
