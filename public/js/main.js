let socket = io();
const username = document.getElementById("username");
const submitBtn = document.getElementById("submit-button");
const allUserList = document.getElementById("allUserList");

let remotevideo = document.getElementById("remotevideo");
let localvideo = document.getElementById("localvideo");
let localstream;

// const localvideobtn = document.getElementById("localvideobtn");
// localvideobtn.addEventListener("click", () => {
//   localvideo.controls = true;
//   // localvideo.pause();
// });
// const localaudiobtn = document.getElementById("localaudiobtn");
// localaudiobtn.addEventListener("click", () => {
//   localvideo.muted = true;
// });

const PeerConnection = (function () {
  let peerConnection;
  const createPeerConnection = () => {
    const config = {
      iceServers: [{ url: "stun:stun.l.google.com:19302" }],
    };
    peerConnection = new RTCPeerConnection(config);

    localstream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localstream);
    });
    peerConnection.ontrack = function (event) {
      remotevideo.srcObject = event.streams[0];
    };
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("icecandidate", event.candidate);
      }
    };
    return peerConnection;
  };
  return {
    getInstance: () => {
      if (!peerConnection) {
        peerConnection = createPeerConnection();
      }
      return peerConnection;
    },
  };
})();

submitBtn.addEventListener("click", () => {
  if (username.value !== "") {
    socket.emit("join-user", username.value);
  }
  const nameContainer = document.querySelector(".name-container");
  nameContainer.style.display = "none";
});

socket.on("joined", (allUsers) => {
  // console.log({ allUsers });

  function createUserHtml() {
    allUserList.innerHTML = "";
    for (const user in allUsers) {
      const li = document.createElement("li");
      li.textContent = `${user} ${user === username.value ? "(You)" : ""}`;

      if (user !== username.value) {
        const button = document.createElement("button");
        button.innerText = "Call";
        button.addEventListener("click", (e) => {
          startCall(user);
        });
        li.appendChild(button);
        allUserList.appendChild(li);
      }
    }
  }

  createUserHtml();
});

socket.on("offer", async ({ from, to, offer }) => {
  // console.log(from, to, offer.sdp);
  const pc = PeerConnection.getInstance();
  await pc.setRemoteDescription(offer);
  const answer = pc.createAnswer();
  await pc.setLocalDescription(answer);
  // console.log(pc.localDescription);
  socket.emit("answer", { from, to, answer: pc.localDescription });
});

socket.on("answer", async ({ from, to, answer }) => {
  const pc = PeerConnection.getInstance();
  await pc.setRemoteDescription(answer);
});

socket.on("icecandidate", async (candidate) => {
  const pc = PeerConnection.getInstance();
  await pc.addIceCandidate(new RTCIceCandidate(candidate));
});

const startCall = async (user) => {
  // console.log({ user });
  const pc = PeerConnection.getInstance();
  // console.log("pc ", pc);
  const offer = await pc.createOffer();
  // console.log("offer ", offer);
  await pc.setLocalDescription(offer);
  // console.log(
  //   "caller " +
  //     username.value +
  //     "......calling : " +
  //     user +
  //     "...offer : " +
  //     pc.localDescription.sdp
  // );
  socket.emit("offer", {
    from: username.value,
    to: user,
    offer: pc.localDescription,
  });
};

const startMyVideo = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    localstream = stream;
    localvideo.srcObject = stream;
    // console.log(localvideo.srcObject);
  } catch (error) {
    console.error({ error });
  }
};

startMyVideo();
