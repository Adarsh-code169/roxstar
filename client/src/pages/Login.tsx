// src/pages/Login.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { LogIn, Crown } from "lucide-react";
import { useAuthStore } from "../store/auth";
import { api } from "../services/api";
import Navbar from "../components/Navbar";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { token, userId, role } = await api.login({ email, password });
      setAuth(token, userId, role);
      toast.success("Welcome back to the table");
      navigate(role === "ADMIN" ? "/admin" : "/dashboard");
    } catch (err: any) {
      toast.error(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const signInAs = async (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
    setLoading(true);
    try {
      const { token, userId, role } = await api.login({ email: e, password: p });
      setAuth(token, userId, role);
      toast.success("Welcome back to the table");
      navigate(role === "ADMIN" ? "/admin" : "/dashboard");
    } catch (err: any) {
      toast.error(err?.message || "Login failed");
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
            <h2 className="font-display text-4xl text-gold-gradient font-black">Take a seat</h2>
            <p className="text-cream/60 mt-2">Sign in to join the wheel</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="••••••"
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn-gold w-full flex items-center justify-center gap-2 text-lg">
              <LogIn size={18} />
              {loading ? "Dealing..." : "Sign In"}
            </button>
          </form>

          <div className="divider-gold my-6" />

          <button
            type="button"
            onClick={() => signInAs("admin@game.com", "admin123")}
            disabled={loading}
            className="btn-ghost w-full flex items-center justify-center gap-2"
          >
            <Crown size={16} /> Sign in as Admin (demo)
          </button>
          <p className="text-center text-cream/40 text-xs mt-2">
            admin@game.com · admin123
          </p>

          <p className="text-center text-cream/60 mt-4 text-sm">
            New here?{" "}
            <Link to="/register" className="text-gold-400 hover:underline font-semibold">
              Create an account
            </Link>
          </p>
        </motion.div>
      </main>
    </>
  );
}
