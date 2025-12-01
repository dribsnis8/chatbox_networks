import {getUsername, getRoom, appendMessage, sendTypingStatus, handleTyping} from "./utils.js";

const socket = new WebSocket("ws://127.0.0.1:3000");

const input = document.querySelector("#msg");
const btn = document.querySelector("#sendBtn");
const roomTitle = document.querySelector("#room-title");

let typingSent = false;
let typingFailSafeTimeout = null;

roomTitle.textContent = `Room: ${getRoom()}`;

function createWhisperMessage(msg) {
  const parts = msg.split(" ");
  if (parts.length < 3) {
    appendMessage("Usage: /whisper <username> <message>", "error-message");
    return null;
  }
  return {
    type: "whisper",
    username: getUsername(),
    room: getRoom(),
    targetUser: parts[1],
    msg: parts.slice(2).join(" ")
  };
}

function createRegularMessage(msg) {
  return {
    type: "Message",
    message: msg,
    username: getUsername(),
    room: getRoom()
  };
}

function handleSocketOpen() {
  socket.send(JSON.stringify({
    type: "joinRoom",
    username: getUsername(),
    room: getRoom()
  }));
}

function handleSocketMessage(event) {
  const {type, username, message, targetUser} = JSON.parse(event.data);

  const handlers = {
    info: () => appendMessage(`*** ${message} ***`, "info-message", username),
    message: () => appendMessage(`[${username}]: ${message}`, username === getUsername() ? "my-message" : "message", username),
    whisper: () => appendMessage(`[Whisper to ${targetUser}]: ${message}`, username === getUsername() ? "my-message" : "whisper-message", username),
    error: () => appendMessage(`Error: ${message}`, "error-message",username),
    typing: () => handleTyping(username)
  };
  return handlers[type]?.();
}

function handleSendButtonClick() {
  const msg = input.value.trim();
  if (!msg) return;

  const messageData = msg.startsWith("/whisper ")
    ? createWhisperMessage(msg)
    : createRegularMessage(msg);

  if (messageData) {
    socket.send(JSON.stringify(messageData));
    input.value = "";
  }
}

function handleInput() {
  if (socket.readyState !== WebSocket.OPEN) return;

  const text = input.value.trim(); // avoids spaces triggering typing

  const shouldStartTyping = text.length >= 3 && !typingSent;
  const shouldStopTyping = text.length === 0 && typingSent;

  if (shouldStartTyping) {
    startTyping(socket);
  } else if (shouldStopTyping) {
    stopTyping(socket);
  }
}

function startTyping(socket) {
  sendTypingStatus(true, socket);
  typingSent = true;

  clearTimeout(typingFailSafeTimeout);
  typingFailSafeTimeout = setTimeout(() => {
    stopTyping(socket);
    typingFailSafeTimeout = null;
  }, 10000);
}

function stopTyping(socket) {
  sendTypingStatus(false, socket);
  typingSent = false;
  clearTimeout(typingFailSafeTimeout);
  typingFailSafeTimeout = null;
}


input.addEventListener("input", handleInput);
socket.addEventListener("open", handleSocketOpen);
socket.addEventListener("message", handleSocketMessage);
btn.addEventListener("click", handleSendButtonClick);

input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") handleSendButtonClick();
});