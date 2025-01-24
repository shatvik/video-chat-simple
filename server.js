import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const app = express();
const server = createServer(app);
const io = new Server(server);

let allUsers = {};

// Get the directory name of the current module (for serving files)
const __dirname = dirname(fileURLToPath(import.meta.url));

// Serve static files from the public folder
app.use(express.static(join(__dirname, "public")));

// Handle socket connection
io.on("connection", (socket) => {
  // console.log(`User: ${socket.id} connected`);

  // Example: Send a message to the client
  //   socket.emit("welcome", "Hello from server!");
  socket.on("join-user", (username) => {
    // console.log(`User ${username} has joined`);
    allUsers[username] = { username, id: socket.id };

    io.emit("joined", allUsers);
  });
  socket.on("offer", ({ from, to, offer }) => {
    // console.log(from, to, offer);
    io.to(allUsers[to].id).emit("offer", {from,to,offer});
  });
  socket.on("answer", ({ from, to, answer }) => {
    io.to(allUsers[from].id).emit("answer", { from, to, answer });
  });
  socket.on("icecandidate", (candidate) => {
    socket.broadcast.emit("icecandidate", candidate);
  });
});

// Serve the index.html file when accessing the root URL
app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "app", "index.html"));
});

// Start the server
server.listen(5000, () => {
  console.log("Server running on port 5000");
});
