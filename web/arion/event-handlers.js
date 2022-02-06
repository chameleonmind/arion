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
        for(let i in messages){ // populate messages
            this.arion.spaces[data.space]['messages'][messages[i].id] = messages[i];
        }
        this.arion.onSpaceMessageHistory(data.space, messages);
    }
}

class SpacesListHandler extends BaseEventHandler {
    handle(data){
        this.arion.connected = true;
        for(let i in data.data){
            this.arion.spaces[data.data[i].info.reference_entity][data.data[i].info.id] = data.data[i];
        }
        this.arion.onConnected(this.arion.spaces);
    }
}

class UserOnlineOnNewDeviceHandler extends BaseEventHandler {
    handle(data){
        // updates whole user object
        this.arion.spaces[data.space]['participants'][data.data.u_uid] = data.data;

        this.arion.onUserOnlineOnDeviceInSpace(data.space, data.data);
    }
}

class UserOfflineOnDeviceHandler extends BaseEventHandler {
    handle(data){
        // updates whole user object
        this.arion.spaces[data.space]['participants'][data.data.u_uid] = data.data;

        this.arion.onUserOfflineOnDeviceInSpace(data.space, data.data);
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
        this.arion.spaces[data.space] = data.data;

        this.arion.spaces[data.space].rtcMultiConnection = new RtcSpace(this.arion, data.space);
        this.arion.spaces[data.space].rtcMultiConnection.joinSpace();

        this.arion.onJoinedLiveSpace(this.arion.spaces[data.space]);
    }
}

class AlreadyJoinedLiveSpaceHandler extends BaseEventHandler {
    handle(data){
        this.arion.spaces[data.space]['participants'][data.data.u_uid] = data.data;
    }
}

class LeftLiveSpaceHandler extends BaseEventHandler {
    handle(data){
        this.arion.spaces[data.space]['participants'][data.data.u_uid] = data.data;
        this.arion.spaces[data.space].rtcMultiConnection.dropFromSpace();

        delete this.arion.spaces[data.space].rtcMultiConnection;
    }
}

class UserJoinedLiveSpaceHandler extends BaseEventHandler {
    handle(data){
        this.arion.spaces[data.space]['participants'][data.data.u_uid] = data.data;
        this.arion.onAnotherUserJoinedLiveSpace(data.space, data.data);
    }
}

class RequestToJoinLiveSpaceHandler extends BaseEventHandler {
    handle(data){
        this.arion.onRequestToJoinLiveSpace(data.space, data.data);
    }
}

class UserLeftLiveSpaceHandler extends BaseEventHandler {
    handle(data){
        this.arion.spaces[data.space]['participants'][data.data.u_uid] = data.data;
        this.arion.onAnotherUserLeftLiveSpace(data.space, data.data);
    }
}

class SystemNotificationsHandler extends BaseEventHandler {
    handle(data){
        this.arion.log(data);
    }
}

export {
    ErrorHandler,
    AuthorizedHandler,
    SpacesListHandler,
    SpaceMessagesHandler,
    NewMessageHandler,
    UserOnlineOnNewDeviceHandler,
    UserOfflineOnDeviceHandler,
    JoinedLiveSpaceHandler,
    AlreadyJoinedLiveSpaceHandler,
    UserJoinedLiveSpaceHandler,
    RequestToJoinLiveSpaceHandler,
    LeftLiveSpaceHandler,
    UserLeftLiveSpaceHandler,
    SystemNotificationsHandler
}