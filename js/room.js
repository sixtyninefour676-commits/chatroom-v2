const sendBtn = document.getElementById("sendBtn");
const leaveBtn = document.getElementById("leave");
const inviteBtn = document.getElementById("invite");
let rId = new URLSearchParams(window.location.search);
rId = rId.get("id");
const messagesDiv = document.getElementById("messages");
const send = document.getElementById("send");
const overlay = document.getElementById("overlay");
let i = 0;
let dbMsg = [];
let msgCLickedIndex = "";
let memberUpdatingIncrement = 0;
let friends = [];

function getDate(date) {
  return (
    date.getDate() +
    "/" +
    String(date.getMonth() + 1) +
    "/" +
    date.getFullYear()
  );
}

let user = "";
$.ajax({
  url: "./php/userFromId.php",
  type: "POST",
  data: { novalue: true },
  success: function (response) {
    user = response;
  },
  cache: false,
  contentType: false,
  processData: false,
});
let form = document.createElement("form");
let data = new FormData(form);
data.append("rId", rId);
$.ajax({
  // ? Checking if user is admin
  url: "./php/checkAdmin.php",
  type: "POST",
  data: data,
  success: function (response) {
    if (response == 1) {
      document.getElementById("options").innerHTML = `
      <button id="moderation" onclick="openModeration()"><i class="fa-solid fa-sliders"></i><br>Moderation</button>
      <button id="settings" onclick="openSettings()"><i class="fa-solid fa-gear"></i><br>Settings</button>
      <button id="invite" onclick="invite()"><i class="fa-solid fa-user-plus"></i><br>Invite</button>
      <button id="leave" onclick="leave()"><i class="fa-solid fa-right-from-bracket"></i><br>Leave</button>`;
    }
  },
  cache: false,
  contentType: false,
  processData: false,
});

$.ajax({
  // ? Getting all friends of user
  url: "./php/getFriends.php",
  type: "POST",
  data: { nodata: true },
  success: function (response) {
    console.log(response);
    friends = JSON.parse(response);
  },
  cache: false,
  contentType: false,
  processData: false,
});

const selectMuted = document.getElementsByClassName("select-unmute");
data = new FormData(form);
data.append("rId", rId);

function generateMuted(users) {
  if (users.length == 0) {
    selectMuted[
      i
    ].innerHTML = `<option value="" disabled selected hidden>No users are muted</option>`;
  } else {
    selectMuted[
      i
    ].innerHTML = `<option value="" disabled selected hidden>Choose a user</option>`;
    for (let i = 0; i < selectMuted.length; i++) {
      for (let j = 0; j < users.length; j++) {
        selectMuted[
          i
        ].innerHTML += `<option value="${users[j]}">${users[j]}</option>`;
      }
    }
  }
}

$.ajax({
  // ? Getting all muted users
  url: "./php/getMuted.php",
  type: "POST",
  data: data,
  success: function (response) {
    generateMuted(JSON.parse(response));
  },
  cache: false,
  contentType: false,
  processData: false,
});

const selectBanned = document.getElementsByClassName("select-banned");
data = new FormData(form);
data.append("rId", rId);

function generateBanned(users) {
  if (users.length == 0) {
    selectBanned[
      i
    ].innerHTML = `<option value="" disabled selected hidden>No users are banned</option>`;
  } else {
    selectBanned[
      i
    ].innerHTML = `<option value="" disabled selected hidden>Choose a user</option>`;
    for (let i = 0; i < selectBanned.length; i++) {
      for (let j = 0; j < users.length; j++) {
        selectBanned[
          i
        ].innerHTML += `<option value="${users[j]}">${users[j]}</option>`;
      }
    }
  }
}

$.ajax({
  // ? Getting all banned users
  url: "./php/getBanned.php",
  type: "POST",
  data: data,
  success: function (response) {
    generateBanned(JSON.parse(response));
  },
  cache: false,
  contentType: false,
  processData: false,
});

data = new FormData(form);
data.append("rId", rId);
$.ajax({
  // ? Checking if user is muted
  url: "./php/checkMuted.php",
  type: "POST",
  data: data,
  success: function (response) {
    if (response == 1) {
      console.log("User is muted");
      send.disabled = "true";
      send.placeholder =
        "You are muted in this room. You cannot send messages.";
    }
  },
  cache: false,
  contentType: false,
  processData: false,
});

function openSettings() {
  document.getElementById("settingsShow").classList.toggle("hidden");
  document.getElementById("moderationShow").classList.add("hidden");
}

document.getElementById("close-settings").addEventListener("click", () => {
  document.getElementById("settingsShow").classList.add("hidden");
});

function openModeration() {
  document.getElementById("moderationShow").classList.toggle("hidden");
  document.getElementById("settingsShow").classList.add("hidden");
}

document.getElementById("close-moderation").addEventListener("click", () => {
  document.getElementById("moderationShow").classList.add("hidden");
});

document.getElementById("change").addEventListener("click", () => {
  const name = document.getElementById("name").value;
  let form = document.createElement("form");
  let data = new FormData(form);
  data.append("name", name);
  data.append("rId", rId);
  if (name != "") {
    $.ajax({
      url: "./php/changeName.php",
      type: "POST",
      data: data,
      success: function (response) {
        if (response == 1) {
          alert("The name has been changed to '" + name + "'.");
          location.reload();
        } else if (response == 0) {
          alert("There was an error updating the database");
        } else if (response == 2) {
          alert("You are not authorized to perform this action");
        } else {
          alert("An unknown error occured: \n\n" + response);
          console.log("An unknown error occured: \n\n" + response);
        }
      },
      cache: false,
      contentType: false,
      processData: false,
    });
  } else {
    alert("No value has been entered");
  }
});

document.getElementById("transferAdmin").addEventListener("click", () => {
  const toTransfer = document.getElementById("transfer").value;
  if (toTransfer != "") {
    if (
      confirm("Are you sure you want to transfer admin to " + toTransfer + "?")
    ) {
      if (
        confirm(
          "You will loose all your privileges after transferring admin. Do you wish to proceed?"
        )
      ) {
        let form = document.createElement("form");
        let data = new FormData(form);
        data.append("name", toTransfer);
        data.append("rId", rId);
        $.ajax({
          url: "./php/transferAdmin.php",
          type: "POST",
          data: data,
          success: function (response) {
            if (response == 1) {
              alert(
                "Admin has been transferred, you no longer have any power in this room."
              );
              location.reload();
            } else if (response == 0) {
              alert("There was an error updating the database");
            } else if (response == 2) {
              alert("You are not authorized to perform this action");
            } else {
              alert("An unknown error occured: \n\n" + response);
              console.log("An unknown error occured: \n\n" + response);
            }
          },
          cache: false,
          contentType: false,
          processData: false,
        });
      }
    }
  } else {
    alert("No user has been selected");
  }
});

document.getElementById("muteBtn").addEventListener("click", () => {
  let user = document.getElementById("mute").value;
  if (user != "") {
    let form = document.createElement("form");
    let data = new FormData(form);
    data.append("rId", rId);
    data.append("user", user);
    $.ajax({
      url: "./php/muteUser.php",
      type: "POST",
      data: data,
      success: function (response) {
        if (response == 1) {
          alert(user + " has been muted");
          location.reload();
        } else if (response == 0) {
          alert("There was an error updating the database");
        } else if (response == 2) {
          alert("You are not authorized to perform this action");
        } else if (response == 3) {
          alert("This user is already muted in this room");
        } else if (response == 4) {
          alert("You cannot mute an admin");
        } else {
          alert("An unknown error occured: \n\n" + response);
          console.log("An unknown error occured: \n\n" + response);
        }
      },
      cache: false,
      contentType: false,
      processData: false,
    });
  } else {
    alert("No user has been selected");
  }
});

document.getElementById("unmuteBtn").addEventListener("click", () => {
  let toUnmute = document.getElementById("unmute").value;
  if (toUnmute != "") {
    let form = document.createElement("form");
    let data = new FormData(form);
    data.append("rId", rId);
    data.append("user", toUnmute);
    $.ajax({
      url: "./php/unmuteUser.php",
      type: "POST",
      data: data,
      success: function (response) {
        if (response == 1) {
          alert(toUnmute + " has been unmuted");
          location.reload();
        } else if (response == 0) {
          alert("There was an error updating the database");
        } else if (response == 2) {
          alert("You are not authorized to perform this action");
        } else if (response == 3) {
          alert("User is not muted");
        } else {
          alert("An unknown error occured: \n\n" + response);
          console.log("An unknown error occured: \n\n" + response);
        }
      },
      cache: false,
      contentType: false,
      processData: false,
    });
  } else {
    alert("No muted user has been selected");
  }
});

document.getElementById("kickBtn").addEventListener("click", () => {
  const toKick = document.getElementById("kick").value;
  if (toKick != "") {
    let form = document.createElement("form");
    let data = new FormData(form);
    data.append("rId", rId);
    data.append("user", toKick);
    $.ajax({
      url: "./php/kickUser.php",
      type: "POST",
      data: data,
      success: function (response) {
        if (response == 1) {
          alert(toKick + " has been kicked");
        } else if (response == 0) {
          alert("There was an error updating the database");
        } else if (response == 2) {
          alert("You are not authorized to perform this action");
        } else if (response == 3) {
          alert("You cannot kick the admin of the room");
        } else {
          alert("An unknown error occured: \n\n" + response);
          console.log("An unknown error occured: \n\n" + response);
        }
      },
      cache: false,
      contentType: false,
      processData: false,
    });
  } else {
    alert("No user has been selected");
  }
});

document.getElementById("banBtn").addEventListener("click", () => {
  let toBan = document.getElementById("ban").value;
  if (toBan != "") {
    let form = document.createElement("form");
    let data = new FormData(form);
    data.append("rId", rId);
    data.append("user", toBan);
    $.ajax({
      url: "./php/banUser.php",
      type: "POST",
      data: data,
      success: function (response) {
        if (response == 1) {
          alert(toBan + " has been banned");
        } else if (response == 0) {
          alert("There was an error updating the database");
        } else if (response == 3) {
          alert("You cannot ban the admin");
        } else if (response == 2) {
          alert("You are not authorized to perform this action");
        } else {
          alert("An unknown error occured: \n\n" + response);
          console.log("An unknown error occured: \n\n" + response);
        }
      },
      cache: false,
      contentType: false,
      processData: false,
    });
  } else {
    alert("No user has been selected");
  }
});

document.getElementById("unbanBtn").addEventListener("click", () => {
  let toUnban = document.getElementById("unban").value;
  if (toUnban != "") {
    let form = document.createElement("form");
    let data = new FormData(form);
    data.append("rId", rId);
    data.append("user", toUnban);
    $.ajax({
      url: "./php/unbanUser.php",
      type: "POST",
      data: data,
      success: function (response) {
        if (response == 1) {
          alert(toUnban + " has been unbanned");
        } else if (response == 0) {
          alert("There was an error updating the database");
        } else if (response == 2) {
          alert("You are not authorized to perform this action");
        } else {
          alert("An unknown error occured: \n\n" + response);
          console.log("An unknown error occured: \n\n" + response);
        }
      },
      cache: false,
      contentType: false,
      processData: false,
    });
  } else {
    alert("No user has been selected");
  }
});

function leave() {
  if (confirm("Are you sure you want to leave the chat room")) {
    let data = new FormData(document.createElement("form"));
    data.append("rId", rId);
    $.ajax({
      url: "./php/leave.php",
      type: "POST",
      data: data,
      success: function (msg) {
        if (msg == "1") {
          alert("You left the chat room.");
          location.href = "index.php";
        } else {
          alert("An unknown error occured: \n\n" + msg);
        }
      },
      cache: false,
      contentType: false,
      processData: false,
    });
  }
}

function invite() {
  document.getElementById("invite-alert").classList.toggle("hidden");
  document.getElementById("title").innerHTML = "Invite";
  document.getElementById(
    "description"
  ).innerHTML = `Send this link to the person you want to invite:<br><br> <a href="${
    location.protocol + "//" + location.host + "/Chat Room/invite.php?id=" + rId
  }" target="_blank">${
    location.protocol + "//" + location.host + "/Chat Room/invite.php?id=" + rId
  }</a><button class="copy" onclick="navigator.clipboard.writeText('${
    location.protocol + "//" + location.host + "/Chat Room/invite.php?id=" + rId
  }');alert('Copied!');"><i class="fa-regular fa-copy"></i></button><br><br>or<br><br>Share this Room ID with the person joining: ${rId}<button class="copy" onclick="navigator.clipboard.writeText('${rId}');alert('Copied!');"><i class="fa-regular fa-copy"></i></button>`;
}

function deleteRoom() {
  if (!confirm("Are you sure you want to delete this room?")) {
    return;
  }
  if (
    !confirm(
      "All messages in the chat room will be lost and cannot be recovered, are you sure you want to proceed?"
    )
  ) {
    return;
  }
  let form = document.createElement("form");
  let data = new FormData(form);
  data.append("rId", rId);
  $.ajax({
    url: "./php/deleteRoom.php",
    type: "POST",
    data: data,
    success: function (response) {
      if (response == 1) {
        alert("Room has been deleted");
        location.href = "index.php";
      } else if (response == 0) {
        alert("There was an error deleting the room from the database");
      } else if (response == 2) {
        alert("You are not authorized to perform this action");
      } else {
        alert("An unexpected error occured: \n\n" + response);
        console.log(response);
      }
    },
    cache: false,
    contentType: false,
    processData: false,
  });
}

leaveBtn.addEventListener("click", leave);

document.getElementById("close").onclick = () => {
  document.getElementById("invite-alert").classList.toggle("hidden");
};

inviteBtn.addEventListener("click", invite);

function addZero(i) {
  if (i < 10) {
    i = "0" + i;
  }
  return i;
}

sendBtn.addEventListener("click", function () {
  const d = new Date();
  let AMPM = d.getHours() >= 12 ? "PM" : "AM";
  let time =
    getDate(d, "dd/mm/yy") +
    " " +
    addZero(d.getHours()) +
    ":" +
    addZero(d.getMinutes()) +
    " " +
    AMPM;
  data.append("message", send.value);
  data.append("rId", rId);
  data.append("time", time);
  $.ajax({
    url: "./php/send.php",
    type: "POST",
    data: data,
    success: function (msg) {
      if (msg == 1) {
        send.value = "";
        console.log("sent");
        getMessages();
      } else if (msg == 0) {
        alert("There was an error updating the database.");
      } else if (msg == 2) {
        alert("You are muted in this room, you cannot send messages.");
      } else {
        alert(`An unknown error occured:\n\n ${msg}`);
      }
    },
    cache: false,
    contentType: false,
    processData: false,
  });
});

send.addEventListener("keydown", (e) => {
  if (e.key == "Enter") {
    sendBtn.click();
  }
});

function sendRequest(username) {
  let form = document.createElement("form");
  let data = new FormData(form);
  data.append("user", username);
  $.ajax({
    url: "./php/sendRequest.php",
    type: "POST",
    data: data,
    success: function (response) {
      if (response == 1) {
        alert("Friend request sent");
      } else if (response == 0) {
        alert("Error updating the database");
      } else {
        alert("An unknown error occured: \n\n" + response);
        console.log("An unknown error occured: \n\n" + response);
      }
    },
    cache: false,
    contentType: false,
    processData: false,
  });
}

function getMembers() {
  let data = new FormData(document.createElement("form"));
  data.append("rId", rId);
  $.ajax({
    url: "./php/members.php",
    type: "POST",
    data: data,
    success: function (msg) {
      if (msg == 0) {
        alert("There was an error fetching members");
      } else if (msg.substr(0, 2) == "++") {
        let memberString = msg.substr(2, msg.length - 2);
        let memberArray = memberString.split(",");
        if (memberArray[memberArray.length - 1] == "") {
          memberArray.pop();
        }

        memberUpdatingIncrement++;
        if (memberUpdatingIncrement == 1) {
          const selectUsers = document.getElementsByClassName("select-user");
          for (let i = 0; i < selectUsers.length; i++) {
            selectUsers[
              i
            ].innerHTML = `<option value="" disabled selected hidden>Choose a user</option>`;
            for (let j = 0; j < memberArray.length; j++) {
              selectUsers[
                i
              ].innerHTML += `<option value="${memberArray[j]}">${memberArray[j]}</option>`;
            }
          }
        }

        let memberList = JSON.stringify(memberArray);
        let data = new FormData(document.createElement("form"));
        data.append("members", memberList);
        const membersContainer = document.getElementById("members");
        $.ajax({
          url: "./php/memberStatus.php",
          type: "POST",
          data: data,
          success: function (msg) {
            const data = JSON.parse(msg);
            if (typeof data == "object") {
              let final = "";
              data.forEach((element) => {
                final += `<div class="member"><span>${element[0]}</span>${
                  element[1] == "true"
                    ? "<div class='online'></div>"
                    : "<div class='offline'></div>"
                }</div>${
                  element[0] != user && !friends.includes(element[0])
                    ? `<button class="add-friend" onclick="sendRequest('${element[0]}')"><i class="fa-solid fa-user-plus"></i>&nbsp;&nbsp;Add Friend</button>`
                    : ""
                }`;
              });
              final = `<h1 class="member-title">Members</h1>` + final;
              if (membersContainer.innerHTML == final) {
                null;
              } else {
                membersContainer.innerHTML = final;
              }
            } else {
              alert("An unknown error occured: \n\n" + msg);
            }
          },
          cache: false,
          contentType: false,
          processData: false,
        });
      } else {
        alert("An unknown error occured: \n\n" + msg);
      }
    },
    cache: false,
    contentType: false,
    processData: false,
  });
}

document.getElementById("close-overlay").addEventListener("click", () => {
  overlay.classList.add("hidden");
  msgCLickedIndex = "";
});

function bookmark(index) {
  let id = "";
  let sender = "";
  let content = "";
  let time = "";
  dbMsg.forEach((element) => {
    if (element.i == index) {
      id = element.id;
      sender = element.sender;
      content = element.content;
      time = element.time;
      console.log(time);
    }
  });
  let form = document.createElement("form");
  let data = new FormData(form);
  data.append("id", id);
  data.append("rId", rId);
  data.append("sender", sender);
  data.append("content", content);
  data.append("time", time);
  $.ajax({
    url: "./php/bookmark.php",
    type: "POST",
    data: data,
    success: function (response) {
      if (response == 1) {
        overlay.classList.add("hidden");
        msgCLickedIndex = "";
      } else if (response == 0) {
        alert("An error occured updating the database");
      } else if (response == 2) {
        alert("This message is already bookmarked");
      } else {
        alert("An unknown error occured: \n\n" + response);
        console.log("An unknown error occured: \n\n" + response);
      }
    },
    cache: false,
    contentType: false,
    processData: false,
  });
}

function del(index) {
  let id = "";
  dbMsg.forEach((element) => {
    if (element.i == index) {
      id = element.id;
    }
  });
  let form = document.createElement("form");
  let data = new FormData(form);
  data.append("id", id);
  data.append("rId", rId);
  $.ajax({
    url: "./php/delete.php",
    type: "POST",
    data: data,
    success: function (response) {
      if (response == 1) {
        overlay.classList.add("hidden");
        msgCLickedIndex = "";
        getMessages();
      } else if (response == 0) {
        alert("An error occured updating the database");
      } else {
        alert("An unknown error occured: \n\n" + response);
      }
    },
    cache: false,
    contentType: false,
    processData: false,
  });
}

//Fetching messages every 5 seconds

function getMessages() {
  let data = new FormData(document.createElement("form"));
  data.append("rId", rId);
  $.ajax({
    url: "./php/fetch.php",
    type: "POST",
    data: data,
    success: function (msg) {
      const messages = JSON.parse(msg);
      let final = "";
      dbMsg = [];
      messages.forEach((element, index) => {
        dbMsg.push({
          i: index,
          sender: element.sender,
          content: element.content,
          id: element.id,
          time: element.time,
        });
        if (element.sender == user) {
          final += `<p class="message editable"><span class="sender">${element.sender}</span>&nbsp;&nbsp;<span class="time">${element.time}</span><br><span class="msg">${element.content}</span></p><br>`;
        } else {
          final += `<p class="message bookmarkable"><span class="sender">${element.sender}</span>&nbsp;&nbsp;<span class="time">${element.time}</span><br><span class="msg">${element.content}</span></p><br>`;
        }
      });
      if (messagesDiv.innerHTML == final) {
        return;
      } else {
        messagesDiv.innerHTML = final;
        const message = document.getElementsByClassName("message");
        for (let i = 0; i < message.length; i++) {
          if (message[i].classList.contains("editable")) {
            message[i].addEventListener("click", () => {
              overlay.classList.remove("hidden");
              document.getElementById("delete").classList.remove("hidden");
              msgCLickedIndex = String(i);
              console.log(msgCLickedIndex);
            });
          } else if (message[i].classList.contains("bookmarkable")) {
            message[i].addEventListener("click", () => {
              overlay.classList.remove("hidden");
              document.getElementById("delete").classList.add("hidden");
              msgCLickedIndex = String(i);
              console.log(msgCLickedIndex);
            });
          }
        }
        document.getElementById("messages").scrollTop =
          document.getElementById("messages").scrollHeight;
      }
    },
    cache: false,
    contentType: false,
    processData: false,
  });
}

document.getElementById("delete").addEventListener("click", () => {
  del(msgCLickedIndex);
});

document.getElementById("bookmark").addEventListener("click", () => {
  bookmark(msgCLickedIndex);
});

getMessages();

let fetching = setInterval(getMessages, 5000);

window.addEventListener("load", function () {
  console.log("load");
  let form = document.createElement("form");
  let data = new FormData(form);
  data.append("load", "false");
  $.ajax({
    url: "./php/load.php",
    type: "POST",
    data: data,
    success: function (response) {
      if (response == "1") {
        console.log("success setting online");
        getMembers();
        setInterval(getMembers, 5000);
      } else {
        console.log("Online update failed");
      }
    },
    cache: false,
    contentType: false,
    processData: false,
  });
});

window.onunload = function () {
  console.log("unload");
  let form = document.createElement("form");
  let data = new FormData(form);
  data.append("unload", "true");
  $.ajax({
    url: "./php/unload.php",
    type: "POST",
    data: data,
    success: function (response) {
      if (response == "1") {
        console.log("success setting online");
      } else if (response == "0") {
        console.log("Online update failed");
      } else {
        console.log("Unknown error: " + response);
      }
    },
    cache: false,
    contentType: false,
    processData: false,
  });
};
