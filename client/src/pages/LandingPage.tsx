// src/pages/LandingPage.tsx
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Coins, Trophy, Users, Sparkles } from "lucide-react";
import Navbar from "../components/Navbar";

export default function LandingPage() {
  return (
    <>
      <Navbar showBack={false} />
      <main className="flex-1 px-4 sm:px-6 py-10 sm:py-16">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="chip mb-4">
              <Sparkles size={14} />
              Welcome to the table
            </span>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05]">
              <span className="text-gold-gradient">Spin Royale</span>
              <br />
              <span className="text-cream">a game of chance.</span>
            </h1>
            <p className="mt-6 text-lg text-cream/80 max-w-lg leading-relaxed">
              Place your stake, take your seat. Players are eliminated every 7 seconds until one
              lucky soul claims the pot. Are you feeling lucky?
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register" className="btn-gold inline-flex items-center gap-2 text-lg">
                <Coins size={18} /> Get 1000 Chips Free
              </Link>
              <Link to="/login" className="btn-ghost inline-flex items-center gap-2 text-lg">
                Sign in
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-3 max-w-lg">
              <Feature icon={<Users size={20} />} label="3+ players" sub="Min to start" />
              <Feature icon={<Trophy size={20} />} label="70% pot" sub="Winner share" />
              <Feature icon={<Sparkles size={20} />} label="Every 7s" sub="One falls" />
            </div>
          </div>

          <div className="flex justify-center">
            <RouletteVisual />
          </div>
        </div>
      </main>
      <footer className="text-center py-6 text-cream/40 text-sm">
        ♦ ♥ ♣ ♠ &nbsp; House always watches &nbsp; ♠ ♣ ♥ ♦
      </footer>
    </>
  );
}

function Feature({ icon, label, sub }: { icon: React.ReactNode; label: string; sub: string }) {
  return (
    <div className="glass-card p-3 text-center">
      <div className="text-gold-400 flex justify-center mb-1">{icon}</div>
      <div className="font-display font-bold text-cream text-sm">{label}</div>
      <div className="text-cream/50 text-xs">{sub}</div>
    </div>
  );
}

function RouletteVisual() {
  const segments = 12;
  const colors = ["#c8102e", "#0a2c1e"];
  return (
    <motion.div
      className="relative w-72 h-72 sm:w-96 sm:h-96"
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
    >
      <div
        className="absolute inset-0 rounded-full glow-gold"
        style={{
          background:
            "conic-gradient(from 0deg, " +
            Array.from({ length: segments })
              .map((_, i) => {
                const start = (360 / segments) * i;
                const end = (360 / segments) * (i + 1);
                return `${colors[i % 2]} ${start}deg ${end}deg`;
              })
              .join(", ") +
            ")",
          border: "8px solid",
          borderImage: "linear-gradient(135deg, #f5d77a, #c9a227 50%, #8c6f12) 1",
        }}
      />
      <div className="absolute inset-6 rounded-full bg-gradient-to-br from-felt-700 to-felt-900 border-4 border-gold-600/70 flex items-center justify-center">
        <div className="text-center">
          <div className="font-display text-5xl text-gold-gradient font-black">SR</div>
          <div className="text-gold-400/70 text-xs tracking-widest mt-1">EST · 2026</div>
        </div>
      </div>
      {/* Tick markers */}
      {Array.from({ length: segments }).map((_, i) => {
        const angle = (360 / segments) * i;
        return (
          <div
            key={i}
            className="absolute left-1/2 top-1/2 w-1 h-3 bg-gold-400 rounded-full"
            style={{
              transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-46%)`,
            }}
          />
        );
      })}
    </motion.div>
  );
}
