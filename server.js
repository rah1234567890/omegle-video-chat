const express = require("express");
const session = require("express-session");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

// Use PORT from Render or fallback to 3000 locally
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: "secret123",
  resave: false,
  saveUninitialized: false
}));

// Routes (auth and video pages)
app.use("/", require("./routes/auth"));
app.use("/video", require("./routes/video"));

// WebRTC signaling logic via Socket.IO
const connectedUsers = {};

io.on("connection", socket => {
  console.log("Socket connected:", socket.id);

  socket.on("join", userId => {
    connectedUsers[userId] = socket.id;
    socket.broadcast.emit("user-online", userId);
  });

  socket.on("signal", ({ to, from, signal }) => {
    if (connectedUsers[to]) {
      io.to(connectedUsers[to]).emit("signal", { from, signal });
    }
  });

  socket.on("disconnect", () => {
    for (let userId in connectedUsers) {
      if (connectedUsers[userId] === socket.id) {
        delete connectedUsers[userId];
        io.emit("user-offline", userId);
        break;
      }
    }
  });
});

// Start the server
http.listen(PORT, () => {
  console.log("Server started on port " + PORT);
});
