import { sendMessage } from "./websocket.js";

function addUser(roomName, username, socket, rooms, socketMap) {
  if (!rooms[roomName]) rooms[roomName] = {};
  rooms[roomName][username] = socket;
  socketMap.set(socket, { roomName, username });
}

function removeSocket(socket, rooms, socketMap) {
  const info = socketMap.get(socket);
  if (!info) return false;

  const { roomName, username } = info;

  if (!rooms[roomName] || !rooms[roomName][username]) {
    return false;
  }

  delete rooms[roomName][username];
  socketMap.delete(socket);

  if (Object.keys(rooms[roomName]).length === 0) {
    delete rooms[roomName];
  }

  return true;
}

function broadcast(rooms, roomName, msg, type = "message") {
  const users = Object.keys(rooms[roomName] || {});
  if (!users.length) return;

  for (const username of users) {
    console.log(username, "lol");
    const userSocket = rooms[roomName][username];
    const data = {
      type,
      message: msg,
      userName: username
    };
    sendMessage(userSocket, JSON.stringify(data));
  }
}

export {addUser, removeSocket, broadcast };