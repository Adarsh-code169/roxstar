// src/pages/Register.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { UserPlus, ChevronDown, ChevronUp, Shield } from "lucide-react";
import { useAuthStore } from "../store/auth";
import { api } from "../services/api";
import Navbar from "../components/Navbar";

export default function Register() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [showAdminCode, setShowAdminCode] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.register({ name, email, password, adminCode: adminCode || undefined });
      setAuth(data.token, data.userId, data.role);
      toast.success(`Welcome${data.role === "ADMIN" ? ", Game Master" : ""}!`);
      navigate(data.role === "ADMIN" ? "/admin" : "/dashboard");
    } catch (err: any) {
      toast.error(err?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar backTo="/" />
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass-card w-full max-w-md p-8"
        >
          <div className="text-center mb-6">
            <h2 className="font-display text-4xl text-gold-gradient font-black">Join the Royale</h2>
            <p className="text-cream/60 mt-2">Get 1,000 chips on the house</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label-casino">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-casino"
                placeholder="Your name at the table"
                required
              />
            </div>
            <div>
              <label className="label-casino">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-casino"
                placeholder="you@table.com"
                required
              />
            </div>
            <div>
              <label className="label-casino">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-casino"
                placeholder="At least 6 characters"
                minLength={6}
                required
              />
            </div>

            <button
              type="button"
              onClick={() => setShowAdminCode((v) => !v)}
              className="text-gold-400/80 hover:text-gold-400 text-sm font-semibold flex items-center gap-1"
            >
              <Shield size={14} />
              I have an admin code
              {showAdminCode ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showAdminCode && (
              <div>
                <label className="label-casino">Admin Code</label>
                <input
                  type="text"
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  className="input-casino"
                  placeholder="Optional"
                />
                <p className="text-cream/40 text-xs mt-1">
                  Hint: <code className="text-gold-400">spinmaster-2026</code>
                </p>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-gold w-full flex items-center justify-center gap-2 text-lg">
              <UserPlus size={18} />
              {loading ? "Dealing in..." : "Register & Play"}
            </button>
          </form>

          <p className="text-center text-cream/60 mt-6 text-sm">
            Already a player?{" "}
            <Link to="/login" className="text-gold-400 hover:underline font-semibold">
              Sign in
            </Link>
          </p>
        </motion.div>
      </main>
    </>
  );
}
