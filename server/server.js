import http from "http";
import crypto from "crypto";
import {
  decodeMessage,
  addUser,
  removeSocket,
  broadcast,
  isRateLimited,
  whisper,
  sendMessage
} from "./utils/mod.js";

const server = http.createServer();
const rooms = {};
const socketMap = new Map();

function handleUpgrade(req, socket) {
  if (req.headers["upgrade"] !== "websocket") {
    socket.end("HTTP/1.1 400 Bad Request");
    return;
  }

  const acceptKey = generateAcceptKey(req.headers["sec-websocket-key"]);
  const headers = [
    "HTTP/1.1 101 Switching Protocols",
    "Upgrade: websocket",
    "Connection: Upgrade",
    `Sec-WebSocket-Accept: ${acceptKey}`
  ];

  socket.write(headers.join("\r\n") + "\r\n\r\n");
  setupSocket(socket);
}

function generateAcceptKey(key) {
  return crypto
    .createHash("sha1")
    .update(key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11")
    .digest("base64");
}

function setupSocket(socket) {
  socket.on("data", (buffer) => handleSocketData(socket, buffer));
  socket.on("end", () => cleanupSocket(socket));
  socket.on("close", () => cleanupSocket(socket));
  socket.on("error", () => cleanupSocket(socket));
}

function handleSocketData(socket, buffer) {
  try {

    const opcode = buffer[0] & 0x0f;
    if (opcode === 0x8) return; // client disconnect

    if (isRateLimited(socket)) {
      sendMessage(rooms, socketMap.get(socket).roomName, socketMap.get(socket).username, "error", "Rate limit exceeded. Please slow down.", socketMap.get(socket).username);
      return;
    }
    const data = JSON.parse(decodeMessage(buffer));
    console.log(data);
  switch (data.type) {
  case "Message":
    broadcast(rooms, data.room, data.message, data.username);
    break;

  case "joinRoom":
    handleJoinRoom(socket, data);
    break;

  case "whisper":
    whisper(rooms, socket, data);
    break;

  case "typing":
    // On broadcast un event "typing" à tous les autres dans la même room
    // message vide, type forcé à "typing"
    broadcast(rooms, data.room, "", data.username, "typing");
    break;

  default:
    console.warn("Unknown message type:", data.type);
}

  } catch (err) {
    console.error("Failed to decode message:", err);
  }
}

function handleJoinRoom(socket, { room, username }) {
  const joinMsg = `${username} has joined the room`;
  addUser(room, username, socket, rooms, socketMap);
  broadcast(rooms, room, joinMsg, "info", "info");
}

function cleanupSocket(socket) {
  removeSocket(socket, rooms, socketMap);
}

function handleGet(req, res) {
  if (req.method === "GET" && req.url === "/rooms") {
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    });
    res.end(JSON.stringify({rooms : Object.keys(rooms)}));
  }
}

server.on("upgrade", handleUpgrade);

server.on("request", handleGet);

server.listen(3000, () => {
  console.log("Server running on port 3000");
});
