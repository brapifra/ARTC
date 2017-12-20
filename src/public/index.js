const peer = new RTCPeerConnection();
const audio = document.querySelector("audio");
let token;

const ws = new WebSocket("ws://192.168.0.15:2222");
ws.onerror = e => {
  console.error(e);
};
ws.onmessage = function incoming(message) {
  const response = JSON.parse(message.data);
  //console.log(response);
  switch (response.type) {
    case "joinToken":
      document.getElementById("joinToken").innerHTML = `Join Token: ${
        response.joinToken
      }`;
      break;
    case "offer":
      receiveStream(response);
      break;
    case "answer":
      peer.setRemoteDescription(new RTCSessionDescription(response));
      break;
    case "error":
      console.error(response.error);
      break;
  }
};

function startBroadcasting() {
  navigator.mediaDevices
    .getUserMedia({
      video: false,
      audio: {
        channelCount: { ideal: 2, min: 1 },
        latency: { ideal: 0 },
        sampleRate: 44000,
        sampleSize: 16
      }
    })
    .then(stream => {
      sendStream(stream);
    })
    .catch(error => {
      console.error(error.message);
    });
}

function startReceiving() {
  token = prompt("Please enter the join token:");
  if (!token) {
    return;
  }
  ws.send(
    JSON.stringify({
      type: "join",
      joinToken: token
    })
  );
}

function sendStream(stream) {
  peer.onicecandidate = e => {
    if (e.candidate === null) {
      ws.send(JSON.stringify(peer.localDescription));
    }
  };

  peer.addStream(stream);
  peer
    .createOffer({
      offerToReceiveVideo: false,
      offerToReceiveAudio: false
    })
    .then(function(offer) {
      return peer.setLocalDescription(new RTCSessionDescription(offer));
    })
    .catch(j => console.error(j));
}

function receiveStream(offer) {
  peer.onicecandidate = e => {
    if (e.candidate === null) {
      const answer = Object.assign(
        {},
        JSON.parse(JSON.stringify(peer.localDescription))
      );
      answer.joinToken = token;
      ws.send(JSON.stringify(answer));
    }
  };

  peer.ontrack = track => {
    audio.srcObject = track.streams[0];
    audio.play();
    console.log("Audio stream ready!");
  };
  peer.onaddstream = e => {
    audio.srcObject = e.stream;
    audio.play();
    console.log("Audio stream ready!");
  };

  peer
    .setRemoteDescription(new RTCSessionDescription(offer))
    .then(() => {
      peer
        .createAnswer()
        .then(function(offer) {
          audio.style.visibility = "visible";
          return peer.setLocalDescription(new RTCSessionDescription(offer));
        })
        .catch(e => console.error(e));
    })
    .catch(e => console.error(e));
}
