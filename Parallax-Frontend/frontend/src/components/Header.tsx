import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { jwtDecode } from "jwt-decode";

type TokenPayload = {
  exp?: number;
  displayName?: string;
  fullName?: string;
  username?: string;
  name?: string;
  sub?: string;
};

type AuthUser = {
  name: string;
  initials: string;
};

export function Header() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setAuthUser(null);
      return;
    }

    try {
      const decoded = jwtDecode<TokenPayload>(token);
      const nowInSeconds = Date.now() / 1000;

      if (!decoded.exp || decoded.exp <= nowInSeconds) {
        localStorage.removeItem("access_token");
        setAuthUser(null);
        return;
      }

      const resolvedName =
        decoded.displayName ||
        decoded.fullName ||
        decoded.username ||
        decoded.name ||
        decoded.sub ||
        "User";

      const words = resolvedName.trim().split(/\s+/).filter(Boolean);
      const initials = words.length >= 2
        ? `${words[0][0]}${words[1][0]}`.toUpperCase()
        : resolvedName.slice(0, 2).toUpperCase();

      setAuthUser({
        name: resolvedName,
        initials: initials || "US",
      });
    } catch {
      localStorage.removeItem("access_token");
      setAuthUser(null);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    setAuthUser(null);
    navigate('/');
  };

  const primaryNavItems = [
    { label: "Home", action: () => navigate('/') },
    { label: "Features", action: () => navigate('/features') },
    { label: "Roadmap", action: () => navigate('/roadmap') },
  ];

  const secondaryNavItems = [
    { label: "About", action: () => navigate('/about') },
    { label: "Contact", action: () => navigate('/contact') },
    { label: "Docs", action: () => navigate('/docs') },
  ];

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#09090B]/80 border-b border-white/5"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.button
            onClick={() => navigate('/')}
            className="flex items-center gap-3 font-bold group"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="w-8 h-8 bg-zinc-950 border border-white/10 rounded-xl flex items-center justify-center group-hover:border-[#D4AF37]/50 transition-colors duration-500">
              <span className="text-[#D4AF37] font-mono text-sm">PX</span>
            </div>
            <span className="hidden sm:inline text-white/90 text-[10px] font-bold uppercase tracking-[0.4em]">
              parallax
            </span>
          </motion.button>

          {/* Desktop Navigation */}
          <nav className="flex items-center gap-8 flex-1 justify-center px-8 hidden lg:flex">
            {/* Primary Nav */}
            {primaryNavItems.map((item, idx) => (
              <motion.button
                key={item.label}
                onClick={item.action}
                className="text-[10px] font-bold text-[#A1A1AA] hover:text-white uppercase tracking-[0.2em] transition-all duration-300 relative group"
                whileHover={{ y: -1 }}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                {item.label}
                <div className="absolute -bottom-1 left-0 w-0 h-[1px] bg-[#D4AF37] group-hover:w-full transition-all duration-500" />
              </motion.button>
            ))}

            {/* Technical Divider */}
            <div className="h-3 w-[1px] bg-white/10 mx-2" />

            {/* Secondary Nav */}
            {secondaryNavItems.map((item, idx) => (
              <motion.button
                key={item.label}
                onClick={item.action}
                className="text-[10px] font-bold text-zinc-600 hover:text-[#A1A1AA] uppercase tracking-[0.2em] transition-all duration-300 relative group"
                whileHover={{ y: -1 }}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (4 + idx) * 0.05 }}
              >
                {item.label}
                <div className="absolute -bottom-1 left-0 w-0 h-[1px] bg-white/20 group-hover:w-full transition-all duration-500" />
              </motion.button>
            ))}
          </nav>

          {/* Auth/CTA */}
          <div className="flex items-center gap-6">
            {authUser ? (
              <div className="flex items-center gap-6">
                <motion.button
                  onClick={() => navigate('/profile')}
                  className="flex items-center gap-3 text-[10px] font-bold text-white uppercase tracking-widest group"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="w-8 h-8 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center text-[10px] font-mono group-hover:bg-[#D4AF37]/20 transition-all">
                    {authUser.initials}
                  </div>
                  <span className="hidden md:inline">{authUser.name}</span>
                </motion.button>

                <motion.button
                  onClick={handleLogout}
                  className="text-[10px] font-bold text-zinc-600 hover:text-white uppercase tracking-[0.2em] transition-colors"
                >
                  Terminate
                </motion.button>
              </div>
            ) : (
              <div className="flex items-center gap-6">
                <motion.button
                  onClick={() => navigate('/login')}
                  className="text-[10px] font-bold text-[#A1A1AA] hover:text-white uppercase tracking-[0.2em] transition-colors"
                >
                  Log_In
                </motion.button>

                <motion.button
                  onClick={() => navigate('/signup')}
                  className="px-6 py-2.5 bg-[#D4AF37] text-black text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-[#F59E0B] transition-colors"
                >
                  Initialize
                </motion.button>
              </div>
            )}

            {/* Mobile Toggle */}
            <motion.button
              className="lg:hidden p-2 hover:bg-white/5 rounded-lg transition-colors duration-300"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-white" />
              ) : (
                <Menu className="w-5 h-5 text-white" />
              )}
            </motion.button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <motion.div
          className="lg:hidden"
          initial={false}
          animate={{ height: mobileMenuOpen ? "auto" : 0, opacity: mobileMenuOpen ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          style={{ overflow: "hidden" }}
        >
          <div className="pt-8 pb-4 flex flex-col gap-6">
            {[...primaryNavItems, ...secondaryNavItems].map((item) => (
              <motion.button
                key={item.label}
                onClick={() => {
                  item.action();
                  setMobileMenuOpen(false);
                }}
                className="text-left text-[10px] font-bold text-[#A1A1AA] hover:text-[#D4AF37] uppercase tracking-[0.4em] py-2"
                whileHover={{ x: 6 }}
              >
                {item.label}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.header>
  );
}
