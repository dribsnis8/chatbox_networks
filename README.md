the client makes a request to the server with the a header 'connection: upgrade' to initiate the WebSocket handshake.

```javascript 
const socket = new WebSocket('ws://127.0.0.1:3000');
```

The server responds with a status code 101 (Switching Protocols) and includes the 'upgrade' header in its response to confirm the protocol switch.
it also provides a 'sec-websocket-accept' header, which is a base64-encoded value derived from the client's 'sec-websocket-key' header.


```javascript
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
});
```
when a client sent a message, the server reads the incoming data frame, decodes it according to the WebSocket framing protocol, and processes the payload.

```javascript
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
```

# why has must the server decode the message according to the WebSocket framing protocol?
an incoming message does not only have the massge so if you use the raw data you will get somthing unreadable.

the frame will look like this:
```
| Field                       | Size         | Description |
|-------------------------------|------------|-------------|
| FIN                          | 1 bit      | Final frame flag |
| RSV1, RSV2, RSV3             | 1 bit each | Reserved for extensions |
| Opcode                        | 4 bits     | Defines frame type (text, binary, close, ping, pong) |
| MASK                          | 1 bit      | 1 if payload is masked (client → server) |
| Payload length                | 7 bits     | Length of payload (126 → 16-bit extended, 127 → 64-bit extended) |
| Extended payload length       | 0, 2, or 8 bytes | If payload length ≥ 126 |
| Masking key                   | 0 or 4 bytes | Only if MASK = 1 |
| Payload data                  | Variable    | Actual message content |
```

this is why we need to decode the message.
first we have to know if it is even a massage a user wants to send or if its a control frame like a ping or a close frame.
thats why we check the opcode. if its 0x8 we just return.

the acctal decoding looks like this:
```javascript
function decodeMessage(buffer) {
  const secondByte = buffer[1];

  // Extract the payload length by ignoring the top MASK bit.
  const length = secondByte & 127; // actual payload length or indicator for extended length

  // Determine where the 4-byte MASK key starts. this depends on the length of the message
  let maskStart = 2;
  if (length === 126) maskStart = 4;
  if (length === 127) maskStart = 10;


  const mask = buffer.slice(maskStart, maskStart + 4);
  const messageStart = maskStart + 4;
  const message = buffer.slice(messageStart);

  // a buffer stores binary data
  const unmasked = Buffer.alloc(message.length);

  // The mask repeats every 4 bytes, so we use 'i % 4' to cycle through the key.
  for (let i = 0; i < message.length; i++) {
    unmasked[i] = message[i] ^ mask[i % 4];
  }
  return unmasked.toString();
}
```
first we get the second byte of the buffer to extract the payload length.

1. **`secondByte`**: This is the second byte of the WebSocket frame, which contains:
    - The most significant bit (MSB) indicating whether the payload is masked (1 bit).
    - The remaining 7 bits representing the payload length or an indicator for extended length.

2. **`& 127`**: The bitwise AND operation (`&`) is used to mask out the MSB (the masking bit) and retain only the lower 7 bits. The value `127` in binary is `01111111`, which ensures that only the last 7 bits of `secondByte` are preserved.

3. **Result**: The extracted value (`length`) represents:
    - The actual payload length if it is less than 126.
    - An indicator for extended payload length (126 or 127) if the payload is larger.

then we determine where the masking key starts based on the length of the payload. so we can extract the mask and the actual message.
then we create a new buffer to store the unmasked message.

finally we loop through each byte of the message and apply the XOR operation between the message byte and the corresponding mask byte (cycling through the mask using `i % 4`), effectively unmasking the payload.

the only thing left is to send the message to all connected clients.
```javascript
function sendMessage(socket, msg) {
  const msgBuffer = Buffer.from(msg);
  const frame = [
    129, // 10000001 (text)
    msgBuffer.length,
    ...msgBuffer
  ];
  socket.write(Buffer.from(frame));
}
```

this function constructs a WebSocket frame to send a text message to a client.
and we do this for each client in the clients set.
```javascript
      for (const client of clients) {
        sendMessage(client, message);
      }
```

