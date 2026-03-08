console.log("%cWARNING", "color: red;font-size:3rem;");
console.log(
  "%cDo not paste any code over here that you do not understand, your account can be hacked.",
  "color:yellow;font-size:1.2em;"
);
console.log(
  "%cIf someone is telling you to paste any code here, you are most likely being hacked or scammed.",
  "color:yellow;font-size:1.2em;"
);

const canvas = document.getElementById("background");
const ctx = canvas.getContext("2d");
const alertContainer = document.getElementById("alerts");
const roomsCont = document.getElementById("rooms");
const online = document.getElementById("onlineCont");
const all = document.getElementById("allCont");
const pending = document.getElementById("pendingCont");
const add = document.getElementById("addCont");
const pendingCont = document.getElementById("pendingDiv");
const allFriends = document.getElementById("all-friends");
const onlineFriends = document.getElementById("online-friends");

const dpr = window.devicePixelRatio;
const rect = canvas.getBoundingClientRect();

canvas.width = rect.width * dpr;
canvas.height = rect.height * dpr;

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

function getCookie(cname) {
  let name = cname + "=";
  let ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == " ") {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

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
      } else {
        console.log("Online update failed");
      }
    },
    cache: false,
    contentType: false,
    processData: false,
  });
});

let circles = [];
let mouse = { x: 100, y: 100 };
window.addEventListener("mousemove", (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

class Circle {
  constructor(x, y, radius, color, speed) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.theta = 0;
    this.speed = speed;
  }
  draw() {
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
    ctx.fill();
  }
  update() {
    this.draw();
    this.theta = Math.atan2(
      mouse.y - canvas.height / 2,
      mouse.x - canvas.width / 2
    );
    this.x += Math.cos(this.theta) * this.speed;
    this.y += Math.sin(this.theta) * this.speed;
    if (this.x >= canvas.width) {
      this.x = 0;
    } else if (this.y >= canvas.height) {
      this.y = 0;
    } else if (this.x <= 0) {
      this.x = canvas.width;
    } else if (this.y <= 0) {
      this.y = canvas.height;
    }
  }
}

for (let i = 0; i < Math.floor(canvas.width / 10); i++) {
  circles.push(
    new Circle(
      Math.random() * canvas.width,
      Math.random() * canvas.height,
      Math.floor(Math.random() * 4),
      "white",
      2
    )
  );
}

function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  circles.forEach((element) => {
    element.update();
  });
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

function notify(type, title, description) {
  if (type == "error") {
    alertContainer.innerHTML += `
        <div class="alert-box alert-error">
          <div class="top">
            <h2 class="title">${title}</h2>
            <button class="closeBtn" onclick="this.parentElement.parentElement.style.display='none'">x</button>
          </div>
          <p class="description">${description}</p>
        </div>`;
  } else if (type == "success") {
    alertContainer.innerHTML += `
        <div class="alert-box alert-success">
          <div class="top">
            <h2 class="title">${title}</h2>
            <button class="closeBtn" onclick="this.parentElement.parentElement.style.display='none'">x</button>
          </div>
          <p class="description">${description}</p>
        </div>`;
  } else if (type == "info") {
    alertContainer.innerHTML += `
        <div class="alert-box alert-info">
          <div class="top">
            <h2 class="title">${title}</h2>
            <button class="closeBtn" onclick="this.parentElement.parentElement.style.display='none'">x</button>
          </div>
          <p class="description">${description}</p>
        </div>`;
  }
}

document.getElementById("create").addEventListener("click", function () {
  const rName = prompt("Enter a name for your room: ");
  if (rName != "" && rName != null) {
    let form = document.createElement("form");
    let data = new FormData(form);
    data.append("name", rName);
    $.ajax({
      url: "./php/create.php",
      type: "POST",
      data: data,
      success: function (response) {
        if (response.includes("Error") == false) {
          console.log("Room created");
          document.getElementById("success-alert").classList.remove("hidden");
          document.getElementById("title").innerHTML = "Success!";
          document.getElementById(
            "description"
          ).innerHTML = `Your room ID is ${response}<button class="copy" onclick="navigator.clipboard.writeText('${response}');alert('Copied!');"><i class="fa-regular fa-copy"></i></button><br><br>Link to invite: <a href="${
            location.protocol +
            "//" +
            location.host +
            "/Chat Room/invite.php?id=" +
            response
          }" target="_blank">${
            location.protocol +
            "//" +
            location.host +
            "/Chat Room/invite.php?id=" +
            response
          }</a><button class="copy" onclick="navigator.clipboard.writeText('${
            location.protocol +
            "//" +
            location.host +
            "/Chat Room/invite.php?id=" +
            response
          }');alert('Copied!');"><i class="fa-regular fa-copy"></i></button>`;
        } else {
          notify("error", "Error", "An error occured: " + response);
        }
      },
      cache: false,
      contentType: false,
      processData: false,
    });
  } else {
    alert("Name not found");
  }
});

document.getElementById("close").onclick = () => {
  document.getElementById("success-alert").classList.toggle("hidden");
};

document.getElementById("join").addEventListener("click", function () {
  let id = prompt("Enter the id of the room you want to join:");
  if (id != "" && id != null) {
    let form = document.createElement("form");
    let data = new FormData(form);
    data.append("id", id);
    $.ajax({
      url: "./php/join.php",
      type: "POST",
      data: data,
      success: function (response) {
        if (response == 1) {
          location.href = `room.php?id=${id}`;
        } else if (response == 2) {
          notify("error", "Error", "Given room ID not found");
        } else if (response == 3) {
          notify("error", "Error", "A database error occured");
        } else if (response == 4) {
          location.href = `room.php?id=${id}`;
        } else if (response == 5) {
          notify("error", "ERROR", "You are banned in this room");
        } else {
          notify("error", "ERROR", `An unknown error occured: ${response}`);
        }
      },
      cache: false,
      contentType: false,
      processData: false,
    });
  } else {
    alert("ID not entered");
  }
});

function getRooms() {
  roomsCont.innerHTML = "<h2>Your rooms</h2>";
  $.ajax({
    url: "./php/rooms.php",
    type: "POST",
    data: { novalue: JSON.stringify({ novalue: true }) },
    success: function (response) {
      let rooms = JSON.parse(response);
      if (rooms.length != 0) {
        rooms.forEach((element) => {
          roomsCont.innerHTML += `
      <div class="room">
        <p class="name">${element[0]}</p>
        <button id="view" onclick="location.href='room.php?id=${element[1]}'">View</button>
      </div>`;
        });
      } else {
        roomsCont.innerHTML +=
          "<p class='none'>You haven't joined any rooms</p>";
      }
    },
    cache: false,
    contentType: false,
    processData: false,
  });
}

getRooms();
setInterval(getRooms, 5000);

function deleteBookmark(id) {
  if (!confirm("Are you sure you want to delete this bookmark?")) {
    return;
  }
  let form = document.createElement("form");
  let data = new FormData(form);
  data.append("id", id);
  $.ajax({
    url: "./php/deleteBookmark.php",
    type: "POST",
    data: data,
    success: function (response) {
      if (response == 1) {
        openBookmarks();
      }
    },
    cache: false,
    contentType: false,
    processData: false,
  });
}

function openBookmarks() {
  document.getElementById("bookmark").innerHTML = `
  <h1 class="title">Your bookmarks</h1>
  <button id="closeBookmarks" onclick='document.getElementById("bookmark").classList.add("hidden")'><i class="fa-solid fa-xmark" style="color:red;"></i></button>
  <div class="bookmarks" id="bookmarks"></div>
  `;
  document.getElementById("bookmark").classList.remove("hidden");
  $.ajax({
    url: "./php/getBookmarks.php",
    type: "POST",
    data: { novalue: JSON.stringify({ novalue: true }) },
    success: function (response) {
      let bookmarks = JSON.parse(response);
      console.log(bookmarks);
      bookmarks.forEach((element) => {
        document.getElementById("bookmarks").innerHTML += `
        <div class="saved">
          <p class="message"><span class="sender">${element.sender}</span>&nbsp;&nbsp;<span class="time">${element.time}</span><br><span class="msg">${element.content}</span></p><br>
          <button class="delete-bookmark" onclick="deleteBookmark('${element.id}')"><i class="fa-solid fa-delete-left"></i><br>Delete</div>
        </div>`;
      });
    },
    cache: false,
    contentType: false,
    processData: false,
  });
}

function accept(username) {
  let form = document.createElement("form");
  let data = new FormData(form);
  data.append("user", username);
  $.ajax({
    url: "./php/acceptRequest.php",
    type: "POST",
    data: data,
    success: function (response) {
      if (response == 1) {
        alert(username + " is now your friend");
        location.reload();
      } else if (response == 0) {
        alert("There was an error updating the database");
      } else if (response == 2) {
        alert("This user has not sent you a friend request");
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

$.ajax({
  url: "./php/getPending.php",
  type: "POST",
  data: { novalue: JSON.stringify({ novalue: true }) },
  success: function (response) {
    let pending = JSON.parse(response);
    pending.forEach((element) => {
      pendingCont.innerHTML += `
      <div class="request">
        <p class="sender">${element}</p>
        <button class="acc" onclick="accept('${element}')"><i class="fa-solid fa-check" style="color:rgb(0, 255, 0);"></i></button>
      </div>
      `;
    });
    document.getElementById("countPending").innerHTML = pending.length;
  },
  cache: false,
  contentType: false,
  processData: false,
});

$.ajax({
  url: "./php/getAllFriends.php",
  type: "POST",
  data: { novalue: JSON.stringify({ novalue: true }) },
  success: function (response) {
    let friends = JSON.parse(response);
    friends.forEach((element) => {
      allFriends.innerHTML += `
      <div class="friend">
        <p class="name">${element}</p>
        <button class="dm" onclick="createDm('${element}')"><i class="fa-solid fa-paper-plane"></i></button>
      </div>
      `;
    });
    document.getElementById("countAll").innerHTML = friends.length;
  },
  cache: false,
  contentType: false,
  processData: false,
});

$.ajax({
  url: "./php/getOnlineFriends.php",
  type: "POST",
  data: { novalue: JSON.stringify({ novalue: true }) },
  success: function (response) {
    let online = JSON.parse(response);
    console.log(online);
    online.forEach((element) => {
      onlineFriends.innerHTML += `
      <div class="person">
        <p class="name">${element}</p>
        <button class="dm" onclick="createDm('${element}')"><i class="fa-solid fa-paper-plane"></i></button>
      </div>
      `;
    });
    document.getElementById("countOnline").innerHTML = online.length;
  },
  cache: false,
  contentType: false,
  processData: false,
});

function openFriends() {
  document.getElementById("friendsDiv").classList.remove("hidden");
}

document.getElementById("online").addEventListener("click", () => {
  online.classList.remove("hidden");
  all.classList.add("hidden");
  pending.classList.add("hidden");
  add.classList.add("hidden");
});

document.getElementById("all").addEventListener("click", () => {
  online.classList.add("hidden");
  all.classList.remove("hidden");
  pending.classList.add("hidden");
  add.classList.add("hidden");
});

document.getElementById("pending").addEventListener("click", () => {
  online.classList.add("hidden");
  all.classList.add("hidden");
  pending.classList.remove("hidden");
  add.classList.add("hidden");
});

document.getElementById("add").addEventListener("click", () => {
  online.classList.add("hidden");
  all.classList.add("hidden");
  pending.classList.add("hidden");
  add.classList.remove("hidden");
});

document.getElementById("closeFriends").addEventListener("click", () => {
  document.getElementById("friendsDiv").classList.add("hidden");
});

document.getElementById("sendRequest").addEventListener("click", () => {
  const username = document.getElementById("username-friend").value;
  if (username.replace("/[ ]+/g", "") != "") {
    let form = document.createElement("form");
    let data = new FormData(form);
    data.append("user", username);
    $.ajax({
      url: "./php/sendRequest.php",
      type: "POST",
      data: data,
      success: function (response) {
        if (response == 1) {
          notify(
            "success",
            "Request sent",
            `Your request to ${username} has been sent.`
          );
        } else if (response == 2) {
          notify("error", "Username not found", "Username not found");
        } else if (response == 0) {
          notify(
            "error",
            "An error occured",
            "An error occured in the back end"
          );
        } else {
          alert(response);
        }
      },
      cache: false,
      contentType: false,
      processData: false,
    });
  }
});
// TODO: TOMORROW MAKE IT CHECK IF REQUEST IS SENT TO EXISTING FRIEND
