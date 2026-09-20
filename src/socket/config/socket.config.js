import { io } from "socket.io-client";

const SOCKET_URL = (import.meta.env.VITE_REALTIME_URL || "http://localhost:8000").replace(/\/+$/, "");

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  withCredentials: true,
});

export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};