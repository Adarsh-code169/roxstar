// src/store/auth.ts
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

type AuthState = {
  token: string | null;
  userId: string | null;
  role: "ADMIN" | "USER" | null;
  setAuth: (token: string, userId: string, role: "ADMIN" | "USER") => void;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        token: null,
        userId: null,
        role: null,
        setAuth: (token, userId, role) => { localStorage.setItem("auth-token", token); set({ token, userId, role }); },
        clearAuth: () => { localStorage.removeItem("auth-token"); set({ token: null, userId: null, role: null }); },
      }),
      { name: "auth-storage" }
    )
  )
);
