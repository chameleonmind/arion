import * as eventHandlers from './event-handlers.js';

window.Arion = class {

    logsEnabled = true;

    backendUrl = null;
    jwtToken = null;

    signalerParams = null;

    wsClient = null;
    userData = null;

    spaces = [];

    eventHandlers = {};

    constructor(params) {
        let self = this;
        loadJS('arion/RTCMultiConnection-v3.6.9.js', function (){
            self.init(params);
        }, document.body);

        // will be needed for joinLive(); since RtcMultiConnection lib uses io for sockets
        loadJS('https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.2.0/socket.io.js', function (){}, document.body);
    }

    init(params){
        this.log({'constructorParams': params});
        this.backendUrl = params.backendUrl;
        this.jwtToken = params.jwtToken;

        this.loadEventHandlers();
        this.initSocket();
    }

    loadEventHandlers(){
        let self = this;
        self.eventHandlers = {
            'error': new eventHandlers.ErrorHandler(self),
            'authorized': new eventHandlers.AuthorizedHandler(self),
            'spaces_list': new eventHandlers.SpacesListHandler(self),
            'space_messages': new eventHandlers.SpaceMessagesHandler(self),
            'new_message': new eventHandlers.NewMessageHandler(self),
            'new_online_user': new eventHandlers.NewOnlineUserHandler(self),
            'user_offline': new eventHandlers.UserOfflineHandler(self),
            'joined_live_space': new eventHandlers.JoinedLiveSpaceHandler(self),
            'another_user_joined_live_space': new eventHandlers.UserJoinedLiveSpaceHandler(self),
            'left_live_space': new eventHandlers.LeftLiveSpaceHandler(self),
            'another_user_left_live_space': new eventHandlers.UserLeftLiveSpaceHandler(self),
        };
    }

    /* public */
    joinLiveSpace(spaceId){
        this.emit('joinLiveSpace', spaceId);
    }

    /* public */
    sendMessage(spaceId, message){
        this.emit('sendMessage', spaceId, {message: message});
    }

    /* public */
    getSpaceMessageHistory(spaceId, lastId, limit){
        this.emit('getMessages', spaceId, {lastId: lastId, limit: limit});
    }

    initSocket(){
        let self = this;
        this.wsClient = new WebSocket(this.backendUrl);

        this.wsClient.onopen = function(e) {
            self.log("Connected to Arion!");
            self.emit('authorize', 0, {jwtToken: self.jwtToken});
        };

        this.wsClient.onmessage = function(e) {
            let data = JSON.parse(e.data);
            self.log({'got a message': data});

            try {
                self.eventHandlers[data.action].handle(data);
            }
            catch (error){
                self.error(error);
            }
        };
    }

    emit(action, space = 0, data = null, callback = null){
        if(!this.wsClient){
            this.error('wsClient not initialized');
        }

        let message = {
            action: action,
            space: space,
            data: data
        };

        this.log({'sent': message});
        this.wsClient.send(JSON.stringify(message));

        if(callback){
            callback();
        }
    }

    log(object) {
        if(this.logsEnabled){
            console.log('arionLog: ', object);
        }
    }

    error(object) {
        console.error('arionLog: ', object);
    }
}

const loadJS = function(url, implementationCode, location)
{
    let scriptTag = document.createElement('script');
    scriptTag.src = url;

    scriptTag.onload = implementationCode;
    scriptTag.onreadystatechange = implementationCode;

    location.appendChild(scriptTag);
};