const signup = document.getElementById("form");
const username = document.getElementById("username");
const password = document.getElementById("password");
const canvas = document.getElementById("left-animate");
const ctx = canvas.getContext("2d");

signup.addEventListener("submit", function (e) {
  const check =
    document.getElementById("keep_logged").checked == true ? "true" : "false";
  e.preventDefault();
  let data = new FormData(this);
  data.append("keep_logged", check);
  if (
    username.value.length > 5 &&
    username.value.length < 15 &&
    password.value.length > 5 &&
    password.value.length < 15
  ) {
    if (!username.value.includes(",")) {
      $.ajax({
        url: "./php/signup.php",
        type: "POST",
        data: data,
        success: function (msg) {
          if (msg == 1) {
            console.log("success");
            location.href = "index.php";
          } else if (msg == 0) {
            alert("There was an error creating your account.");
          } else if (msg == 2) {
            alert("Username is already taken.");
          } else {
            alert(`An unknown error occured: ${msg}`);
          }
        },
        cache: false,
        contentType: false,
        processData: false,
      });
    } else {
      alert("Character ',' is not allowed in the username");
    }
  } else {
    alert("Username and password must be between 5 and 15 characters.");
  }
});

class Rectangle {
  constructor(x, y, width, height, color) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
  }

  draw() {
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.rect(this.x, this.y, this.width, this.height);
    ctx.fill();
  }

  update() {
    this.draw();
    this.y += 5;
    if (this.y >= canvas.height) {
      this.y = canvas.height - this.height * 3;
    }
  }
}

const dpr = window.devicePixelRatio;
const rect = canvas.getBoundingClientRect();
let increment = 0;

canvas.width = rect.width * dpr;
canvas.height = rect.height * dpr;

ctx.scale(dpr, dpr);

let rectangles = [];
let interval = setInterval(function () {
  rectangles.push(
    new Rectangle(
      (canvas.width / 6) * increment,
      -canvas.height,
      canvas.width / 6,
      canvas.height,
      "#abcbff"
    )
  );
  increment++;
  if (increment == 5) {
    clearInterval(interval);
  }
}, 500);

function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  rectangles.forEach((element) => {
    element.update();
  });

  if (
    innerWidth <= 747 &&
    document.getElementsByClassName("left")[0] != undefined
  ) {
    document.getElementsByClassName("left")[0].remove();
    document.getElementsByClassName("right")[0].style.width = "100vw";
  }

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
