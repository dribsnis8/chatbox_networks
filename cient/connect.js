const socket = new WebSocket('ws://127.0.0.1:3000');

const chatSpan = document.querySelector('#chat');
const input = document.querySelector('#msg');
const btn = document.querySelector('#sendBtn');

socket.addEventListener('message', (event) => {
  const div = document.createElement('div');
  div.textContent = event.data;
  chatSpan.appendChild(div);
});

btn.addEventListener('click', () => {
  const msg = input.value;
  if (!msg) return;
  socket.send(msg);
  input.value = '';
});