const joinButton = document.getElementById("join");
const usernameInput = document.getElementById("username");
const roomInput = document.getElementById("room");

fetch("http://127.0.0.1:3000/rooms").then(
  (response) => response.json()
).then((data) => addRoomsToDataList(data));

function addRoomsToDataList(data) {
  const rooms = data.rooms;
  const datalist = document.getElementById("rooms");

  rooms.forEach((room) => {
    const option = document.createElement("option");
    option.value = room;
    datalist.appendChild(option);
  });
}
function validateInputs(username, room) {
  if (username.trim() === "" || room.trim() === "") {
    alert("Please enter your username or/and room.");
    return false;
  }
  return true;
}

function storeUserData(username, room) {
  localStorage.setItem("username", username);
  localStorage.setItem("room", room);
}

function redirectToChatRoom() {
  window.location.href = "chatRoom.html";
}

function handleJoinButtonClick() {
  const username = usernameInput.value;
  const room = roomInput.value;
  console.log(roomInput);
  if (!validateInputs(username, room)) return;

  storeUserData(username, room);
  redirectToChatRoom();
}

joinButton.addEventListener("click", handleJoinButtonClick);