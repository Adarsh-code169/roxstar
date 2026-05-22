import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Coins, LogOut, Shield, User as UserIcon } from "lucide-react";
import { useAuthStore } from "../store/auth";
import { api } from "../services/api";

type Props = {
  showBack?: boolean;
  backTo?: string;
  title?: string;
};

export default function Navbar({ showBack = true, backTo, title }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, role, clearAuth } = useAuthStore();
  const [coins, setCoins] = useState<number | null>(null);
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api
      .me()
      .then((data) => {
        setCoins(data.user.coins);
        setName(data.user.name);
      })
      .catch(() => undefined);
  }, [token, location.pathname]);

  const onBack = () => {
    if (backTo) navigate(backTo);
    else if (window.history.length > 1) navigate(-1);
    else navigate("/");
  };

  const handleLogout = () => {
    clearAuth();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-felt-900/70 border-b border-gold-700/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
        {showBack && location.pathname !== "/" && (
          <button onClick={onBack} className="btn-ghost flex items-center gap-1 px-3 py-1.5" aria-label="Back">
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Back</span>
          </button>
        )}

        <Link to={token ? "/dashboard" : "/"} className="flex items-center gap-2">
          <span className="text-2xl sm:text-3xl font-display font-black text-gold-gradient leading-none">
            ♠ Spin Royale ♠
          </span>
        </Link>

        {title && (
          <span className="hidden md:inline text-gold-400/70 font-display text-sm pl-3 border-l border-gold-700/40 ml-1">
            {title}
          </span>
        )}

        <div className="ml-auto flex items-center gap-2">
          {token ? (
            <>
              {coins !== null && (
                <div className="chip">
                  <Coins size={14} />
                  <span>{coins.toLocaleString()}</span>
                </div>
              )}
              {name && (
                <div className="chip-felt chip">
                  {role === "ADMIN" ? <Shield size={14} /> : <UserIcon size={14} />}
                  <span className="hidden sm:inline">{name}</span>
                </div>
              )}
              {role === "ADMIN" && location.pathname !== "/admin" && (
                <Link to="/admin" className="btn-ghost hidden sm:inline-flex">Admin</Link>
              )}
              {location.pathname !== "/dashboard" && (
                <Link to="/dashboard" className="btn-ghost hidden sm:inline-flex">Table</Link>
              )}
              <button onClick={handleLogout} className="btn-ghost flex items-center gap-1">
                <LogOut size={14} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost">Login</Link>
              <Link to="/register" className="btn-gold">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
