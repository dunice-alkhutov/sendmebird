import React, { Component } from 'react'
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    Platform,
    Button,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    TouchableHighlight
} from 'react-native'

const LoginView = Platform.select({
    ios: () => KeyboardAvoidingView,
    android: () => View,
})();

import SendBird from 'sendbird'
var _sendbird = null;

export default class Login extends Component {
    constructor(props) {
        super(props);
        this.state = {
            userId: '',
            username: '',
            connectLabel: 'CONNECT',
            buttonDisabled: true,
            errorMessage: ''
        };
        this._onPressConnect = this._onPressConnect.bind(this);
        this._onPressOpenChannel = this._onPressOpenChannel.bind(this);
        this._onPressGroupChannel = this._onPressGroupChannel.bind(this)
    }

    _onPressConnect() {
        Keyboard.dismiss();

        if (!this.state.buttonDisabled) {
            this._onPressDisconnect();
            return;
        }

        if (this.state.username.trim().length == 0 || this.state.userId.trim().length == 0) {
            this.setState({
                userId: '',
                username: '',
                errorMessage: 'User ID and Nickname must be required.'
            });
            return;
        }

        // remove non letters and non digits
        var regExp = /[\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]/gi
        if (regExp.test(this.state.username) || regExp.test(this.state.userId)) {
            this.setState({
                userId: '',
                username: '',
                errorMessage: 'Please only alphanumeric characters.'
            });
            return;
        }

        _sendbird = SendBird.getInstance();
        var _self = this;
        _sendbird.connect(_self.state.userId, function (user, error) {
            if (error) {
                _self.setState({
                    userId: '',
                    username: '',
                    errorMessage: 'Login Error'
                });
                console.log(error);
                return;
            }

            if (Platform.OS === 'ios') {
                if (_sendbird.getPendingAPNSToken()) {
                    _sendbird.registerAPNSPushTokenForCurrentUser(_sendbird.getPendingAPNSToken(), function (result, error) {});
                }
            } else {
                if (_sendbird.getPendingGCMToken()) {
                    _sendbird.registerGCMPushTokenForCurrentUser(_sendbird.getPendingGCMToken(), function (result, error) {});
                }
            }

            _sendbird.updateCurrentUserInfo(_self.state.username, '', function (response, error) {
                _self.setState({
                    buttonDisabled: false,
                    connectLabel: 'DISCONNECT',
                    errorMessage: ''
                });
            });
        });
    }

    _onPressOpenChannel() {
        this.props.navigator.push({ name: 'openChannel' });
    }

    _onPressGroupChannel() {
        this.props.navigator.push({ name: 'groupChannel' });
    }

    _onPressDisconnect() {
        _sendbird.disconnect();
        this.setState({
            userId: '',
            username: '',
            errorMessage: '',
            buttonDisabled: true,
            connectLabel: 'CONNECT'
        });
    }

    _buttonStyle() {
        return {
            fontSize: 24,
            color: '#fff'
        }
    }

    render() {
        return (
            <LoginView behavior='padding' style={styles.container} >
                <Image style={styles.bgImage} 
                       source={{uri:'https://cdn.pixabay.com/photo/2016/05/16/19/34/wood-1396497_960_720.jpg'}}>
                <View style={styles.loginContainer}>
                    <TextInput
                        style={styles.input}
                        value={this.state.userId}
                        onChangeText={(text) => this.setState({ userId: text })}
                        onSubmitEditing={Keyboard.dismiss}
                        placeholder={'Enter User ID'}
                        maxLength={12}
                        multiline={false}
                    />
                    <TextInput
                        style={[styles.input, { marginTop: 10 }]}
                        value={this.state.username}
                        onChangeText={(text) => this.setState({ username: text })}
                        onSubmitEditing={Keyboard.dismiss}
                        placeholder={'Enter User Nickname'}
                        maxLength={12}
                        multiline={false}
                    />

                    <TouchableHighlight
                        underlayColor='transparent'
                        style={{top: 16,}}
                        onPress={this._onPressConnect}>
                        <Text style={this._buttonStyle()}>{this.state.connectLabel}</Text>
                    </TouchableHighlight>

                    <Text style={styles.errorLabel}>{this.state.errorMessage}</Text>

                    <TouchableHighlight
                        underlayColor='transparent'
                        style={{top: 14}}
                        onPress={this._onPressOpenChannel}>
                        <Text style={this._buttonStyle()}>Open Channel</Text>
                    </TouchableHighlight>

                    <TouchableHighlight
                        underlayColor='transparent'
                        style={{top: 16}}
                        onPress={this._onPressGroupChannel}>
                        <Text style={this._buttonStyle()}>Group Channel</Text>
                    </TouchableHighlight>

                   
                    
                </View>
                </Image>
            </LoginView>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    loginContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1
    },
    input: {
        width: 250,
        color: '#555555',
        padding: 10,
        height: 50,
        borderColor: '#6E5BAA',
        borderWidth: 1,
        borderRadius: 4,
        alignSelf: 'center',
        backgroundColor: '#ffffff'
    },
    errorLabel: {
        color: '#ff0200',
        fontSize: 13,
        marginTop: 10,
        width: 250
    },
    bgImage:{
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
    }
});
