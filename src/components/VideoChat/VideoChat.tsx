// @ts-nocheck
import React from 'react';
import { Button, Icon } from 'semantic-ui-react';
import { Socket } from 'socket.io-client';
import { MindARThree } from 'mind-ar/dist/mindar-image-three.prod.js';
import * as THREE from 'three';

import {
  formatTimestamp,
  getAndSaveClientId,
  getColorForStringHex,
  getDefaultPicture,
  iceServers,
} from '../../utils';
import { UserMenu } from '../UserMenu/UserMenu';
import firebase from 'firebase/compat/app';

interface VideoChatProps {
  socket: Socket;
  participants: User[];
  pictureMap: StringDict;
  nameMap: StringDict;
  tsMap: NumberDict;
  rosterUpdateTS: Number;
  hide?: boolean;
  owner: string | undefined;
  user: firebase.User | undefined;
  beta: boolean;

  // containerRef: React.RefObject<HTMLDivElement>;
  // useEffect: () => any;
  getLeaderTime: () => number;
}

export class VideoChat extends React.Component<VideoChatProps> {
  socket = this.props.socket;
  containerRef = React.createRef<HTMLDivElement>();
  mindARInitialized = false;
  mindarThree: MindARThree;

  initializeMindAR = () => {
    //removing the video earlier
    this.stopWebRTC();
    this.mindARInitialized = true;
    console.log('here-mindar');
    const mindarThree = new MindARThree({
      container: this.containerRef.current,
      imageTargetSrc:
        'https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.0/examples/image-tracking/assets/card-example/card.mind',
    });
    const { renderer, scene, camera } = mindarThree;
    const anchor = mindarThree.addAnchor(0);
    const geometry = new THREE.PlaneGeometry(1, 0.55);
    const material = new THREE.MeshBasicMaterial({
      color: 0x000,
      transparent: true,
      opacity: 0.5,
    });

    // create a geometry
    const geometry2 = new THREE.BoxBufferGeometry(2, 2, 2);

    // create a Mesh containing the geometry and material
    const cube = new THREE.Mesh(geometry2, material);

    // add the mesh to the scene
    anchor.group.add(cube);
    const plane = new THREE.Mesh(geometry, material);
    anchor.group.add(plane);

    mindarThree.start();

    let stream = renderer.domElement.captureStream(30);

    window.watchparty.ourStream = stream;
    console.log(
      'in setup of mindAR-->',
      renderer.domElement,
      stream,
      window.watchparty
    );
    // alert server we've joined video chat
    this.socket.emit('CMD:joinVideo');
    this.emitUserMute();

    console.log(stream, 'stream');

    renderer.setAnimationLoop(() => {
      renderer.render(scene, camera);
    });

    return () => {
      renderer.setAnimationLoop(null);
      mindarThree.stop();
    };
  };

  start = () => {
    if (!this.frameId) {
      this.frameId = requestAnimationFrame(this.animate);
    }
  };
  stop = () => {
    cancelAnimationFrame(this.frameId);
  };
  animate = () => {
    //Animate Models Here
    //ReDraw Scene with Camera and Scene Object
    this.renderScene();
    this.frameId = window.requestAnimationFrame(this.animate);
  };
  renderScene = () => {
    if (this.renderer) this.renderer.render(this.scene, this.camera);
  };

  componentDidMount() {
    console.log(window);
    this.socket.on('signal', this.handleSignal);
    // this.initializeMindAR();
  }

  componentWillUnmount() {
    this.socket.off('signal', this.handleSignal);
  }

  componentDidUpdate(prevProps: VideoChatProps) {
    if (this.props.rosterUpdateTS !== prevProps.rosterUpdateTS) {
      this.updateWebRTC();
    }
  }

  emitUserMute = () => {
    this.socket.emit('CMD:userMute', { isMuted: !this.getAudioWebRTC() });
  };

  handleSignal = async (data: any) => {
    // Handle messages received from signaling server
    const msg = data.msg;
    const from = data.from;
    const pc = window.watchparty.videoPCs[from];
    console.log('recv handleSignal', from, data, pc, window.watchparty);
    if (msg.ice !== undefined) {
      pc.addIceCandidate(new RTCIceCandidate(msg.ice));
    } else if (msg.sdp && msg.sdp.type === 'offer') {
      // console.log('offer');
      await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      this.sendSignal(from, { sdp: pc.localDescription });
    } else if (msg.sdp && msg.sdp.type === 'answer') {
      pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
    }
  };

  setupWebRTC = async () => {
    // Set up our own video
    // Create default stream
    console.log('setupweb');
    let black = ({ width = 640, height = 480 } = {}) => {
      // let scene = new THREE.Scene();
      // //Add Renderer
      // let renderer = new THREE.WebGLRenderer({ antialias: true });
      // renderer.setClearColor('#263238');
      // renderer.setSize(window.innerWidth, window.innerHeight);

      // //add Camera
      // let camera = new THREE.PerspectiveCamera(
      //   75,
      //   window.innerWidth / window.innerHeight,
      //   0.1,
      //   1000
      // );
      // camera.position.z = 8;
      // camera.position.y = 5;
      // //Camera Controls

      // //LIGHTS
      // // create a geometry
      // const geometry2 = new THREE.BoxBufferGeometry(2, 2, 2);

      // // create a default (white) Basic material
      // const material2 = new THREE.MeshBasicMaterial();

      // // create a Mesh containing the geometry and material
      // const cube = new THREE.Mesh(geometry2, material2);

      // scene.add(cube);

      // //ADD Your 3D Models here
      // this.renderScene();
      // //start animation
      // this.start();
      let canvas: any = Object.assign(document.createElement('canvas'), {
        width,
        height,
      });
      // let test = new THREE.VideoTexture(canvas);
      // scene.background = test;
      //  canvas.appendChild(renderer.domElement);
      // canvas.style.position = 'absolute';

      // renderer.domElement.style.position = 'absolute';
      // console.log(renderer.domElement);
      canvas.getContext('2d')?.fillRect(0, 0, width, height);
      let stream = canvas.captureStream();
      return Object.assign(stream.getVideoTracks()[0], { enabled: false });
    };
    let stream = new MediaStream([black()]);

    try {
      stream = await navigator?.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
    } catch (e) {
      console.warn(e);
      try {
        console.log('attempt audio only stream');
        stream = await navigator?.mediaDevices?.getUserMedia({
          audio: true,
          video: false,
        });
      } catch (e) {
        console.warn(e);
      }
    }
    window.watchparty.ourStream = stream;
    console.log(stream, window.watchparty, 'in setup');
    // alert server we've joined video chat
    this.socket.emit('CMD:joinVideo');
    this.emitUserMute();
  };

  stopWebRTC = () => {
    console.log('stopweb');
    const ourStream = window.watchparty.ourStream;
    const videoPCs = window.watchparty.videoPCs;
    ourStream &&
      ourStream.getTracks().forEach((track) => {
        track.stop();
      });
    window.watchparty.ourStream = undefined;
    Object.keys(videoPCs).forEach((key) => {
      videoPCs[key].close();
      delete videoPCs[key];
    });
    console.log(window.watchparty, 'stop');
    this.socket.emit('CMD:leaveVideo');
  };

  toggleVideoWebRTC = () => {
    console.log('toggle');
    const ourStream = window.watchparty.ourStream;
    if (ourStream && ourStream.getVideoTracks()[0]) {
      ourStream.getVideoTracks()[0].enabled =
        !ourStream.getVideoTracks()[0]?.enabled;
    }
    this.forceUpdate();
  };

  getVideoWebRTC = () => {
    console.log('getvideo');
    const ourStream = window.watchparty.ourStream;
    return ourStream && ourStream.getVideoTracks()[0]?.enabled;
  };

  toggleAudioWebRTC = () => {
    const ourStream = window.watchparty.ourStream;
    if (ourStream && ourStream.getAudioTracks()[0]) {
      ourStream.getAudioTracks()[0].enabled =
        !ourStream.getAudioTracks()[0]?.enabled;
    }
    this.emitUserMute();
    this.forceUpdate();
  };

  getAudioWebRTC = () => {
    const ourStream = window.watchparty.ourStream;
    return (
      ourStream &&
      ourStream.getAudioTracks()[0] &&
      ourStream.getAudioTracks()[0].enabled
    );
  };

  updateWebRTC = () => {
    console.log('updateweb');

    const ourStream = window.watchparty.ourStream;
    const videoPCs = window.watchparty.videoPCs;
    const videoRefs = window.watchparty.videoRefs;
    console.log('current__stream-->', ourStream, videoRefs);
    if (!ourStream) {
      // We haven't started video chat, exit
      return;
    }
    const selfId = getAndSaveClientId();

    // Delete and close any connections that aren't in the current member list (maybe someone disconnected)
    // This allows them to rejoin later
    const clientIds = new Set(
      this.props.participants
        .filter((p) => p.isVideoChat)
        .map((p) => p.clientId)
    );
    Object.entries(videoPCs).forEach(([key, value]) => {
      if (!clientIds.has(key)) {
        value.close();
        delete videoPCs[key];
      }
    });

    this.props.participants.forEach((user) => {
      const id = user.clientId;
      if (!user.isVideoChat || videoPCs[id]) {
        console.log('cheking streams--->', 1);
        // User isn't in video chat, or we already have a connection to them
        return;
      }
      if (id === selfId) {
        console.log('cheking streams--->', 2);
        videoPCs[id] = new RTCPeerConnection();
        videoRefs[id].srcObject = ourStream;
      } else {
        console.log('cheking streams--->', 6);
        const pc = new RTCPeerConnection({ iceServers: iceServers() });
        videoPCs[id] = pc;
        // Add our own video as outgoing stream
        ourStream?.getTracks().forEach((track) => {
          if (ourStream) {
            console.log('cheking streams--->3', track);
            pc.addTrack(track, ourStream);
          }
        });
        pc.onicecandidate = (event) => {
          // We generated an ICE candidate, send it to peer
          if (event.candidate) {
            this.sendSignal(id, { ice: event.candidate });
          }
        };
        pc.ontrack = (event: RTCTrackEvent) => {
          // Mount the stream from peer
          // console.log(stream);
          videoRefs[id].srcObject = event.streams[0];
          console.log('checking streams--->4', event, videoRefs[id].srcObject);
        };
        // For each pair, have the lexicographically smaller ID be the offerer
        const isOfferer = selfId < id;
        if (isOfferer) {
          pc.onnegotiationneeded = async () => {
            // Start connection for peer's video
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            this.sendSignal(id, { sdp: pc.localDescription });
          };
        }
      }
    });
  };

  sendSignal = async (to: string, data: any) => {
    console.log('send', to, data);
    this.socket.emit('signal', { to, msg: data });
  };

  render() {
    const { participants, pictureMap, nameMap, tsMap, socket, owner, user } =
      this.props;
    const ourStream = window.watchparty.ourStream;
    const videoRefs = window.watchparty.videoRefs;
    const videoChatContentStyle = {
      height: participants.length < 3 ? 220 : 110,
      borderRadius: '4px',
      objectFit: 'contain' as any, // ObjectFit
    };
    const selfId = getAndSaveClientId();
    console.log('participants==>', participants);
    return (
      <div
        style={{
          display: this.props.hide ? 'none' : 'flex',
          width: '100%',
          flexDirection: 'column',
          overflow: 'auto',
        }}
      >
        {!ourStream && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              marginTop: '8px',
            }}
          >
            <Button
              fluid
              title="Join Video Chat"
              color={'purple'}
              size="medium"
              icon
              labelPosition="left"
              onClick={this.setupWebRTC}
            >
              <Icon name="video" />
              {`Join Video Chat`}
            </Button>
          </div>
        )}
        {ourStream && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
            }}
          >
            <Button
              fluid
              color={'red'}
              size="medium"
              icon
              labelPosition="left"
              onClick={this.stopWebRTC}
            >
              <Icon name="external" />
              {`Leave Video Chat`}
            </Button>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginTop: '8px',
                width: '100%',
              }}
            >
              <Button
                color={this.getVideoWebRTC() ? 'green' : 'red'}
                fluid
                size="medium"
                icon
                labelPosition="left"
                onClick={this.toggleVideoWebRTC}
              >
                <Icon name="video" />
                {this.getVideoWebRTC() ? 'On' : 'Off'}
              </Button>
              <Button
                color={this.getAudioWebRTC() ? 'green' : 'red'}
                fluid
                size="medium"
                icon
                labelPosition="left"
                onClick={this.toggleAudioWebRTC}
              >
                <Icon
                  name={
                    this.getAudioWebRTC() ? 'microphone' : 'microphone slash'
                  }
                />
                {this.getAudioWebRTC() ? 'On' : 'Off'}
              </Button>
              <Button
                color="green"
                fluid
                size="medium"
                icon
                labelPosition="left"
                onClick={this.initializeMindAR}
              >
                MindAR
              </Button>
            </div>
          </div>
        )}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            marginTop: '8px',
          }}
          ref={this.containerRef}
        >
          {participants.map((p) => {
            return (
              <div key={p.id}>
                <div
                  style={{
                    position: 'relative',
                    //marginLeft: '4px',
                  }}
                >
                  <div>
                    <UserMenu
                      displayName={nameMap[p.id] || p.id}
                      user={user}
                      disabled={!Boolean(owner && owner === user?.uid)}
                      position={'left center'}
                      socket={socket}
                      userToManage={p.id}
                      trigger={
                        <Icon
                          name="ellipsis vertical"
                          size="large"
                          style={{
                            position: 'absolute',
                            right: -7,
                            top: 5,
                            cursor: 'pointer',
                            opacity: 0.75,
                            visibility: Boolean(owner && owner === user?.uid)
                              ? 'visible'
                              : 'hidden',
                          }}
                        />
                      }
                    />
                    {ourStream && p.isVideoChat && this.mindARInitialized ? (
                      <video
                        ref={this.containerRef}
                        style={{
                          ...videoChatContentStyle,
                          // mirror the video if it's our stream. this style mimics Zoom where your
                          // video is mirrored only for you)
                          transform: `scaleX(${
                            p.clientId === selfId ? '-1' : '1'
                          })`,
                        }}
                        autoPlay
                        muted={p.clientId === selfId}
                        data-id={p.id}
                      />
                    ) : ourStream && p.isVideoChat ? (
                      <video
                        ref={(el) => {
                          if (el) {
                            videoRefs[p.clientId] = el;
                          }
                        }}
                        style={{
                          ...videoChatContentStyle,
                          // mirror the video if it's our stream. this style mimics Zoom where your
                          // video is mirrored only for you)
                          transform: `scaleX(${
                            p.clientId === selfId ? '-1' : '1'
                          })`,
                        }}
                        autoPlay
                        muted={p.clientId === selfId}
                        data-id={p.id}
                      />
                    ) : (
                      <img
                        style={videoChatContentStyle}
                        src={
                          pictureMap[p.id] ||
                          getDefaultPicture(
                            nameMap[p.id],
                            getColorForStringHex(p.id)
                          )
                        }
                        alt=""
                      />
                    )}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '4px',
                        left: '0px',
                        width: '100%',
                        backgroundColor: 'rgba(0,0,0,0)',
                        color: 'white',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 700,
                        display: 'flex',
                      }}
                    >
                      <div
                        title={nameMap[p.id] || p.id}
                        style={{
                          width: '80px',
                          backdropFilter: 'brightness(80%)',
                          padding: '4px',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          display: 'inline-block',
                        }}
                      >
                        {p.isScreenShare && (
                          <Icon size="small" name="slideshare" />
                        )}
                        {p.isVideoChat && <Icon size="small" name="video" />}
                        {p.isMuted && (
                          <Icon
                            size="large"
                            name="microphone slash"
                            color="red"
                          />
                        )}
                        {nameMap[p.id] || p.id}
                      </div>
                      <div
                        style={{
                          backdropFilter: 'brightness(60%)',
                          padding: '4px',
                          flexGrow: 1,
                          display: 'flex',
                          justifyContent: 'center',
                        }}
                      >
                        {formatTimestamp(tsMap[p.id] || 0)}{' '}
                        {this.props.beta &&
                          `(${(
                            (tsMap[p.id] - this.props.getLeaderTime()) *
                            1000
                          ).toFixed(0)}ms)`}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}
