const WebSocket = require("ws");
const express = require("express");
const app = express();

/*
 * WebServer
 */
app.use(express.static(__dirname + "/public"));

app.listen(3000, "0.0.0.0", function() {
  console.log("WebServer listening on port 3000!");
});

/*
 * WebSocket server
 */

const wss = new WebSocket.Server({ port: 2222, host: "0.0.0.0" }, () => {
  console.log("WebSocket server listening on port 2222");
});

const offers = new Map();

function generateUID() {
  let firstPart = (Math.random() * 46656) | 0;
  let secondPart = (Math.random() * 46656) | 0;
  firstPart = ("000" + firstPart.toString(36)).slice(-3);
  secondPart = ("000" + secondPart.toString(36)).slice(-3);
  return firstPart + secondPart;
}

wss.on("connection", function connection(ws) {
  ws.on("message", function incoming(data) {
    const request = JSON.parse(data);
    let offer;
    //console.log(data);
    switch (request.type) {
      case "offer":
        request.ws = ws;
        const token = generateUID();
        console.log(`New offer! JoinToken: ${token}`);
        offers.set(token, request);
        ws.send(JSON.stringify({ type: "joinToken", joinToken: token }));
        break;
      case "join":
        console.log(`Want to join: ${request.joinToken}`);
        offer = offers.get(request.joinToken);
        if (offer) {
          const msg = Object.assign({}, offer);
          delete msg.ws;
          ws.send(JSON.stringify(msg));
        } else {
          ws.send(JSON.stringify({ error: "Wrong joinToken" }));
        }
        break;
      case "answer":
        console.log("Answer!");
        offer = offers.get(request.joinToken);
        if (offer) {
          delete request.joinToken;
          offer.ws.send(JSON.stringify(request));
        }
        break;
    }
  });
});
