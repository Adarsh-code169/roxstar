// src/store/wheel.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { api } from "../services/api";
import { socket } from "../services/socket";

type Participant = {
  userId: string;
  userName: string;
  eliminated: boolean;
};

type Wheel = {
  id: string;
  title: string;
  entryFee: number;
  status: "WAITING" | "RUNNING" | "COMPLETED" | "ABORTED";
};

type WheelState = {
  wheel: Wheel | null;
  participants: Participant[];
  status: string;
  countdown: number;
  loadWheel: () => Promise<void>;
  joinWheel: (wheelId: string) => Promise<void>;
  setSocketHandlers: (io: typeof socket) => void;
};

export const useWheelStore = create<WheelState>()(
  devtools(set => ({
    wheel: null,
    participants: [],
    status: "",
    countdown: 0,
    async loadWheel() {
      const data = await api.getActiveWheel();
      set({
        wheel: data.wheel,
        participants: data.participants ?? [],
        status: data.wheel?.status ?? "",
        countdown: data.countdown ?? 0,
      });
    },
    async joinWheel(wheelId: string) {
      await api.joinWheel(wheelId);
      // after successful join, reload wheel state
      await this.loadWheel();
    },
    setSocketHandlers(io) {
      // ensure we don't attach multiple listeners
      io.off("wheelUpdated");
      io.on("wheelUpdated", (payload: any) => {
        // payload contains wheel, participants, status, countdown
        set({
          wheel: payload.wheel,
          participants: payload.participants,
          status: payload.status,
          countdown: payload.countdown ?? 0,
        });
      });
      io.off("wheelCompleted");
      io.on("wheelCompleted", (payload: any) => {
        set({
          wheel: { ...payload.wheel, status: "COMPLETED" },
          participants: payload.participants,
          status: "COMPLETED",
        });
      });
    },
  }))
);
