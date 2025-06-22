const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

mongoose.connect("mongodb://127.0.0.1:27017/omegle", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: "secret123",
  resave: false,
  saveUninitialized: false
}));

// Routes
app.use("/", require("./routes/auth"));
app.use("/video", require("./routes/video"));

// Socket.IO signaling for WebRTC
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

http.listen(3000, () => console.log("Server started on http://localhost:3000"));
