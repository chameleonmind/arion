import * as eventHandlers from './event-handlers.js';

window.Arion = class {

    logsEnabled = true;
    connected = false;

    backendUrl = null;
    jwtToken = null;

    signalerParams = null;

    wsClient = null;
    userData = null;

    spaces = [];

    eventHandlers = {};

    constructor(params) {
        let self = this;
        // @ToDo: this should be fixed to load the script internally from the package
        loadJS('https://milanpasic92.github.io/arion/web/arion/RTCMultiConnection-v3.6.9.js', function (){
            self.init(params);
        }, document.body);

        // will be needed for joinLive(); since RtcMultiConnection lib uses io lib for sockets
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
        this.eventHandlers = {
            'error': new eventHandlers.ErrorHandler(this),
            'authorized': new eventHandlers.AuthorizedHandler(this),
            'spaces_list': new eventHandlers.SpacesListHandler(this),
            'connected_to_public_space': new eventHandlers.ConnectedToPublicSpaceHandler(this),
            'search_members_results': new eventHandlers.SearchMembersResultsHandler(this),
            'new_private_space_opened': new eventHandlers.NewPrivateSpaceOpenedHandler(this),
            'space_messages': new eventHandlers.SpaceMessagesHandler(this),
            'new_private_message': new eventHandlers.NewMessageHandler(this),
            'new_public_space_message': new eventHandlers.NewPublicSpaceMessageHandler(this),
            'user_active_on_new_device': new eventHandlers.UserOnlineOnNewDeviceHandler(this),
            'user_offline_on_device': new eventHandlers.UserOfflineOnDeviceHandler(this),
            'joined_live_space': new eventHandlers.JoinedLiveSpaceHandler(this),
            'already_joined_live_space': new eventHandlers.AlreadyJoinedLiveSpaceHandler(this),
            'another_user_joined_live_space': new eventHandlers.UserJoinedLiveSpaceHandler(this),
            'request_to_join_live_space': new eventHandlers.RequestToJoinLiveSpaceHandler(this),
            'left_live_space': new eventHandlers.LeftLiveSpaceHandler(this),
            'another_user_left_live_space': new eventHandlers.UserLeftLiveSpaceHandler(this),
            'in-app_notification': new eventHandlers.InAppNotificationsHandler(this),
            'member_device_status_update': new eventHandlers.MemberDeviceStatusUpdateHandler(this),
        };
    }

    /* public */
    connectToPublicSpace(spaceCode){
        this.emit('connectToPublicSpace', 0, {spaceCode: spaceCode});
    }

    /* public */
    searchMembers(query){
        this.emit('searchMembers', 0, {query: query});
    }

    /* public */
    newPrivateChat(uUid){
        this.emit('newPrivateChat', 0, {uUid: uUid});
    }

    /* public */
    sendMessage(spaceId, message){
        this.emit('sendMessage', spaceId, {message: message});
    }

    /* public */
    getSpaceMessageHistory(spaceId, lastId, limit){
        this.emit('getMessages', spaceId, {lastId: lastId, limit: limit});
    }

    /* public */
    joinLiveSpace(spaceId){
        this.emit('joinLiveSpace', spaceId);
    }

    /* public */
    dropFromLiveSpace(spaceId){
        if(!this.spaces[spaceId].rtcMultiConnection.activeSession){
            this.error({'dropFromLiveSpace':'there is no active session to close for this spaceId'})
            return;
        }
        this.emit('leaveLiveSpace', spaceId);
    }

    /* public */
    requestOthersToJoin(spaceId){
        if(!this.spaces[spaceId].rtcMultiConnection.activeSession){
            this.error({'requestOthersToJoin':'you must joinLive() a space before requesting others to join'})
            return;
        }
        this.emit('requestOthersToJoin', spaceId);
    }

    /* public */
    forbidMemberDevice(spaceId, uUid, deviceType, status){
        if(!this.spaces[spaceId].rtcMultiConnection.activeSession){
            this.error({'requestOthersToJoin':'you must joinLive() a space before requesting others to join'})
            return;
        }
        this.emit('forbidMemberDevice', spaceId, {uUid: uUid, deviceType: deviceType, status: status});
    }

    initSocket(){
        let self = this;
        this.wsClient = new WebSocket(this.backendUrl);

        this.wsClient.onopen = function(e) {
            self.log("Connected to Arion BE! sending auth data.");
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

        this.wsClient.onclose = function (){
            self.connected = false;
            self.onDisconnected();
        }
    }

    emit(action, space = 0, data = null, callback = null){
        if(!this.wsClient){
            this.error('wsClient not initialized');
            return;
        }

        if(!this.connected && !['authorize', 'connect'].includes(action)){
            this.error('arion not connected');
            return;
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
        this.onError(object);
    }

    disconnect() {
        for(let space in this.spaces) {
            if(this.spaces[space].rtcMultiConnection && this.spaces[space].rtcMultiConnection.activeSession) {
                this.spaces[space].rtcMultiConnection.dropFromSpace();
                delete this.spaces[space].rtcMultiConnection;
            }
        }

        let self = this;
        setTimeout(function (){
            self.wsClient.close();
        },50);
    }

    onConnected(spaces){
        // implement this
    }

    onSpaceMessageHistory(space, messages){
        // implement this
    }

    onConnectedToPublicSpace(space){
        // implement this
    }

    onSearchMembersResults(data){
        // implement this
    }

    onNewPrivateSpaceOpened(data){
        // implement this
    }

    onUserOnlineOnDeviceInSpace(space, data){
        // implement this
    }

    onUpdatedPrivateChatUserStatus(space, data){
        // implement this
    }

    onUserOfflineOnDeviceInSpace(space, data){
        // implement this
    }

    defaultMessageHandler(space, data){
        // implement this
    }

    onNewMessage(space, data){
        // implement this
    }

    onJoinedLiveSpace(space){
        // implement this
    }

    onAnotherUserJoinedLiveSpace(space, data){
        // implement this
    }

    onAnotherUserLeftLiveSpace(space, data){
        // implement this
    }

    onRequestToJoinLiveSpace(space, data){
        // implement this
    }

    onLiveMemberDeviceStatusUpdated(space, userLiveData){
        // implement this
    }

    onLiveSpaceConnectionBroke(spaceId){
        this.onLeftLiveSpace(this.spaces[spaceId]);
    }

    onNewInAppNotification(data){
        // implement this
    }

    onDisconnected(){
        this.log('onDisconnected: implement/override this. handle connection lost.');
    }

    onLeftLiveSpace(space){
        // implement this
    }

    onError(object){
        // implement this
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