import {RtcSpace} from './rtc.js';

class BaseEventHandler {
    constructor(arion) {
        this.arion = arion;
    }
}

class ErrorHandler extends BaseEventHandler {
    handle(data){
        this.arion.error(data.data);
    }
}

class AuthorizedHandler extends BaseEventHandler {
    handle(data){
        this.arion.log('authorized');
        this.arion.userData = data.data.userData;
        this.arion.signalerParams = data.data.signalerParams;

        this.arion.emit('connect', 0);
    }
}

class SpaceMessagesHandler extends BaseEventHandler {
    handle(data){
        let messages = data.data;
        for(let i in messages){
            this.arion.spaces[data.space]['messages'][messages[i].id] = messages[i];
        }
        this.arion.onSpaceMessageHistory(data.space, messages);
    }
}

class SpacesListHandler extends BaseEventHandler {
    handle(data){
        for(let i in data.data){
            this.arion.spaces[data.data[i].info.id] = data.data[i];
        }
        this.arion.onConnected(this.arion.spaces);
    }
}

class NewOnlineUserHandler extends BaseEventHandler {
    handle(data){
        this.arion.spaces[data.space]['participants'][data.data.resourceId] = data.data;

        this.arion.onUserOnlineInSpace(data.space, data.data);
    }
}

class UserOfflineHandler extends BaseEventHandler {
    handle(data){
        let userThatLeft = this.arion.spaces[data.space].participants[data.data];
        delete this.arion.spaces[data.space].participants[data.data];

        this.arion.onUserLeft(userThatLeft);
    }
}

class NewMessageHandler extends BaseEventHandler {
    handle(data){
        this.arion.spaces[data.space]['messages'][data.data.id] = data.data;
        this.arion.onNewMessage(data.space, data.data);
    }
}

class JoinedLiveSpaceHandler extends BaseEventHandler {
    handle(data){
        this.arion.spaces[data.space]['participants'][data.data]['status'] = 'live';

        this.arion.spaces[data.space].rtcMultiConnection = new RtcSpace(this.arion, data.space);
        this.arion.spaces[data.space].rtcMultiConnection.joinSpace();

        this.arion.onJoinedLiveSpace(this.arion.spaces[data.space]);
    }
}

class LeftLiveSpaceHandler extends BaseEventHandler {
    handle(data){
        this.arion.spaces[data.space]['participants'][data.data]['status'] = 'online';

        // ToDo: maybe participant streams and media objects should be reseted
        delete this.arion.spaces[data.space].rtcMultiConnection;

        this.arion.onLeftLiveSpace(this.arion.spaces[data.space]);
    }
}

class UserJoinedLiveSpaceHandler extends BaseEventHandler {
    handle(data){
        let userThatJoined = this.arion.spaces[data.space]['participants'][data.data];
        this.arion.spaces[data.space]['participants'][data.data]['status'] = 'live';
        this.arion.onAnotherUserJoinedLiveSpace(data.space, userThatJoined);
    }
}

class UserLeftLiveSpaceHandler extends BaseEventHandler {
    handle(data){
        let userThatLeft = this.arion.spaces[data.space]['participants'][data.data];
        this.arion.spaces[data.space]['participants'][data.data]['status'] = 'online';
        this.arion.onAnotherUserLeftLiveSpace(data.space, userThatLeft);
    }
}

export {
    ErrorHandler,
    AuthorizedHandler,
    SpacesListHandler,
    SpaceMessagesHandler,
    NewMessageHandler,
    NewOnlineUserHandler,
    UserOfflineHandler,
    JoinedLiveSpaceHandler,
    UserJoinedLiveSpaceHandler,
    LeftLiveSpaceHandler,
    UserLeftLiveSpaceHandler
}