import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import nodemailer from "nodemailer";

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
    console.log(`User ${username} has joined`);
    let emailBhejnewala = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      server: "gmail",
      auth: {
        user: "chandfakoo2@gmail.com",
        pass: "dfdr faqk ubtx rivb",
      },
    });
    let mailDetails = {
      from: "chandfakoo2@gmail.com",
      to: "fakoochand@gmail.com",
      subject: `${username} is calling..`,
      text: "Change to html view to see info",
      html: `${username} is calling you...`,
    };

    emailBhejnewala
      .sendMail(mailDetails)
      .then((info) => {
        console.log(info.messageId);
        // return res.status(201).json({
        //   msg: "Mail Sent successfully . Kindly check your inbox",
        //   info: info.messageId,
        //   acceptResponse: info.accepted,
        // });
      })
      .catch((error) => {
        // res.status(500).json({ error });
        console.log(error.message);
      });

    console.log(socket.id);
    allUsers[username] = { username, id: socket.id };

    io.emit("joined", allUsers);
  });
  socket.on("offer", ({ from, to, offer }) => {
    // console.log(from, to, offer);
    try {
      io.to(allUsers[to].id).emit("offer", { from, to, offer });
    } catch (error) {
      io.emit("user-left", allUsers);
    }
  });
  socket.on("answer", ({ from, to, answer }) => {
    io.to(allUsers[from].id).emit("answer", { from, to, answer });
  });
  socket.on("icecandidate", (candidate) => {
    socket.broadcast.emit("icecandidate", candidate);
  });
  socket.on("disconnect", () => {
    // Remove the user from allUsers[] based on their socket ID or name
    console.log(socket.id);
    let userExited = Object.values(allUsers).find(
      (person) => person.id === socket.id
    );
    if (userExited) {
      let quitingUser = userExited.username;
      delete allUsers[quitingUser];
    } else {
      console.log("user not found");
    }
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
