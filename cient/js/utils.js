function getUsername() {
  return localStorage.getItem('username');
}

function getRoom() {
  return localStorage.getItem('room');
}
function appendMessage(content, className) {
  const chatSpan = document.querySelector('#chat');
  if (!chatSpan) return;

  const wrapper = document.createElement('div');
  if (className) wrapper.classList.add(className);

  // On va essayer de récupérer le pseudo depuis le texte
  // formats possibles :
  // [safia]: coucou
  // [noemi]: ca va ?
  // [Whisper from safia]: hello
  // [Whisper to noemi]: hello
  let username = null;
  let messageText = content;

  const match = content.match(/^\[(?:Whisper (?:from|to) )?([^\]]+)\]:\s*(.*)$/);
  if (match) {
    username = match[1];
    messageText = match[2];
  }

  // Ligne principale (avatar + texte)
  const line = document.createElement('div');
  line.classList.add('msg-line');

  if (username) {
    // Avatar = première lettre du pseudo
    const avatar = document.createElement('span');
    avatar.classList.add('msg-avatar');
    avatar.textContent = username[0].toUpperCase();

    // Texte du message (on remet le [username]: devant)
    const textSpan = document.createElement('span');
    textSpan.classList.add('msg-text');
    textSpan.textContent = `[${username}]: ${messageText}`;

    line.appendChild(avatar);
    line.appendChild(textSpan);
  } else {
    // Messages système (info / error)
    const textSpan = document.createElement('span');
    textSpan.classList.add('msg-text');
    textSpan.textContent = content;
    line.appendChild(textSpan);
  }

  // Timestamp
  const timeSpan = document.createElement('span');
  timeSpan.classList.add('msg-time');
  const now = new Date();
  timeSpan.textContent = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  wrapper.appendChild(line);
  wrapper.appendChild(timeSpan);

  chatSpan.appendChild(wrapper);
  chatSpan.scrollTop = chatSpan.scrollHeight;
}

export { getUsername, getRoom, appendMessage };
