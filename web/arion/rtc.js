class RtcSpace {

    /** RtcSpace is a wrapper class around RtcMultiConnection.js */
    /* credits to: https://github.com/muaz-khan/RTCMultiConnection */

    rtcMultiConnection = null;
    arion = null;

    spaceId = null;
    activeSession = false;

    rtcStreamCommandIssued = false;
    audioStarted = false;
    videoStarted = false;
    screenStarted = false;

    audioStreamId = null;
    videoStreamId = null;
    screenStreamId = null;

    constructor(arion, spaceId) {
        let self = this;
        this.rtcMultiConnection = new RTCMultiConnection();
        this.arion = arion;
        this.spaceId = spaceId;

        this.rtcMultiConnection.iceServers = [];
        this.rtcMultiConnection.iceServers.push({
            urls: [
                'stun:stun.l.google.com:19302',
                'stun:stun2.l.google.com:19302',
                'stun:stun.l.google.com:19302?transport=udp',
            ]
        });
        this.rtcMultiConnection.iceServers.push({
            urls: 'turn:' + this.arion.signalerParams.turnUrl,
            username: this.arion.signalerParams.turnUsername,
            credential: this.arion.signalerParams.turnPassword
        });

        this.rtcMultiConnection.extra = {
            u_uid: this.arion.userData.data.u_uid,
            resource_id: this.arion.userData.resourceId,
        };

        this.rtcMultiConnection.socketURL = this.arion.signalerParams.signalerUrl;
        this.rtcMultiConnection.session = {data: true, video: false, audio: false};
        this.rtcMultiConnection.trickleIce = true;

        this.rtcMultiConnection.sdpConstraints.mandatory = {OfferToReceiveAudio: true, OfferToReceiveVideo: true};
        this.rtcMultiConnection.maxParticipantsAllowed = 128;

        this.rtcMultiConnection.enableLogs = arion.logsEnabled;

        this.rtcMultiConnection.onSocketDisconnect = function (e){
            self.onSignalingSocketDisconnect(e, self);
        }
        this.rtcMultiConnection.onstream = function (e){
            self.onMediaShare(e, function (type, stream, extra){
                self.arion.onMediaShared(spaceId, type, true, stream, extra);
            });
        };
        this.rtcMultiConnection.onstreamended = function (e){
            self.onMediaShareEnded(e, function (type, stream){
                self.arion.onMediaShared(spaceId, type, false, stream);
            });
        };
        this.loadSettings();
    }

    joinSpace() {
        let self = this;
        this.rtcMultiConnection.openOrJoin(this.spaceId, function (e) {
            self.activeSession = true;
            self.arion.log('rtc connection established for spaceId:' + self.spaceId);
        });
    }

    dropFromSpace() { // should update once new method is available: https://www.rtcmulticonnection.org/docs/closeSocket/
        let connection = this.rtcMultiConnection;
        this.activeSession = false;

        // stop all local cameras
        connection.attachStreams.forEach(function(localStream) {
            localStream.stop();
        });

        // disconnect with all users
        connection.getAllParticipants().forEach(function(pid) {
            connection.disconnectWith(pid);
        });

        setTimeout(function (){
            connection.closeSocket();
        }, 50);
    }

    onSignalingSocketDisconnect(e, me) {
        me.arion.onLiveSpaceConnectionBroke(me.spaceId);
    }

    onMediaShare(e, callback) {
        let self = this;
        setTimeout(function (){

            let type = self.getStreamType(e.stream);
            self.arion.spaces[self.spaceId].participants[e.extra.u_uid].devices[e.extra.resource_id].streams[type] = e.stream;

            setTimeout(function () {
                if(self.activeSession) {
                    callback(type, e.stream, e.extra);
                }
            }, 20);
        }, 20);
    }

    onMediaShareEnded(e, callback) {
        let self = this;
        setTimeout(function (){

            let type = self.getStreamType(e.stream);

            self.arion.spaces[self.spaceId].participants[e.extra.u_uid].devices[e.extra.resource_id].streams[type] = null;

            setTimeout(function () {
                callback(type, e.stream);
            }, 20);
        }, 20);
    }

    shareAudio(){
        if(!this.activeSession){
            throw new Error('You must open Live session. Call joinLive() first.');
        }
        if (!this.rtcStreamCommandIssued) {
            let self = this;
            this.rtcStreamCommandIssued = true;
            this.audioStarted = true;

            let stereo = this.arion.signalerParams.settings.stereoAudio;
            let browserProcessing = this.arion.signalerParams.settings.browserAudioProcessing;

            this.rtcMultiConnection.mediaConstraints = {video: false, audio: true};
            if (stereo || !browserProcessing) {
                let audioConstraints = {};
                if (stereo) {
                    audioConstraints.channelCount = {'exact': 2};
                }
                if (!browserProcessing) {
                    audioConstraints.echoCancellation = false;
                    audioConstraints.autoGainControl = false;
                    audioConstraints.noiseSuppression = false;
                }
                this.rtcMultiConnection.mediaConstraints = {video: false, audio: audioConstraints};
            }

            this.rtcMultiConnection.addStream({
                audio: true,
                video: false,
                streamCallback: function (stream) {
                    self.audioStreamId = stream.streamid;
                    self.unsetCommandIssuedFlag();
                }
            });
        } else {
            setTimeout(this.shareAudio, 1000);
        }
    }

    stopAudio() {
        let self = this;
        this.audioStarted = false;
        this.rtcMultiConnection.attachStreams.forEach(function(stream) {
            if(stream.streamid === self.audioStreamId) {
                stream.stop(); // will fire onstreamended
            }
        });
    }

    shareVideo(){
        if(!this.activeSession){
            throw new Error('You must open Live session. Call joinLive() first.');
        }
        if (!this.rtcStreamCommandIssued) {
            let self = this;
            this.rtcStreamCommandIssued = true;
            this.videoStarted = true;

            let constrains = {
                width: this.arion.signalerParams.settings.videoSettings.width,
                height: this.arion.signalerParams.settings.videoSettings.height,
                frameRate: this.arion.signalerParams.settings.videoSettings.frameRate
            };

            this.rtcMultiConnection.mediaConstraints = {video: constrains, audio: false};

            this.rtcMultiConnection.addStream({
                video: true,
                audio: false,
                streamCallback: function (stream) {
                    self.videoStreamId = stream.streamid;
                    self.unsetCommandIssuedFlag();
                }
            });
        } else {
            setTimeout(this.shareVideo, 1000);
        }
    }

    stopVideo() {
        let self = this;
        this.videoStarted = false;
        this.rtcMultiConnection.attachStreams.forEach(function(stream) {
            if(stream.streamid === self.videoStreamId) {
                stream.stop();
            }
        });
    }

    shareScreen() {
        if(!this.activeSession){
            throw new Error('You must open Live session. Call joinLive() first.');
        }
        if (!this.rtcStreamCommandIssued) {
            let self = this;
            this.rtcStreamCommandIssued = true;
            this.screenStarted = true;

            this.rtcMultiConnection.addStream({
                screen: true,
                streamCallback: function (stream) {
                    self.screenStreamId = stream.streamid;
                    self.unsetCommandIssuedFlag();
                }
            });
        } else {
            setTimeout(this.shareScreen, 1000);
        }
    }

    stopScreen() {
        let self = this;
        this.screenStarted = false;

        this.rtcMultiConnection.attachStreams.forEach(function(stream) {
            if(stream.streamid === self.screenStreamId) {
                stream.stop();
            }
        });
    }

    /**
     * Modifies sdp (rtc session description) packets information about bandwidth, etc.
     * */
    loadSettings(){
        let BandwidthHandler = this.rtcMultiConnection.BandwidthHandler;

        let videoBandwidth = this.arion.signalerParams.settings.bandwidth.video;
        let audioBandwidth = this.arion.signalerParams.settings.bandwidth.audio;
        let stereo = this.arion.signalerParams.settings.stereoAudio;

        this.rtcMultiConnection.processSdp = function(sdp) {
            sdp = BandwidthHandler.setVideoBitrates(sdp, {min: videoBandwidth, max: videoBandwidth});
            sdp = BandwidthHandler.setApplicationSpecificBandwidth(sdp, videoBandwidth);

            let highBandwidthAudio = audioBandwidth > 128;
            if(audioBandwidth > 512){
                audioBandwidth = 512;
            }

            // OPUS RTP payload structure @ https://tools.ietf.org/html/draft-ietf-payload-rtp-opus-11
            sdp = BandwidthHandler.setOpusAttributes(sdp, {
                'stereo': stereo,
                'maxaveragebitrate': audioBandwidth * 1024,
                'maxplaybackrate': audioBandwidth * 1024,
                'cbr': highBandwidthAudio ? 1 : 0,
                'usedtx': highBandwidthAudio ? 0 : 1, // https://stackoverflow.com/questions/39718307/how-to-use-opus-dtx-from-opensource-opus-demo-binary
                'minptime': 5,
                //'maxptime': 3 // Max PlayTime for single encoded packet https://tools.ietf.org/html/rfc4855
                //'useinbandfec': 1, // https://stackoverflow.com/questions/46819965/what-does-useinbandfec-is-a-unidirectional-receive-only-parameter-mean-in-opus
            });

            return sdp;
        };
    }

    unsetCommandIssuedFlag() {
        let self = this;
        setTimeout(function (){
            self.rtcStreamCommandIssued = false;
        }, 200);
    }

    getStreamType(stream) {
        let instance = JSON.parse(stream.idInstance);
        if(instance.isScreen){
            return 'screen';
        }
        else if(instance.isVideo) {
            return 'video';
        }
        else{
            return 'audio';
        }
    }
}

export {
    RtcSpace,
}