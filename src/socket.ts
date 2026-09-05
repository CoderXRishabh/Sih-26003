import { io, Socket } from "socket.io-client";
import { getAccessToken, getStoredRole } from "./api";

const SOCKET_URL = "http://localhost:4000";

export interface SyncPayload {
  entity: string;
  action: "created" | "updated" | "deleted";
  patientId: number;
  data: any;
}

type SyncCallback = (payload: SyncPayload) => void;

let socket: Socket | null = null;
const syncListeners: Set<SyncCallback> = new Set();

export function getSocket(): Socket | null {
  return socket;
}

export function initSocketConnection(tokenOverride?: string): Socket | null {
  const token = tokenOverride || getAccessToken();
  if (!token) {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    return null;
  }

  const role = getStoredRole();
  const namespace = role === "caregiver" ? "/care" : "";

  if (socket) {
    if (socket.connected) return socket;
    socket.connect();
    return socket;
  }

  socket = io(`${SOCKET_URL}${namespace}`, {
    auth: { token },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
  });

  socket.on("connect", () => {
    console.log("[Socket.io] Connected to server, id:", socket?.id);
  });

  socket.on("sync", (payload: SyncPayload) => {
    console.log("[Socket.io] Sync event received:", payload);
    syncListeners.forEach((listener) => {
      try {
        listener(payload);
      } catch (err) {
        console.error("[Socket.io] Error in sync listener:", err);
      }
    });
  });

  socket.on("disconnect", (reason) => {
    console.warn("[Socket.io] Disconnected:", reason);
  });

  socket.on("connect_error", (err) => {
    console.error("[Socket.io] Connection error:", err.message);
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function subscribeSync(callback: SyncCallback): () => void {
  syncListeners.add(callback);
  return () => {
    syncListeners.delete(callback);
  };
}
