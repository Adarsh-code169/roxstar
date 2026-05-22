// src/services/socket.ts
import { io, Socket } from "socket.io-client";
import { socketUrl } from "../config";

export const socket: Socket = io(socketUrl, {
  autoConnect: false,
  auth: (cb) => {
    cb({ token: localStorage.getItem("auth-token") ?? undefined });
  },
});

export const connectSocket = () => {
  if (!socket.connected) socket.connect();
};

export const disconnectSocket = () => {
  if (socket.connected) socket.disconnect();
};
