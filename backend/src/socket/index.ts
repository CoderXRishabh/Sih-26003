import { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";
import { PrismaClient } from "@prisma/client";
import { verifyAccessToken } from "../services/auth";
import { env } from "../config/env";

const prisma = new PrismaClient();

let io: Server;

export type SyncAction = "created" | "updated" | "deleted";

export interface SyncPayload {
  entity: string;
  action: SyncAction;
  patientId: number;
  data: any;
}

/**
 * Returns the Socket.io Server instance.
 */
export function getIO(): Server {
  if (!io) {
    throw new Error("Socket.io not initialized — call initSocket first");
  }
  return io;
}

/**
 * Single reusable function to broadcast entity changes in real time.
 * Emits 'sync' event with payload { entity, action, patientId, data }.
 */
export function broadcastSync(
  ioInstance: Server | null | undefined,
  patientId: number,
  entity: string,
  action: SyncAction,
  data: any
) {
  const serverIO = ioInstance || io;
  if (!serverIO) {
    console.warn("[broadcastSync] Socket.io instance not initialized yet");
    return;
  }

  const payload: SyncPayload = { entity, action, patientId, data };
  const roomUnderscore = `patient_${patientId}`;
  const roomColon = `patient:${patientId}`;

  serverIO.to(roomUnderscore).to(roomColon).emit("sync", payload);
  serverIO.of("/care").to(roomUnderscore).to(roomColon).emit("sync", payload);

  console.log(`[Socket Broadcast] sync -> ${entity}.${action} for patient #${patientId}`);
}

function handleSocketConnection(socket: Socket) {
  const user = (socket as any).user as { id: number; type: "patient" | "caregiver" };

  console.log(`[Socket] Connected: ${user.type} #${user.id} (${socket.id})`);

  if (user.type === "caregiver") {
    // Auto-join rooms for all actively-linked patients
    prisma.patientCaregiverLink.findMany({
      where: { caregiverId: user.id, status: "active" },
      select: { patientId: true },
    }).then((links) => {
      for (const link of links) {
        socket.join(`patient_${link.patientId}`);
        socket.join(`patient:${link.patientId}`);
        console.log(`[Socket] Caregiver #${user.id} joined rooms for patient #${link.patientId}`);
      }
    }).catch((err) => console.error("[Socket] Join error:", err));

    socket.on("subscribe:patient", (patientId: number) => {
      socket.join(`patient_${patientId}`);
      socket.join(`patient:${patientId}`);
      console.log(`[Socket] Caregiver #${user.id} subscribed to patient #${patientId}`);
    });

    socket.on("unsubscribe:patient", (patientId: number) => {
      socket.leave(`patient_${patientId}`);
      socket.leave(`patient:${patientId}`);
      console.log(`[Socket] Caregiver #${user.id} unsubscribed from patient #${patientId}`);
    });
  } else if (user.type === "patient") {
    socket.join(`patient_${user.id}`);
    socket.join(`patient:${user.id}`);
    console.log(`[Socket] Patient #${user.id} joined own rooms`);
  }

  socket.on("disconnect", () => {
    console.log(`[Socket] Disconnected: ${user.type} #${user.id}`);
  });
}

function socketAuthMiddleware(socket: Socket, next: (err?: Error) => void) {
  const token =
    socket.handshake.auth?.token ||
    socket.handshake.headers?.authorization?.replace("Bearer ", "");

  if (!token) {
    return next(new Error("Authentication required"));
  }

  try {
    const payload = verifyAccessToken(token);
    (socket as any).user = payload;
    next();
  } catch {
    next(new Error("Invalid or expired token"));
  }
}

export function initSocket(httpServer: HTTPServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN || "*",
      methods: ["GET", "POST", "PATCH", "DELETE"],
    },
  });

  // Default namespace
  io.use(socketAuthMiddleware);
  io.on("connection", handleSocketConnection);

  // /care namespace
  const careNs = io.of("/care");
  careNs.use(socketAuthMiddleware);
  careNs.on("connection", handleSocketConnection);

  return io;
}
