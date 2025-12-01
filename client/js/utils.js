let typingTimeout;
const typingIndicator = document.querySelector("#typingIndicator");

function getUsername() {
  return localStorage.getItem("username");
}

function getRoom() {
  return localStorage.getItem("room");
}

function appendMessage(content, className, username) {
  const chatSpan = document.querySelector("#chat");
  if (!chatSpan) return;

  if (className === "info-message" || className === "error-message") {
    const infoDiv = document.createElement("div");
    infoDiv.className = className;
    infoDiv.textContent = content;
    chatSpan.append(infoDiv);
  } else {
    const template = document.querySelector("#message-template");
    if (!template) return;

    const wrapper = template.content.cloneNode(true);
    const messageDiv = wrapper.querySelector(".message");
    const avatar = wrapper.querySelector(".msg-avatar");
    const textSpan = wrapper.querySelector(".msg-text");
    const timeSpan = wrapper.querySelector(".msg-time");

    if (className) messageDiv.classList.add(className);
    avatar.textContent = username[0].toUpperCase();
    textSpan.textContent = content;
    timeSpan.textContent = new Date().toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"});

    chatSpan.append(wrapper);
  }
}

function handleTyping(sender) {
  if (sender === getUsername() || !typingIndicator) return;
  clearTimeout(typingTimeout);

  typingIndicator.textContent = `${sender} is typing...`;
  typingTimeout = setTimeout(() => {
    typingIndicator.textContent = "";
  }, 1500);
}

function sendTypingStatus(isTyping, socket) {
  socket.send(JSON.stringify({
    type: "typing",
    username: getUsername(),
    room: getRoom(),
    isTyping
  }));
}

export {getUsername, getRoom, appendMessage, sendTypingStatus, handleTyping};