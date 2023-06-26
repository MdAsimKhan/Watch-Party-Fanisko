// @ts-nocheck
import React from 'react';
import { Button, Icon } from 'semantic-ui-react';
import { Socket } from 'socket.io-client';
// not required, but will speed up things drastically (python required)
// import '@tensorflow/tfjs-node';

// implements nodejs wrappers for HTMLCanvasElement, HTMLImageElement, ImageData
import * as createCanvas from 'canvas';
// import { MindARThree } from 'mind-ar/dist/mindar-image-three.prod.js';
import * as faceapi from 'face-api.js';
import { TinyFaceDetectorOptions } from 'face-api.js';
// import * as THREE from 'three';

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
  constructor(props) {
    super(props);
    this.startStreaming = this.startStreaming.bind(this);
    this.videoRef = React.createRef<HTMLVideoElement>();
    this.canvasRef = React.createRef<HTMLCanvasElement>();
  }
  socket = this.props.socket;
  cando = React.createRef<HTMLDivElement>();
  videoRef = React.createRef<HTMLVideoElement>();
  canvasRef = React.createRef<HTMLCanvasElement>();

  ar;
  options = new faceapi.TinyFaceDetectorOptions();

  tryAR = async () => {
    try {
      //removing the video earlier
      this.stopWebRTC();
      this.ar = true;
      console.log('herre---1', this.videoRef);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      this.videoRef.current.srcObject = stream;

      await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
      await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
      await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
      await faceapi.nets.faceExpressionNet.loadFromUri('/models');

      this.startStreaming();
    } catch (error) {
      console.log(error);
    }
  };

  startStreaming = async () => {
    console.log('herre---1 STart__STREAMING');

    const videoElement = this.videoRef.current;
    const canvasElement = this.canvasRef.current;
    const displaySize = {
      width: 200,
      height: 200,
    };

    faceapi.matchDimensions(canvasElement, displaySize);
    console.log('herre---2 STart__STREAMING');
    const image = new Image();
    image.src = './public/img/sunglasses-style.png'; // Replace with the path to your image
    console.log('herre---3 STart__STREAMING', image);
    // image.onload = () => {
    console.log('MANNNN');
    setInterval(async () => {
      console.log('herre---4 STart__STREAMING');
      const detections = await faceapi
        .detectAllFaces(videoElement, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();

      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      console.log('herre---5 STart__STREAMING');
      canvasElement
        .getContext('2d')
        .clearRect(0, 0, canvasElement.width, canvasElement.height);
      faceapi.draw.drawDetections(canvasElement, resizedDetections);
      faceapi.draw.drawFaceLandmarks(canvasElement, resizedDetections);
      faceapi.draw.drawFaceExpressions(canvasElement, resizedDetections);

      resizedDetections.forEach((result) => {
        const { x, y, width } = result.detection.box;
        canvasElement
          .getContext('2d')
          .drawImage(
            image,
            x,
            y + 30,
            width,
            width * (image.height / image.width)
          );
      });
    }, 1000);
    // };
  };

  getFace = async (stream2, options) => {
    const result = await faceapi
      .detectSingleFace(stream2, options)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (result) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx.drawImage(stream2, 0, 0);

      const { image } = faceapi.createCanvasFromMedia(canvas);
      const { faceDetection } = result;
      ctx.drawImage(
        image,
        faceDetection.box.x + 15,
        faceDetection.box.y + 30,
        faceDetection.box.width,
        faceDetection.box.width * (image.height / image.width)
      );

      requestAnimationFrame(step);
    }
  };

  // initializeAR = async () => {
  //   //removing the video earlier
  //   this.stopWebRTC();
  //   this.ar = true;
  //   console.log('herre---1');
  //   let canvas: any = Object.assign(document.createElement('canvas'));
  //   const streamConstraints = { audio: true, video: true };
  //   // const mtcnnForwardParams = {
  //   //   // limiting the search space to larger faces for webcam detection
  //   //   minFaceSize: 200,
  //   // };

  //   //positions for sunglasess
  //   var results = [];

  //   await Promise.all([
  //     faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
  //     faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  //     faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  //     faceapi.nets.faceExpressionNet.loadFromUri('/models'),
  //   ]);

  //   // await faceapi.loadMtcnnModel('/weights');
  //   // await faceapi.loadFaceRecognitionModel('/weights');
  //   await Promise.all([
  //     faceapi.nets.tinyFaceDetector.load('/weights'),
  //     faceapi.nets.faceLandmark68Net.load('/weights'),
  //     faceapi.nets.faceRecognitionNet.load('/weights'),
  //   ]).then((res) => {
  //     console.log(res);
  //   });
  //   console.log('herre---2');
  //   navigator?.mediaDevices
  //     .getUserMedia({ audio: true, video: true })
  //     .then((stream) => {
  //       console.log('STREAM__HERE-->', stream);

  //       let localVideo = document.createElement('video');
  //       localVideo.srcObject = stream;
  //       localVideo.autoplay = true;
  //       localVideo.addEventListener('playing', () => {
  //         let ctx = this.cando.current.getContext('2d');
  //         let image = new Image();
  //         image.src = './public/img/sunglasses-style.png';

  //         function step() {
  //           // getFace(localVideo, TinyFaceDetectorOptions);

  //           async function getFace(
  //             localVideo: HTMLVideoElement,
  //             options: TinyFaceDetectorOptions
  //           ) {
  //             const result = await faceapi
  //               .detectSingleFace(localVideo, options)
  //               .withFaceLandmarks()
  //               .withFaceDescriptor();
  //             if (result) {
  //               results = [result];

  //               ctx.drawImage(localVideo, 0, 0);
  //               results.map((result) => {
  //                 ctx.drawImage(
  //                   image,
  //                   result.faceDetection.box.x + 15,
  //                   result.faceDetection.box.y + 30,
  //                   result.faceDetection.box.width,
  //                   result.faceDetection.box.width *
  //                     (image.height / image.width)
  //                 );
  //               });

  //               requestAnimationFrame(step);
  //             } else {
  //               results = [];
  //             }
  //           }
  //         }

  //         requestAnimationFrame(step);
  //       });
  //       let localStream = this.cando.current.captureStream(30);
  //       window.watchparty.ourStream = localStream;
  //       console.log(
  //         'in setup of mindAR-->',

  //         localStream,
  //         window.watchparty
  //       );
  //       // alert server we've joined video chat
  //       this.socket.emit('CMD:joinVideo');
  //       this.emitUserMute();
  //     })
  //     .catch((err) => {
  //       console.log('ERROR---->', err);
  //     });
  // };
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
    this.ar = false;
    // Set up our own video
    // Create default stream
    console.log('setupweb');
    let black = ({ width = 640, height = 480 } = {}) => {
      let canvas: any = Object.assign(document.createElement('canvas'), {
        width,
        height,
      });

      canvas.getContext('2d')?.fillRect(0, 0, width, height);
      // let ctx = canvas.getContext('2d')?.fillRect(0, 0, width, height);

      let stream = canvas.captureStream();

      // return Object.assign(stream.getVideoTracks()[0], { enabled: false });
      const videoTrack = stream.getVideoTracks()[0];
      videoTrack.enabled = false;

      return videoTrack;
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
    console.log('updateweb--->', this.ar);

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
                onClick={this.tryAR}
              >
                AR
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
        >
          {/* <div className="myapp">
            {console.log('here-in-ar-part')}
            <video
              style={{
                ...videoChatContentStyle,
                // mirror the video if it's our stream. this style mimics Zoom where your
                // video is mirrored only for you)
              }}
              crossOrigin="anonymous"
              ref={this.videoRef}
              autoPlay
            ></video>

            <canvas
              ref={this.canvasRef}
              width="940"
              height="650"
              className="appcanvas"
            ></canvas>
          </div> */}
          {participants.map((p) => {
            console.log('participants==>', p.isVideoChat);
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
                    {this.ar ? (
                      <div className="myapp">
                        {console.log('here-in-ar-part')}
                        <video
                          style={{
                            ...videoChatContentStyle,
                            // mirror the video if it's our stream. this style mimics Zoom where your
                            // video is mirrored only for you)
                            transform: `scaleX(${
                              p.clientId === selfId ? '-1' : '1'
                            })`,
                          }}
                          crossOrigin="anonymous"
                          ref={this.videoRef}
                          autoPlay
                        ></video>

                        <canvas
                          ref={this.canvasRef}
                          width="940"
                          height="650"
                          className="appcanvas"
                        ></canvas>
                      </div>
                    ) : ourStream && p.isVideoChat ? (
                      <video
                        ref={(el) => {
                          if (el) {
                            videoRefs[p.clientId] = el;
                            // this.getFace(videoRefs[p.clientId], this.options);
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
