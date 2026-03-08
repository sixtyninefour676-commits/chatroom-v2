let rId = new URLSearchParams(window.location.search).get("id");
const messagesDiv = document.getElementById("messages");
const send = document.getElementById("send");
const overlay = document.getElementById("overlay");
let dbMsg = [];
let msgClickedIndex = "";
let memberUpdatingIncrement = 0;
let friends = [];
let user = "";

function getDate(date) {
  return date.getDate() + "/" + String(date.getMonth() + 1) + "/" + date.getFullYear();
}

function addZero(i) {
  return i < 10 ? "0" + i : i;
}

// ─── FETCH CURRENT USER ───────────────────────────────────────────────────────

$.ajax({
  url: "/php/userFromId.php",
  type: "POST",
  data: new FormData(document.createElement("form")),
  success: function (response) { user = response; },
  cache: false, contentType: false, processData: false,
});

// ─── CHECK ADMIN ──────────────────────────────────────────────────────────────

(function checkAdmin() {
  let d = new FormData(document.createElement("form"));
  d.append("rId", rId);
  $.ajax({
    url: "/php/checkAdmin.php",
    type: "POST",
    data: d,
    success: function (response) {
      if (response == 1) {
        document.getElementById("options").innerHTML = `
          <button id="moderation" onclick="openModeration()"><i class="fa-solid fa-sliders"></i><br>Moderation</button>
          <button id="settings" onclick="openSettings()"><i class="fa-solid fa-gear"></i><br>Settings</button>
          <button id="invite-btn" onclick="invite()"><i class="fa-solid fa-user-plus"></i><br>Invite</button>
          <button id="leave-btn" onclick="leave()"><i class="fa-solid fa-right-from-bracket"></i><br>Leave</button>`;
      } else {
        // Non-admin: attach listeners to existing buttons
        document.getElementById("invite").addEventListener("click", invite);
        document.getElementById("leave").addEventListener("click", leave);
      }
    },
    cache: false, contentType: false, processData: false,
  });
})();

// ─── GET FRIENDS ──────────────────────────────────────────────────────────────

(function getFriends() {
  let d = new FormData(document.createElement("form"));
  $.ajax({
    url: "/php/getFriends.php",
    type: "POST",
    data: d,
    success: function (response) {
      try { friends = JSON.parse(response); } catch(e) { friends = []; }
    },
    cache: false, contentType: false, processData: false,
  });
})();

// ─── MUTED LIST ───────────────────────────────────────────────────────────────

const selectMuted = document.getElementsByClassName("select-unmute");

function generateMuted(users) {
  for (let i = 0; i < selectMuted.length; i++) {
    if (users.length == 0) {
      selectMuted[i].innerHTML = `<option value="" disabled selected hidden>No users are muted</option>`;
    } else {
      selectMuted[i].innerHTML = `<option value="" disabled selected hidden>Choose a user</option>`;
      users.forEach(u => {
        selectMuted[i].innerHTML += `<option value="${u}">${u}</option>`;
      });
    }
  }
}

(function loadMuted() {
  let d = new FormData(document.createElement("form"));
  d.append("rId", rId);
  $.ajax({
    url: "/php/getMuted.php",
    type: "POST",
    data: d,
    success: function (response) {
      try { generateMuted(JSON.parse(response)); } catch(e) { generateMuted([]); }
    },
    cache: false, contentType: false, processData: false,
  });
})();

// ─── BANNED LIST ──────────────────────────────────────────────────────────────

const selectBanned = document.getElementsByClassName("select-banned");

function generateBanned(users) {
  for (let i = 0; i < selectBanned.length; i++) {
    if (users.length == 0) {
      selectBanned[i].innerHTML = `<option value="" disabled selected hidden>No users are banned</option>`;
    } else {
      selectBanned[i].innerHTML = `<option value="" disabled selected hidden>Choose a user</option>`;
      users.forEach(u => {
        selectBanned[i].innerHTML += `<option value="${u}">${u}</option>`;
      });
    }
  }
}

(function loadBanned() {
  let d = new FormData(document.createElement("form"));
  d.append("rId", rId);
  $.ajax({
    url: "/php/getBanned.php",
    type: "POST",
    data: d,
    success: function (response) {
      try { generateBanned(JSON.parse(response)); } catch(e) { generateBanned([]); }
    },
    cache: false, contentType: false, processData: false,
  });
})();

// ─── CHECK MUTED ──────────────────────────────────────────────────────────────

(function checkMuted() {
  let d = new FormData(document.createElement("form"));
  d.append("rId", rId);
  $.ajax({
    url: "/php/checkMuted.php",
    type: "POST",
    data: d,
    success: function (response) {
      if (response == 1) {
        send.disabled = true;
        send.placeholder = "You are muted in this room. You cannot send messages.";
      }
    },
    cache: false, contentType: false, processData: false,
  });
})();

// ─── SETTINGS ─────────────────────────────────────────────────────────────────

function openSettings() {
  document.getElementById("settingsShow").classList.toggle("hidden");
  document.getElementById("moderationShow").classList.add("hidden");
}

function openModeration() {
  document.getElementById("moderationShow").classList.toggle("hidden");
  document.getElementById("settingsShow").classList.add("hidden");
}

document.getElementById("close-settings").addEventListener("click", () => {
  document.getElementById("settingsShow").classList.add("hidden");
});

document.getElementById("close-moderation").addEventListener("click", () => {
  document.getElementById("moderationShow").classList.add("hidden");
});

document.getElementById("change").addEventListener("click", () => {
  const name = document.getElementById("name").value;
  if (!name) { alert("No value has been entered"); return; }
  let d = new FormData(document.createElement("form"));
  d.append("name", name);
  d.append("rId", rId);
  $.ajax({
    url: "/php/changeName.php", type: "POST", data: d,
    success: function (response) {
      if (response == 1) { alert("The name has been changed to '" + name + "'."); location.reload(); }
      else if (response == 2) { alert("You are not authorized to perform this action"); }
      else { alert("There was an error updating the database"); }
    },
    cache: false, contentType: false, processData: false,
  });
});

document.getElementById("transferAdmin").addEventListener("click", () => {
  const toTransfer = document.getElementById("transfer").value;
  if (!toTransfer) { alert("No user has been selected"); return; }
  if (!confirm("Are you sure you want to transfer admin to " + toTransfer + "?")) return;
  if (!confirm("You will lose all your privileges. Do you wish to proceed?")) return;
  let d = new FormData(document.createElement("form"));
  d.append("name", toTransfer);
  d.append("rId", rId);
  $.ajax({
    url: "/php/transferAdmin.php", type: "POST", data: d,
    success: function (response) {
      if (response == 1) { alert("Admin has been transferred."); location.reload(); }
      else if (response == 2) { alert("You are not authorized to perform this action"); }
      else { alert("There was an error updating the database"); }
    },
    cache: false, contentType: false, processData: false,
  });
});

// ─── MODERATION BUTTONS ───────────────────────────────────────────────────────

document.getElementById("muteBtn").addEventListener("click", () => {
  let target = document.getElementById("mute").value;
  if (!target) { alert("No user has been selected"); return; }
  let d = new FormData(document.createElement("form"));
  d.append("rId", rId); d.append("user", target);
  $.ajax({
    url: "/php/muteUser.php", type: "POST", data: d,
    success: function (r) {
      if (r == 1) { alert(target + " has been muted"); location.reload(); }
      else if (r == 3) { alert("This user is already muted"); }
      else if (r == 4) { alert("You cannot mute an admin"); }
      else if (r == 2) { alert("You are not authorized"); }
      else { alert("Error: " + r); }
    },
    cache: false, contentType: false, processData: false,
  });
});

document.getElementById("unmuteBtn").addEventListener("click", () => {
  let target = document.getElementById("unmute").value;
  if (!target) { alert("No muted user has been selected"); return; }
  let d = new FormData(document.createElement("form"));
  d.append("rId", rId); d.append("user", target);
  $.ajax({
    url: "/php/unmuteUser.php", type: "POST", data: d,
    success: function (r) {
      if (r == 1) { alert(target + " has been unmuted"); location.reload(); }
      else if (r == 3) { alert("User is not muted"); }
      else if (r == 2) { alert("You are not authorized"); }
      else { alert("Error: " + r); }
    },
    cache: false, contentType: false, processData: false,
  });
});

document.getElementById("kickBtn").addEventListener("click", () => {
  let target = document.getElementById("kick").value;
  if (!target) { alert("No user has been selected"); return; }
  let d = new FormData(document.createElement("form"));
  d.append("rId", rId); d.append("user", target);
  $.ajax({
    url: "/php/kickUser.php", type: "POST", data: d,
    success: function (r) {
      if (r == 1) { alert(target + " has been kicked"); }
      else if (r == 3) { alert("You cannot kick the admin"); }
      else if (r == 2) { alert("You are not authorized"); }
      else { alert("Error: " + r); }
    },
    cache: false, contentType: false, processData: false,
  });
});

document.getElementById("banBtn").addEventListener("click", () => {
  let target = document.getElementById("ban").value;
  if (!target) { alert("No user has been selected"); return; }
  let d = new FormData(document.createElement("form"));
  d.append("rId", rId); d.append("user", target);
  $.ajax({
    url: "/php/banUser.php", type: "POST", data: d,
    success: function (r) {
      if (r == 1) { alert(target + " has been banned"); }
      else if (r == 3) { alert("You cannot ban the admin"); }
      else if (r == 2) { alert("You are not authorized"); }
      else { alert("Error: " + r); }
    },
    cache: false, contentType: false, processData: false,
  });
});

document.getElementById("unbanBtn").addEventListener("click", () => {
  let target = document.getElementById("unban").value;
  if (!target) { alert("No user has been selected"); return; }
  let d = new FormData(document.createElement("form"));
  d.append("rId", rId); d.append("user", target);
  $.ajax({
    url: "/php/unbanUser.php", type: "POST", data: d,
    success: function (r) {
      if (r == 1) { alert(target + " has been unbanned"); }
      else if (r == 2) { alert("You are not authorized"); }
      else { alert("Error: " + r); }
    },
    cache: false, contentType: false, processData: false,
  });
});

// ─── LEAVE / INVITE ───────────────────────────────────────────────────────────

function leave() {
  if (!confirm("Are you sure you want to leave the chat room?")) return;
  let d = new FormData(document.createElement("form"));
  d.append("rId", rId);
  $.ajax({
    url: "/php/leave.php", type: "POST", data: d,
    success: function (msg) {
      if (msg == "1") { alert("You left the chat room."); location.href = "/"; }
      else { alert("An unknown error occured: \n\n" + msg); }
    },
    cache: false, contentType: false, processData: false,
  });
}

function invite() {
  document.getElementById("invite-alert").classList.toggle("hidden");
  document.getElementById("title").innerHTML = "Invite";
  const link = location.protocol + "//" + location.host + "/invite?id=" + rId;
  document.getElementById("description").innerHTML = `
    Send this link to the person you want to invite:<br><br>
    <a href="${link}" target="_blank">${link}</a>
    <button class="copy" onclick="navigator.clipboard.writeText('${link}');alert('Copied!');"><i class="fa-regular fa-copy"></i></button>
    <br><br>or<br><br>
    Share this Room ID: ${rId}
    <button class="copy" onclick="navigator.clipboard.writeText('${rId}');alert('Copied!');"><i class="fa-regular fa-copy"></i></button>`;
}

function deleteRoom() {
  if (!confirm("Are you sure you want to delete this room?")) return;
  if (!confirm("All messages will be lost. Proceed?")) return;
  let d = new FormData(document.createElement("form"));
  d.append("rId", rId);
  $.ajax({
    url: "/php/deleteRoom.php", type: "POST", data: d,
    success: function (r) {
      if (r == 1) { alert("Room has been deleted"); location.href = "/"; }
      else if (r == 2) { alert("You are not authorized"); }
      else { alert("Error: " + r); }
    },
    cache: false, contentType: false, processData: false,
  });
}

document.getElementById("close").onclick = () => {
  document.getElementById("invite-alert").classList.toggle("hidden");
};

// ─── SEND MESSAGE ─────────────────────────────────────────────────────────────

document.getElementById("sendBtn").addEventListener("click", function () {
  const msg = send.value.trim();
  if (!msg) return;
  const d = new Date();
  const AMPM = d.getHours() >= 12 ? "PM" : "AM";
  const time = getDate(d) + " " + addZero(d.getHours()) + ":" + addZero(d.getMinutes()) + " " + AMPM;

  // Fresh FormData every time — fixes the stale/duplicate data bug
  let fd = new FormData(document.createElement("form"));
  fd.append("message", msg);
  fd.append("rId", rId);
  fd.append("time", time);

  $.ajax({
    url: "/php/send.php", type: "POST", data: fd,
    success: function (res) {
      if (res == 1) { send.value = ""; getMessages(); }
      else if (res == 2) { alert("You are muted in this room."); }
      else { alert("Error sending message: " + res); }
    },
    cache: false, contentType: false, processData: false,
  });
});

send.addEventListener("keydown", (e) => {
  if (e.key == "Enter") document.getElementById("sendBtn").click();
});

// ─── FRIEND REQUEST ───────────────────────────────────────────────────────────

function sendRequest(username) {
  let d = new FormData(document.createElement("form"));
  d.append("user", username);
  $.ajax({
    url: "/php/sendRequest.php", type: "POST", data: d,
    success: function (r) {
      if (r == 1) { alert("Friend request sent"); }
      else if (r == 2) { alert("User not found"); }
      else if (r == 3) { alert("Already friends or request already sent"); }
      else { alert("Error: " + r); }
    },
    cache: false, contentType: false, processData: false,
  });
}

// ─── MEMBERS ──────────────────────────────────────────────────────────────────

function getMembers() {
  let d = new FormData(document.createElement("form"));
  d.append("rId", rId);
  $.ajax({
    url: "/php/members.php", type: "POST", data: d,
    success: function (msg) {
      if (msg == 0) return;
      if (msg.substr(0, 2) !== "++") return;

      let memberString = msg.substr(2);
      let memberArray = memberString.split(",").filter(m => m.trim() !== "");

      memberUpdatingIncrement++;
      if (memberUpdatingIncrement == 1) {
        const selectUsers = document.getElementsByClassName("select-user");
        for (let i = 0; i < selectUsers.length; i++) {
          selectUsers[i].innerHTML = `<option value="" disabled selected hidden>Choose a user</option>`;
          memberArray.forEach(m => {
            selectUsers[i].innerHTML += `<option value="${m}">${m}</option>`;
          });
        }
      }

      let d2 = new FormData(document.createElement("form"));
      d2.append("members", JSON.stringify(memberArray));
      const membersContainer = document.getElementById("members");

      $.ajax({
        url: "/php/memberStatus.php", type: "POST", data: d2,
        success: function (msg) {
          try {
            const data = JSON.parse(msg);
            let final = "<h1 class='member-title'>Members</h1>";
            data.forEach((element) => {
              final += `<div class="member"><span>${element[0]}</span>${
                element[1] == "true" ? "<div class='online'></div>" : "<div class='offline'></div>"
              }</div>${
                element[0] != user && !friends.includes(element[0])
                  ? `<button class="add-friend" onclick="sendRequest('${element[0]}')"><i class="fa-solid fa-user-plus"></i>&nbsp;&nbsp;Add Friend</button>`
                  : ""
              }`;
            });
            if (membersContainer.innerHTML !== final) {
              membersContainer.innerHTML = final;
            }
          } catch(e) { console.error("memberStatus parse error", e); }
        },
        cache: false, contentType: false, processData: false,
      });
    },
    cache: false, contentType: false, processData: false,
  });
}

// ─── OVERLAY (delete / bookmark message) ──────────────────────────────────────

document.getElementById("close-overlay").addEventListener("click", () => {
  overlay.classList.add("hidden");
  msgClickedIndex = "";
});

function bookmark(index) {
  let entry = dbMsg.find(e => e.i == index);
  if (!entry) return;
  let d = new FormData(document.createElement("form"));
  d.append("id", entry.id);
  d.append("rId", rId);
  d.append("sender", entry.sender);
  d.append("content", entry.content);
  d.append("time", entry.time);
  $.ajax({
    url: "/php/bookmark.php", type: "POST", data: d,
    success: function (r) {
      if (r == 1) { overlay.classList.add("hidden"); msgClickedIndex = ""; }
      else if (r == 2) { alert("This message is already bookmarked"); }
      else { alert("Error: " + r); }
    },
    cache: false, contentType: false, processData: false,
  });
}

function del(index) {
  let entry = dbMsg.find(e => e.i == index);
  if (!entry) return;
  let d = new FormData(document.createElement("form"));
  d.append("id", entry.id);
  d.append("rId", rId);
  $.ajax({
    url: "/php/delete.php", type: "POST", data: d,
    success: function (r) {
      if (r == 1) { overlay.classList.add("hidden"); msgClickedIndex = ""; getMessages(); }
      else { alert("Error deleting message: " + r); }
    },
    cache: false, contentType: false, processData: false,
  });
}

document.getElementById("delete").addEventListener("click", () => { del(msgClickedIndex); });
document.getElementById("bookmark").addEventListener("click", () => { bookmark(msgClickedIndex); });

// ─── GET MESSAGES ─────────────────────────────────────────────────────────────

function getMessages() {
  let d = new FormData(document.createElement("form"));
  d.append("rId", rId);
  $.ajax({
    url: "/php/fetch.php", type: "POST", data: d,
    success: function (msg) {
      let messages;
      try { messages = JSON.parse(msg); } catch(e) { return; }

      let final = "";
      dbMsg = [];
      messages.forEach((element, index) => {
        dbMsg.push({ i: index, sender: element.sender, content: element.content, id: element.id, time: element.time });
        if (element.sender == user) {
          final += `<p class="message editable"><span class="sender">${element.sender}</span>&nbsp;&nbsp;<span class="time">${element.time}</span><br><span class="msg">${element.content}</span></p><br>`;
        } else {
          final += `<p class="message bookmarkable"><span class="sender">${element.sender}</span>&nbsp;&nbsp;<span class="time">${element.time}</span><br><span class="msg">${element.content}</span></p><br>`;
        }
      });

      if (messagesDiv.innerHTML === final) return;

      messagesDiv.innerHTML = final;
      const messageEls = document.getElementsByClassName("message");
      for (let i = 0; i < messageEls.length; i++) {
        (function(idx) {
          if (messageEls[idx].classList.contains("editable")) {
            messageEls[idx].addEventListener("click", () => {
              overlay.classList.remove("hidden");
              document.getElementById("delete").classList.remove("hidden");
              msgClickedIndex = String(idx);
            });
          } else if (messageEls[idx].classList.contains("bookmarkable")) {
            messageEls[idx].addEventListener("click", () => {
              overlay.classList.remove("hidden");
              document.getElementById("delete").classList.add("hidden");
              msgClickedIndex = String(idx);
            });
          }
        })(i);
      }
      document.getElementById("messages").scrollTop = document.getElementById("messages").scrollHeight;
    },
    cache: false, contentType: false, processData: false,
  });
}

// ─── ONLINE STATUS ────────────────────────────────────────────────────────────

window.addEventListener("load", function () {
  let d = new FormData(document.createElement("form"));
  d.append("load", "true");
  $.ajax({
    url: "/php/load.php", type: "POST", data: d,
    success: function (response) {
      if (response == "1") {
        getMessages();
        getMembers();
        setInterval(getMessages, 5000);
        setInterval(getMembers, 5000);
      }
    },
    cache: false, contentType: false, processData: false,
  });
});

window.onunload = function () {
  let d = new FormData(document.createElement("form"));
  d.append("unload", "true");
  $.ajax({
    url: "/php/unload.php", type: "POST", data: d,
    cache: false, contentType: false, processData: false,
  });
};
