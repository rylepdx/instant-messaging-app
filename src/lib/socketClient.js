import { io } from "socket.io-client";

const SERVER_URL = import.meta.env.VITE_SERVER_URL;

let socket = null;
let onMessageReceived = null;

export function setMessageHandler(handler) {
  onMessageReceived = handler;
}

export function initializeSocket(userId) {
  if (socket && socket.connected) return socket;
  if (socket) socket.disconnect();

  socket = io(SERVER_URL, {
    withCredentials: true,
    transports: ["websocket"],
    autoConnect: true,
    query: { userId },
    extraHeaders: { "ngrok-skip-browser-warning": "true" },
  });

  socket.on("connect", () => {
    console.log("connected:", socket.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("disconnected:", reason);
  });

  socket.on("receiveMessage", (msg) => {
    console.log("receiveMessage fired:", msg);
    if (onMessageReceived) onMessageReceived(msg);
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
