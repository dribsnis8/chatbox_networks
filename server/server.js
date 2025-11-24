const http = require("http");
const crypto = require("crypto");
const { decodeMessage, sendMessage, removeClient } = require("./util.js");

const server = http.createServer();

const clients = [];

server.on("upgrade", (req, socket) => {
  if (req.headers["upgrade"] !== "websocket") {
    socket.end("HTTP/1.1 400 Bad Request");
    return;
  }


  const key = req.headers["sec-websocket-key"];
  const acceptKey = crypto
    .createHash("sha1")
    .update(key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11")
    .digest("base64");

  const headers = [
    "HTTP/1.1 101 Switching Protocols",
    "Upgrade: websocket",
    "Connection: Upgrade",
    `Sec-WebSocket-Accept: ${acceptKey}`
  ];

  socket.write(headers.join("\r\n") + "\r\n\r\n"); // insures a good formatting of the response
  clients.push(socket);


  socket.on("data", (buffer) => {
    try {
      const firstByte = buffer[0];
      const opcode = firstByte & 0x0f;
      const message = decodeMessage(buffer);
      if (!message || opcode === 0x8) return; //when a client disconnects first bite is = 0x8 we do not want to broadcast that
      console.log("Client says:", message);

      for (const client of clients) {
        sendMessage(client, message);
      }
    } catch (err) {
      console.error("Failed to decode message:", err);
    }
  });


  socket.on('end', () => removeClient(socket, clients));
  socket.on('close', () => removeClient(socket, clients));
  socket.on('error', () => {removeClient(socket, clients);});


});

server.listen(3000, () => {
  console.log("Server running on port 3000");
});