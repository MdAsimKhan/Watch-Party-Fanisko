// // // old streamAR function

// // //function to load image
// // function loadImage(url) {
// //   return new Promise((resolve, reject) => {
// //     const image = new Image();
// //     image.onload = function () {
// //       resolve(image);
// //       console.log('herre---3 STart__STREAMING', image);
// //     };
// //     image.onerror = function () {
// //       reject(new Error('Failed to load image: ' + url));
// //     };
// //     image.src = url;
// //   });
// // }

// // //calling the image load fn
// // loadImage('/sunglasses.png')
// //   .then((image) => {
// //     // Image has finished loading
// //     // Now you can safely draw it on the canvas
// //     setInterval(async () => {
// //       console.log('herre---4 STart__STREAMING');
// //       const detections = await faceapi
// //         .detectAllFaces(videoElement, new faceapi.TinyFaceDetectorOptions())
// //         .withFaceLandmarks()
// //         .withFaceExpressions();

// //       const resizedDetections = faceapi.resizeResults(detections, displaySize);
// //       console.log('herre---5 STart__STREAMING');
// //       canvasElement
// //         .getContext('2d')
// //         .clearRect(0, 0, canvasElement.width, canvasElement.height);
// //       faceapi.draw.drawDetections(canvasElement, resizedDetections);
// //       faceapi.draw.drawFaceLandmarks(canvasElement, resizedDetections);
// //       faceapi.draw.drawFaceExpressions(canvasElement, resizedDetections);

// //       resizedDetections.forEach((result) => {
// //         const { x, y, width } = result.detection.box;
// //         canvasElement
// //           .getContext('2d')
// //           .drawImage(
// //             image,
// //             x,
// //             y + 30,
// //             width,
// //             width * (image.height / image.width)
// //           );
// //       });

// //       // const canvasStream = canvasElement.captureStream(30);
// //       // const videoStream = videoElement.srcObject;

// //       // // Create a new MediaStream object and add the canvas and video tracks to it
// //       // const combinedStream = new MediaStream();
// //       // canvasStream.getTracks().forEach((track) => {
// //       //   combinedStream.addTrack(track);
// //       // });
// //       // videoStream.getTracks().forEach((track) => {
// //       //   combinedStream.addTrack(track);
// //       // });

// //       // window.watchparty.ourStream = combinedStream;
// //       // console.log('COMBINED__STREAM', combinedStream);

// //       const canvasStream = canvasElement.captureStream(30);
// //       const videoStream = videoElement.srcObject;

// //       // Create a new MediaStream object and add the canvas and cloned video tracks to it
// //       const combinedStream = new MediaStream();
// //       canvasStream.getTracks().forEach((track) => {
// //         combinedStream.addTrack(track);
// //       });
// //       videoStream.getTracks().forEach((track) => {
// //         const clonedTrack = track.clone();
// //         combinedStream.addTrack(clonedTrack);
// //       });

// //       window.watchparty.ourStream = combinedStream;
// //       console.log('COMBINED__STREAM', combinedStream);
// //       this.socket.emit('CMD:joinVideo');

// //       console.log(
// //         'in setup of mindAR2-->',

// //         window.watchparty,
// //         combinedStream
// //       );

// //       // Send the combined stream to the other peer using the appropriate method or library for your WebRTC implementation
// //       // e.g., this.socket.emit('CMD:sendCombinedStream', combinedStream);
// //     }, 1000);

// //     this.emitUserMute();
// //     //       // alert server we've joined video chat
// //   })
// //   .catch((error) => {
// //     console.log(error);
// //   });

// // // image.src = './public/img/sunglasses-style.png'; // Replace with the path to your image

// // // image.onload = () => {

// // // };

// updateWebRTC = () => {
//     console.log('updateweb--->', this.ar);

//     const ourStream = window.watchparty.ourStream;
//     const videoPCs = window.watchparty.videoPCs;
//     const videoRefs = window.watchparty.videoRefs;
//     console.log('current__stream-->', ourStream, videoRefs);
//     if (!ourStream) {
//       // We haven't started video chat, exit
//       return;
//     }
//     const selfId = getAndSaveClientId();

//     // Delete and close any connections that aren't in the current member list (maybe someone disconnected)
//     // This allows them to rejoin later
//     const clientIds = new Set(
//       this.props.participants
//         .filter((p) => p.isVideoChat)
//         .map((p) => p.clientId)
//     );
//     Object.entries(videoPCs).forEach(([key, value]) => {
//       if (!clientIds.has(key)) {
//         value.close();
//         delete videoPCs[key];
//       }
//     });

//     this.props.participants.forEach((user) => {
//       const id = user.clientId;
//       if (!user.isVideoChat || videoPCs[id]) {
//         console.log('cheking streams--->', 1);
//         // User isn't in video chat, or we already have a connection to them
//         return;
//       }
//       if (id === selfId) {
//         console.log('cheking streams--->', 2);
//         videoPCs[id] = new RTCPeerConnection();
//         videoRefs[id].srcObject = ourStream;
//       } else {
//         console.log('cheking streams--->', 6);
//         const pc = new RTCPeerConnection({ iceServers: iceServers() });
//         videoPCs[id] = pc;
//         // Add our own video as outgoing stream
//         ourStream?.getTracks().forEach((track) => {
//           if (ourStream) {
//             console.log('cheking streams--->3', track);
//             pc.addTrack(track, ourStream);
//           }
//         });
//         pc.onicecandidate = (event) => {
//           // We generated an ICE candidate, send it to peer
//           if (event.candidate) {
//             this.sendSignal(id, { ice: event.candidate });
//           }
//         };
//         pc.ontrack = (event: RTCTrackEvent) => {
//           // Mount the stream from peer
//           console.log(event);
//           videoRefs[id].srcObject = event.streams[0];
//           console.log('checking streams--->4', event, videoRefs[id].srcObject);
//         };
//         // For each pair, have the lexicographically smaller ID be the offerer
//         const isOfferer = selfId < id;
//         if (isOfferer) {
//           pc.onnegotiationneeded = async () => {
//             // Start connection for peer's video
//             const offer = await pc.createOffer();
//             await pc.setLocalDescription(offer);
//             this.sendSignal(id, { sdp: pc.localDescription });
//           };
//         }
//       }
//     });
//   };
