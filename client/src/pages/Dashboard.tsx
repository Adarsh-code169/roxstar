// src/pages/Dashboard.tsx
import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Coins, Users, Timer, Hand, Skull, Trophy } from "lucide-react";
import { useWheelStore } from "../store/wheel";
import { useAuthStore } from "../store/auth";
import { socket, connectSocket, disconnectSocket } from "../services/socket";
import Navbar from "../components/Navbar";

export default function Dashboard() {
  const { token, userId } = useAuthStore();
  const { wheel, loadWheel, participants, status, countdown, joinWheel } = useWheelStore();

  useEffect(() => {
    if (!token) return;
    loadWheel();
    connectSocket();
    const { setSocketHandlers } = useWheelStore.getState();
    setSocketHandlers(socket);
    const refresh = () => loadWheel();
    socket.on("wheelStarted", refresh);
    socket.on("wheelAborted", refresh);
    socket.on("playerEliminated", refresh);
    socket.on("wheelCompleted", refresh);
    const poll = setInterval(refresh, 3000);
    return () => {
      clearInterval(poll);
      socket.off("wheelStarted", refresh);
      socket.off("wheelAborted", refresh);
      socket.off("playerEliminated", refresh);
      socket.off("wheelCompleted", refresh);
      disconnectSocket();
    };
  }, [token, loadWheel]);

  const hasJoined = useMemo(
    () => participants.some((p) => p.userId === userId),
    [participants, userId]
  );

  const handleJoin = async () => {
    if (!wheel) return;
    try {
      await joinWheel(wheel.id);
      toast.success(`You're in. Stake of ${wheel.entryFee} placed.`);
    } catch (e: any) {
      toast.error(e?.message || "Failed to join");
    }
  };

  return (
    <>
      <Navbar title="The Table" />
      <main className="flex-1 px-4 sm:px-6 py-8">
        <div className="max-w-6xl mx-auto">
          {!wheel ? (
            <EmptyTable />
          ) : (
            <div className="grid lg:grid-cols-[1fr_320px] gap-6">
              <div className="space-y-4">
                <header className="glass-card p-5 flex flex-wrap items-center gap-4">
                  <div>
                    <p className="text-gold-400/70 text-xs tracking-widest uppercase">Now Spinning</p>
                    <h2 className="font-display text-3xl font-bold text-cream">{wheel.title}</h2>
                  </div>
                  <div className="ml-auto flex flex-wrap gap-2">
                    <StatusChip status={status} />
                    <span className="chip">
                      <Coins size={14} /> {wheel.entryFee} chips
                    </span>
                    {countdown > 0 && (
                      <span className="chip-felt chip">
                        <Timer size={14} /> {countdown}s
                      </span>
                    )}
                    <span className="chip">
                      <Users size={14} /> {participants.length}
                    </span>
                  </div>
                </header>

                <div className="glass-card p-6 flex items-center justify-center">
                  <WheelVisual
                    participants={participants}
                    status={status}
                    currentUserId={userId}
                  />
                </div>

                <div className="flex justify-center">
                  {status === "WAITING" && !hasJoined && (
                    <button onClick={handleJoin} className="btn-gold inline-flex items-center gap-2 text-lg">
                      <Hand size={18} />
                      Place {wheel.entryFee} & Join
                    </button>
                  )}
                  {status === "WAITING" && hasJoined && (
                    <span className="chip">You're at the table. Waiting for spin…</span>
                  )}
                  {status === "RUNNING" && (
                    <span className="text-shimmer font-display text-2xl">Spinning…</span>
                  )}
                  {status === "COMPLETED" && (
                    <span className="chip-felt chip text-base">
                      <Trophy size={16} /> Round complete
                    </span>
                  )}
                  {status === "ABORTED" && (
                    <span className="chip-crimson chip text-base">
                      Round aborted — stakes refunded
                    </span>
                  )}
                </div>
              </div>

              <aside className="glass-card p-5">
                <h3 className="font-display text-xl text-gold-400 mb-3">At the Table</h3>
                <ul className="space-y-2">
                  {participants.length === 0 && (
                    <li className="text-cream/50 italic">No players yet — be the first.</li>
                  )}
                  {participants.map((p) => {
                    const isYou = p.userId === userId;
                    return (
                      <li
                        key={p.userId}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                          p.eliminated
                            ? "border-crimson-600/50 bg-crimson-500/10 text-crimson-500/90 line-through"
                            : "border-gold-700/30 bg-felt-700/40 text-cream"
                        }`}
                      >
                        {p.eliminated ? (
                          <Skull size={16} className="text-crimson-500" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-gold-400 animate-pulse" />
                        )}
                        <span className="font-semibold">{p.userName}</span>
                        {isYou && <span className="ml-auto text-xs text-gold-400">YOU</span>}
                      </li>
                    );
                  })}
                </ul>
              </aside>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    WAITING: { cls: "chip", label: "Taking bets" },
    RUNNING: { cls: "chip-felt chip", label: "Spinning" },
    COMPLETED: { cls: "chip-felt chip", label: "Completed" },
    ABORTED: { cls: "chip-crimson chip", label: "Aborted" },
    CREATED: { cls: "chip", label: "Created" },
  };
  const item = map[status] || map.WAITING;
  return <span className={item.cls}>{item.label}</span>;
}

function EmptyTable() {
  return (
    <div className="glass-card p-12 text-center">
      <div className="text-6xl mb-4">🎲</div>
      <h2 className="font-display text-3xl text-gold-gradient font-bold">No wheel in play</h2>
      <p className="text-cream/60 mt-2">The table is being cleaned. An admin will deal soon.</p>
    </div>
  );
}

type Participant = {
  userId: string;
  userName: string;
  eliminated: boolean;
};

function WheelVisual({
  participants,
  status,
  currentUserId,
}: {
  participants: Participant[];
  status: string;
  currentUserId: string | null;
}) {
  const players = participants.length > 0 ? participants : [{ userId: "ghost", userName: "?", eliminated: false } as Participant];
  const segCount = players.length;
  const segments = Array.from({ length: segCount });
  const isSpinning = status === "RUNNING";

  return (
    <div className="relative">
      <motion.div
        className="relative w-72 h-72 sm:w-96 sm:h-96 rounded-full glow-gold"
        style={{
          background:
            "conic-gradient(from 0deg, " +
            segments
              .map((_, i) => {
                const start = (360 / segCount) * i;
                const end = (360 / segCount) * (i + 1);
                const isEliminated = players[i].eliminated;
                const c = isEliminated ? "#3a0a16" : i % 2 === 0 ? "#c8102e" : "#0f3d2b";
                return `${c} ${start}deg ${end}deg`;
              })
              .join(", ") +
            ")",
          border: "10px solid",
          borderImage: "linear-gradient(135deg, #f5d77a, #c9a227 50%, #8c6f12) 1",
        }}
        animate={isSpinning ? { rotate: [0, 360] } : { rotate: 0 }}
        transition={isSpinning ? { repeat: Infinity, duration: 4, ease: "linear" } : { duration: 0.6 }}
      >
        {/* Player labels on segments */}
        {players.map((p, i) => {
          const angle = (360 / segCount) * i + (180 / segCount);
          const isYou = p.userId === currentUserId;
          return (
            <div
              key={p.userId + i}
              className="absolute left-1/2 top-1/2 origin-center text-center"
              style={{
                transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-38%)`,
              }}
            >
              <div
                className={`font-display font-bold text-sm sm:text-base ${
                  p.eliminated ? "text-cream/40 line-through" : "text-cream"
                } ${isYou ? "text-gold-gradient" : ""}`}
                style={{ transform: `rotate(${-angle}deg)` }}
              >
                {p.userName.length > 10 ? p.userName.slice(0, 10) + "…" : p.userName}
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* Center hub */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-felt-700 to-felt-900 border-4 border-gold-600/80 flex items-center justify-center shadow-2xl">
          <div className="text-center">
            <div className="font-display text-2xl sm:text-3xl text-gold-gradient font-black">SR</div>
            <div className="text-gold-400/70 text-[10px] tracking-widest mt-0.5">ROYALE</div>
          </div>
        </div>
      </div>

      {/* Pointer */}
      <div
        className="absolute left-1/2 -translate-x-1/2 -top-3 w-0 h-0"
        style={{
          borderLeft: "14px solid transparent",
          borderRight: "14px solid transparent",
          borderTop: "26px solid #f5d77a",
          filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.6))",
        }}
      />
    </div>
  );
}
