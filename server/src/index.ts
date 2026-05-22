// src/index.ts
import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import http from "http";
import { Server as SocketServer } from "socket.io";
import prisma from "./prisma";
import authRoutes from "./routes/authRoutes";
import wheelRoutes from "./routes/wheelRoutes";
import participantRoutes from "./routes/participantRoutes";
import adminRoutes from "./routes/adminRoutes";
import { errorHandler } from "./middleware/errorHandler";
import { initializeSocket } from "./socket";
import { seedAdmin, seedConfig } from "./utils/seed";

dotenv.config();

const app = express();

app.use(express.json());
const allowedOrigins = (process.env.CLIENT_URL ?? "http://localhost:5173,http://localhost:5174")
  .split(",")
  .map((s) => s.trim());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(helmet());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/wheels", wheelRoutes);
app.use("/api/participants", participantRoutes);
app.use("/api/admin", adminRoutes);

app.use(errorHandler);

const server = http.createServer(app);
const io = new SocketServer(server, {
  cors: { origin: allowedOrigins, methods: ["GET", "POST"] },
});
initializeSocket(io, prisma);

const PORT = process.env.PORT || 5000;

(async () => {
  await seedAdmin(prisma);
  await seedConfig(prisma);
  server.listen(PORT, () => {
    console.log(`🚀 Server listening on port ${PORT}`);
  });
})();
