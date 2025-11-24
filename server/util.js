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

function sendMessage(socket, msg) {
  const msgBuffer = Buffer.from(msg);
  const frame = [
    129, // 10000001 (text)
    msgBuffer.length,
    ...msgBuffer
  ];
  socket.write(Buffer.from(frame));
}

function removeClient(socket, clients) {
  const index = clients.indexOf(socket);
  if (index !== -1) clients.splice(index, 1);
}

export { decodeMessage, sendMessage, removeClient };