const socket = io();
const peerVideo = document.getElementById("peerVideo");
const myVideo = document.getElementById("myVideo");

let localStream;
let peerConnection;

navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    myVideo.srcObject = stream;
    localStream = stream;
    socket.emit("join", userId);
  });

socket.on("signal", async ({ from, signal }) => {
  if (!peerConnection) await startCall(from);
  peerConnection.signal(signal);
});

async function startCall(otherUserId) {
  const SimplePeer = (await import("https://cdn.skypack.dev/simple-peer")).default;
  peerConnection = new SimplePeer({
    initiator: true,
    trickle: false,
    stream: localStream
  });

  peerConnection.on("signal", signal => {
    socket.emit("signal", { to: otherUserId, from: userId, signal });
  });

  peerConnection.on("stream", stream => {
    peerVideo.srcObject = stream;
  });
}
