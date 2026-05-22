// src/pages/AdminPanel.tsx
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  Coins,
  Crown,
  Hourglass,
  Play,
  Plus,
  Sliders,
  StopCircle,
  Trophy,
  Users,
} from "lucide-react";
import { useAuthStore } from "../store/auth";
import { api } from "../services/api";
import Navbar from "../components/Navbar";

type Wheel = {
  id: string;
  title: string;
  entryFee: number;
  status: string;
  createdAt: string;
  winnerId: string | null;
  winner: { id: string; name: string } | null;
  creator: { id: string; name: string };
  _count: { participants: number };
};

type Stats = {
  pools: { totalWinnerPool: number; totalAdminPool: number; totalAppPool: number };
  percentages: { winner: number; admin: number; app: number };
  userCount: number;
  wheelCount: number;
  completedCount: number;
};

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  coins: number;
  createdAt: string;
};

export default function AdminPanel() {
  const { role } = useAuthStore();

  const [stats, setStats] = useState<Stats | null>(null);
  const [wheels, setWheels] = useState<Wheel[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [activeWheel, setActiveWheel] = useState<Wheel | null>(null);

  const [title, setTitle] = useState("");
  const [entryFee, setEntryFee] = useState(50);

  const [winnerPct, setWinnerPct] = useState(70);
  const [adminPct, setAdminPct] = useState(20);
  const [appPct, setAppPct] = useState(10);

  const refresh = async () => {
    try {
      const [s, ws, us, active] = await Promise.all([
        api.adminStats(),
        api.adminWheels(),
        api.adminUsers(),
        api.getActiveWheel().catch(() => ({ wheel: null })),
      ]);
      setStats(s);
      setWheels(ws);
      setUsers(us);
      setActiveWheel(active.wheel ?? null);
      setWinnerPct(s.percentages.winner);
      setAdminPct(s.percentages.admin);
      setAppPct(s.percentages.app);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load admin data");
    }
  };

  useEffect(() => {
    if (role !== "ADMIN") {
      toast.error("Admins only");
      return;
    }
    refresh();
    const t = setInterval(refresh, 4000);
    return () => clearInterval(t);
  }, [role]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeWheel) {
      toast.error("A wheel is already in play — abort or finish it first.");
      return;
    }
    try {
      await api.createWheel({ title, entryFee });
      toast.success("Wheel dealt!");
      setTitle("");
      await refresh();
    } catch (e: any) {
      toast.error(e?.message || "Failed to create wheel");
    }
  };

  const handleStart = async () => {
    if (!activeWheel) return;
    try {
      await api.startWheel(activeWheel.id);
      toast.success("Spin started");
      await refresh();
    } catch (e: any) {
      toast.error(e?.message || "Failed to start");
    }
  };

  const handleAbort = async () => {
    if (!activeWheel) return;
    try {
      await api.abortWheel(activeWheel.id);
      toast.success("Wheel aborted; stakes refunded");
      await refresh();
    } catch (e: any) {
      toast.error(e?.message || "Failed to abort");
    }
  };

  const handleConfigSave = async () => {
    if (winnerPct + adminPct + appPct !== 100) {
      toast.error("Percentages must sum to 100");
      return;
    }
    try {
      await api.updateConfig({
        winnerPercentage: winnerPct,
        adminPercentage: adminPct,
        appPercentage: appPct,
      });
      toast.success("Payout config updated");
      await refresh();
    } catch (e: any) {
      toast.error(e?.message || "Failed");
    }
  };

  if (role !== "ADMIN") {
    return (
      <>
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="glass-card p-8 text-center">
            <h2 className="font-display text-2xl text-crimson-500">Admins only</h2>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar title="House Office" />
      <main className="flex-1 px-4 sm:px-6 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <motion.header
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <Crown className="text-gold-400" size={28} />
            <div>
              <h1 className="font-display text-4xl font-black text-gold-gradient">House Office</h1>
              <p className="text-cream/60">Run the table, set the odds, watch the pots.</p>
            </div>
          </motion.header>

          {/* Stats */}
          <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              icon={<Users size={18} />}
              label="Players"
              value={stats?.userCount ?? "—"}
            />
            <StatCard
              icon={<Hourglass size={18} />}
              label="Total Wheels"
              value={stats?.wheelCount ?? "—"}
            />
            <StatCard
              icon={<Trophy size={18} />}
              label="Completed"
              value={stats?.completedCount ?? "—"}
            />
            <StatCard
              icon={<Coins size={18} />}
              label="House Pool"
              value={stats?.pools.totalAdminPool ?? "—"}
              gold
            />
          </section>

          <section className="grid lg:grid-cols-3 gap-4">
            <PoolCard label="Winner Pool" value={stats?.pools.totalWinnerPool ?? 0} pct={stats?.percentages.winner ?? 0} />
            <PoolCard label="Admin Pool" value={stats?.pools.totalAdminPool ?? 0} pct={stats?.percentages.admin ?? 0} />
            <PoolCard label="App Pool" value={stats?.pools.totalAppPool ?? 0} pct={stats?.percentages.app ?? 0} />
          </section>

          {/* Active Wheel + Create */}
          <section className="grid lg:grid-cols-2 gap-4">
            <div className="glass-card p-5">
              <h3 className="font-display text-xl text-gold-400 mb-3 flex items-center gap-2">
                <Plus size={18} /> Deal a new Wheel
              </h3>
              <form onSubmit={handleCreate} className="space-y-3">
                <div>
                  <label className="label-casino">Title</label>
                  <input
                    className="input-casino"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Friday Night Royale"
                    required
                  />
                </div>
                <div>
                  <label className="label-casino">Entry fee (chips)</label>
                  <input
                    className="input-casino"
                    type="number"
                    min={1}
                    value={entryFee}
                    onChange={(e) => setEntryFee(Number(e.target.value))}
                    required
                  />
                </div>
                <button type="submit" className="btn-gold w-full" disabled={!!activeWheel}>
                  {activeWheel ? "Wheel already in play" : "Deal Wheel"}
                </button>
              </form>
            </div>

            <div className="glass-card p-5">
              <h3 className="font-display text-xl text-gold-400 mb-3">Active Wheel</h3>
              {activeWheel ? (
                <div className="space-y-2">
                  <p className="text-cream"><span className="text-cream/60">Title: </span>{activeWheel.title}</p>
                  <p className="text-cream"><span className="text-cream/60">Entry fee: </span>{activeWheel.entryFee} chips</p>
                  <p className="text-cream"><span className="text-cream/60">Status: </span><span className="chip">{activeWheel.status}</span></p>
                  <p className="text-cream"><span className="text-cream/60">Players: </span>{activeWheel._count.participants}</p>
                  <div className="flex gap-2 pt-2">
                    {activeWheel.status === "WAITING" && (
                      <button onClick={handleStart} className="btn-gold flex items-center gap-2">
                        <Play size={16} /> Start Spin
                      </button>
                    )}
                    <button onClick={handleAbort} className="btn-crimson flex items-center gap-2">
                      <StopCircle size={16} /> Abort
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-cream/60 italic">No wheel in play. Deal one to get started.</p>
              )}
            </div>
          </section>

          {/* Config */}
          <section className="glass-card p-5">
            <h3 className="font-display text-xl text-gold-400 mb-3 flex items-center gap-2">
              <Sliders size={18} /> Payout Config (sum must = 100)
            </h3>
            <div className="grid sm:grid-cols-3 gap-3">
              <PctInput label="Winner %" value={winnerPct} setValue={setWinnerPct} />
              <PctInput label="Admin %" value={adminPct} setValue={setAdminPct} />
              <PctInput label="App %" value={appPct} setValue={setAppPct} />
            </div>
            <div className="flex items-center gap-3 mt-3">
              <span className={`chip ${winnerPct + adminPct + appPct === 100 ? "" : "chip-crimson"}`}>
                Sum: {winnerPct + adminPct + appPct}
              </span>
              <button onClick={handleConfigSave} className="btn-gold ml-auto">
                Save Config
              </button>
            </div>
          </section>

          {/* Wheels table */}
          <section className="glass-card p-5">
            <h3 className="font-display text-xl text-gold-400 mb-3">Recent Wheels</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-cream/60 text-left font-display">
                  <tr>
                    <th className="py-2">Title</th>
                    <th>Status</th>
                    <th>Fee</th>
                    <th>Players</th>
                    <th>Winner</th>
                    <th>Dealt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold-700/20">
                  {wheels.map((w) => (
                    <tr key={w.id} className="text-cream">
                      <td className="py-2">{w.title}</td>
                      <td><span className="chip text-xs">{w.status}</span></td>
                      <td>{w.entryFee}</td>
                      <td>{w._count.participants}</td>
                      <td>{w.winner?.name ?? "—"}</td>
                      <td className="text-cream/60">{new Date(w.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                  {wheels.length === 0 && (
                    <tr><td className="py-3 text-cream/50 italic" colSpan={6}>No wheels yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Users table */}
          <section className="glass-card p-5">
            <h3 className="font-display text-xl text-gold-400 mb-3">Players (Leaderboard by chips)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-cream/60 text-left font-display">
                  <tr>
                    <th className="py-2">#</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Chips</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold-700/20">
                  {users.map((u, i) => (
                    <tr key={u.id} className="text-cream">
                      <td className="py-2 text-gold-400 font-bold">{i + 1}</td>
                      <td>{u.name}</td>
                      <td className="text-cream/70">{u.email}</td>
                      <td>
                        <span className={u.role === "ADMIN" ? "chip" : "chip-felt chip"}>
                          {u.role}
                        </span>
                      </td>
                      <td className="font-bold">{u.coins.toLocaleString()}</td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr><td className="py-3 text-cream/50 italic" colSpan={5}>No players yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

function StatCard({
  icon,
  label,
  value,
  gold,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  gold?: boolean;
}) {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 text-cream/60 text-xs uppercase tracking-widest">
        {icon}
        {label}
      </div>
      <div className={`mt-1 font-display text-3xl font-black ${gold ? "text-gold-gradient" : "text-cream"}`}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
    </div>
  );
}

function PoolCard({ label, value, pct }: { label: string; value: number; pct: number }) {
  return (
    <div className="glass-card p-5">
      <div className="text-cream/60 text-xs uppercase tracking-widest">{label}</div>
      <div className="mt-1 font-display text-4xl font-black text-gold-gradient">
        {value.toLocaleString()}
      </div>
      <div className="text-cream/60 text-xs mt-1">{pct}% of each pot</div>
    </div>
  );
}

function PctInput({
  label,
  value,
  setValue,
}: {
  label: string;
  value: number;
  setValue: (n: number) => void;
}) {
  return (
    <div>
      <label className="label-casino">{label}</label>
      <input
        className="input-casino"
        type="number"
        min={0}
        max={100}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
      />
    </div>
  );
}
