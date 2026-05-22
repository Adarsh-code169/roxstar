// src/services/api.ts
import { apiBaseUrl } from "../config";

const defaultHeaders = (token?: string) => ({
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

export const api = {
  async login({ email, password }: { email: string; password: string }) {
    const res = await fetch(`${apiBaseUrl}/auth/login`, {
      method: "POST",
      headers: defaultHeaders(),
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error("Login failed");
    const data = await res.json();
    return {
      token: data.token,
      userId: data.user.id,
      role: data.user.role,
    };
  },

  async register({ name, email, password, adminCode }: { name: string; email: string; password: string; adminCode?: string }) {
    const res = await fetch(`${apiBaseUrl}/auth/register`, {
      method: "POST",
      headers: defaultHeaders(),
      body: JSON.stringify({ name, email, password, ...(adminCode ? { adminCode } : {}) }),
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.message || "Register failed");
    }
    const data = await res.json();
    return {
      token: data.token,
      userId: data.user.id,
      role: data.user.role,
    };
  },

  async me() {
    const token = localStorage.getItem("auth-token");
    const res = await fetch(`${apiBaseUrl}/auth/me`, {
      method: "GET",
      headers: defaultHeaders(token ?? undefined),
    });
    if (!res.ok) throw new Error("Not authenticated");
    return await res.json();
  },

  async getActiveWheel() {
    const token = localStorage.getItem("auth-token");
    const res = await fetch(`${apiBaseUrl}/wheels/active`, {
      method: "GET",
      headers: defaultHeaders(token ?? undefined),
    });
    if (!res.ok) throw new Error("Failed to fetch active wheel");
    return await res.json();
  },

  async joinWheel(wheelId: string) {
    const token = localStorage.getItem("auth-token");
    const res = await fetch(`${apiBaseUrl}/participants/${wheelId}/join`, {
      method: "POST",
      headers: defaultHeaders(token ?? undefined),
    });
    if (!res.ok) throw new Error("Join wheel failed");
    return await res.json();
  },

  async createWheel({ title, entryFee }: { title: string; entryFee: number }) {
    const token = localStorage.getItem("auth-token");
    const res = await fetch(`${apiBaseUrl}/wheels`, {
      method: "POST",
      headers: defaultHeaders(token ?? undefined),
      body: JSON.stringify({ title, entryFee }),
    });
    if (!res.ok) throw new Error("Create wheel failed");
    return await res.json();
  },

  async startWheel(wheelId: string) {
    const token = localStorage.getItem("auth-token");
    const res = await fetch(`${apiBaseUrl}/wheels/${wheelId}/start`, {
      method: "PATCH",
      headers: defaultHeaders(token ?? undefined),
    });
    if (!res.ok) throw new Error("Start wheel failed");
    return await res.json();
  },

  async abortWheel(wheelId: string) {
    const token = localStorage.getItem("auth-token");
    const res = await fetch(`${apiBaseUrl}/wheels/${wheelId}/abort`, {
      method: "PATCH",
      headers: defaultHeaders(token ?? undefined),
    });
    if (!res.ok) throw new Error("Abort wheel failed");
    return await res.json();
  },

  async adminStats() {
    const token = localStorage.getItem("auth-token");
    const res = await fetch(`${apiBaseUrl}/admin/stats`, { headers: defaultHeaders(token ?? undefined) });
    if (!res.ok) throw new Error("Failed to fetch stats");
    return await res.json();
  },

  async adminWheels() {
    const token = localStorage.getItem("auth-token");
    const res = await fetch(`${apiBaseUrl}/admin/wheels`, { headers: defaultHeaders(token ?? undefined) });
    if (!res.ok) throw new Error("Failed to fetch wheels");
    return await res.json();
  },

  async adminUsers() {
    const token = localStorage.getItem("auth-token");
    const res = await fetch(`${apiBaseUrl}/admin/users`, { headers: defaultHeaders(token ?? undefined) });
    if (!res.ok) throw new Error("Failed to fetch users");
    return await res.json();
  },

  async updateConfig(payload: { winnerPercentage: number; adminPercentage: number; appPercentage: number }) {
    const token = localStorage.getItem("auth-token");
    const res = await fetch(`${apiBaseUrl}/admin/config`, {
      method: "PATCH",
      headers: defaultHeaders(token ?? undefined),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to update config");
    }
    return await res.json();
  },

  async getLeaderboard() {
    const token = localStorage.getItem("auth-token");
    const res = await fetch(`${apiBaseUrl}/users/leaderboard`, {
      method: "GET",
      headers: defaultHeaders(token ?? undefined),
    });
    if (!res.ok) throw new Error("Failed to fetch leaderboard");
    return await res.json();
  },

  // Additional helper for admin actions (create/start/abort) can be added later
};
