import { getUsername, getRoom, appendMessage } from './utils.js';

const socket = new WebSocket('ws://127.0.0.1:3000');

const chatSpan = document.querySelector('#chat');
const input = document.querySelector('#msg');
const btn = document.querySelector('#sendBtn');


let typingTimeout;               
const typingIndicator = document.querySelector('#typingIndicator');


let typingSent = false;           
let typingFailSafeTimeout = null;  

/* ============================
   Helpers message creation
   ============================ */
const roomName = getRoom(); 
document.querySelector('#room-title').textContent = `Room: ${roomName}`;

function createWhisperMessage(msg) {
  const parts = msg.split(' ');
  if (parts.length < 3) {
    appendMessage('Usage: /whisper <username> <message>', 'error-message');
    return null;
  }
  return {
    type: 'whisper',
    username: getUsername(),
    room: getRoom(),
    targetUser: parts[1],
    msg: parts.slice(2).join(' ')
  };
}

function createRegularMessage(msg) {
  return {
    type: 'Message',
    message: msg,
    username: getUsername(),
    room: getRoom()
  };
}

/* =====================
   WebSocket : connexion
   ===================== */

function handleSocketOpen() {
  socket.send(JSON.stringify({
    type: 'joinRoom',
    username: getUsername(),
    room: getRoom()
  }));
}

/* =====================
   WebSocket : reception
   ===================== */

function handleSocketMessage(event) {
  const data = JSON.parse(event.data);
  const { type } = data;

  const sender = data.username;
  const message = data.message;
  const targetUser = data.targetUser;
  const isTyping = data.isTyping;

  console.log('RECV:', event.data);

  switch (type) {
    case 'info':
      appendMessage(`*** ${message} ***`, 'info-message');
      break;

    case 'message':
      appendMessage(
        `[${sender}]: ${message}`,
        sender === getUsername() ? 'my-message' : 'message'
      );
      break;

    case 'whisper':
      if (sender === getUsername()) {
        appendMessage(`[Whisper to ${targetUser}]: ${message}`, 'my-message');
      } else {
        appendMessage(`[Whisper from ${sender}]: ${message}`, 'whisper-message');
      }
      break;

    case 'error':
      appendMessage(`Error: ${message}`, 'error-message');
      break;

       case 'typing': {
     
      if (sender === getUsername()) return;
      if (!typingIndicator) return;

      
      if (isTyping === false) {
        typingIndicator.textContent = '';
        clearTimeout(typingTimeout);
      } else {
        typingIndicator.textContent = `${sender} is typing...`;
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
          typingIndicator.textContent = '';
        }, 1500);
      }
      break;
    }


    default:
      console.warn('Unknown type:', type);
  }
}

/* ======================
   sending mess
   ====================== */

function handleSendButtonClick() {
  const msg = input.value.trim();
  if (!msg) return;

 
  if (typingSent && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
      type: 'typing',
      username: getUsername(),
      room: getRoom(),
      isTyping: false
    }));
    typingSent = false;
    if (typingFailSafeTimeout) {
      clearTimeout(typingFailSafeTimeout);
      typingFailSafeTimeout = null;
    }
  }

  const isWhisper = msg.startsWith('/whisper ');
  const messageData = isWhisper ? createWhisperMessage(msg) : createRegularMessage(msg);

  if (messageData) {
    socket.send(JSON.stringify(messageData));
    input.value = '';
  }
}

/* ==========================
   typing
   ========================== */

input.addEventListener('input', () => {
  const text = input.value;

  // If the user has 3 characters in the textbox then sent a typing
  if (text.length >= 3 && !typingSent && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
      type: 'typing',
      username: getUsername(),
      room: getRoom(),
      isTyping: true
    }));
    typingSent = true;

    // Fail-safe 
    if (typingFailSafeTimeout) clearTimeout(typingFailSafeTimeout);
    typingFailSafeTimeout = setTimeout(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'typing',
          username: getUsername(),
          room: getRoom(),
          isTyping: false
        }));
      }
      typingSent = false;
      typingFailSafeTimeout = null;
    }, 10000);
  }


  if (text.length === 0 && typingSent && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
      type: 'typing',
      username: getUsername(),
      room: getRoom(),
      isTyping: false
    }));
    typingSent = false;
    if (typingFailSafeTimeout) {
      clearTimeout(typingFailSafeTimeout);
      typingFailSafeTimeout = null;
    }
  }
});

/* ==========================
   Wiring  listeners
   ========================== */

socket.addEventListener('open', handleSocketOpen);
socket.addEventListener('message', handleSocketMessage);
btn.addEventListener('click', handleSendButtonClick);

input.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') handleSendButtonClick();
});
