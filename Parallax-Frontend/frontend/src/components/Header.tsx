import { motion } from "motion/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";

export function Header() {
  const navigate = useNavigate();
  const token = localStorage.getItem("access_token");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    navigate('/');
    window.location.reload();
  };

  const primaryNavItems = [
    { label: "Home", action: () => navigate('/') },
    { label: "Features", action: () => navigate('/features') },
    { label: "Pricing", action: () => navigate('/pricing') },
    { label: "Roadmap", action: () => navigate('/roadmap') },
  ];

  const secondaryNavItems = [
    { label: "About", action: () => navigate('/about') },
    { label: "Contact", action: () => navigate('/contact') },
    { label: "Docs", action: () => navigate('/docs') },
  ];

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/80 border-b border-white/5"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="max-w-6xl mx-auto px-6 md:px-12 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 font-bold text-lg flex-shrink-0"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="w-7 h-7 bg-gradient-to-br from-[#2DD4BF] to-[#38BDF8] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="hidden sm:inline bg-gradient-to-r from-[#2DD4BF] to-[#38BDF8] bg-clip-text text-transparent text-sm">
              Parallax
            </span>
          </motion.button>

          {/* Desktop Navigation */}
          <nav className="flex items-center gap-6 flex-1 justify-center px-8">
            {/* Primary Nav */}
            {primaryNavItems.map((item, idx) => (
              <motion.button
                key={item.label}
                onClick={item.action}
                className="text-sm text-[#CBD5E1] hover:text-white transition-colors duration-300 relative group whitespace-nowrap"
                whileHover={{ y: -2 }}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                {item.label}
                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#2DD4BF] to-[#38BDF8] group-hover:w-full transition-all duration-300" />
              </motion.button>
            ))}

            {/* Divider */}
            <div className="h-5 w-px bg-white/10" />

            {/* Secondary Nav */}
            {secondaryNavItems.map((item, idx) => (
              <motion.button
                key={item.label}
                onClick={item.action}
                className="text-sm text-[#94A3B8] hover:text-[#CBD5E1] transition-colors duration-300 relative group whitespace-nowrap"
                whileHover={{ y: -2 }}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (4 + idx) * 0.05 }}
              >
                {item.label}
                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#2DD4BF] to-[#38BDF8] group-hover:w-full transition-all duration-300" />
              </motion.button>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
            <motion.button
              onClick={token ? handleLogout : () => navigate('/login')}
              className="px-3 md:px-4 py-2 text-xs md:text-sm font-medium text-white border border-[#2DD4BF] bg-[#94A3B8]/10 hover:bg-[#94A3B8]/20 rounded-lg transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {token ? "Log Out" : "Login"}
            </motion.button>
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            className="lg:hidden p-2 hover:bg-white/5 rounded-lg transition-colors duration-300"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-[#CBD5E1]" />
            ) : (
              <Menu className="w-6 h-6 text-[#CBD5E1]" />
            )}
          </motion.button>
        </div>

        {/* Mobile Navigation */}
        <motion.div
          className="md:hidden mt-4 pt-4 border-t border-white/5"
          initial={false}
          animate={{ height: mobileMenuOpen ? "auto" : 0 }}
          transition={{ duration: 0.3 }}
          style={{ overflow: "hidden" }}
        >
          <nav className="flex flex-col gap-3 pb-4">
            {[...primaryNavItems, ...secondaryNavItems].map((item) => (
              <motion.button
                key={item.label}
                onClick={() => {
                  item.action();
                  setMobileMenuOpen(false);
                }}
                className="text-left text-sm text-[#CBD5E1] hover:text-[#2DD4BF] transition-colors duration-300 py-2"
                whileHover={{ x: 4 }}
              >
                {item.label}
              </motion.button>
            ))}
            <div className="flex gap-2 pt-4 border-t border-white/5 flex-col">
              <motion.button
                onClick={() => navigate('/about')}
                className="px-4 py-2 text-sm text-[#CBD5E1] hover:text-white transition-colors duration-300"
                whileHover={{ scale: 1.02 }}
              >
                About us
              </motion.button>
              <motion.button
                onClick={() => {
                  token ? handleLogout() : navigate('/login');
                  setMobileMenuOpen(false);
                }}
                className="px-4 py-2 text-sm font-medium text-white border border-[#2DD4BF] bg-[#94A3B8]/10 hover:bg-[#94A3B8]/20 rounded-lg transition-all"
                whileHover={{ scale: 1.02 }}
              >
                {token ? "Log Out" : "Login"}
              </motion.button>
              <motion.button
                onClick={() => {
                  navigate('/pricing');
                  setMobileMenuOpen(false);
                }}
                className="px-4 py-2 text-sm font-medium text-white border border-[#7DD3FC] bg-[#38BDF8]/10 hover:bg-[#38BDF8]/20 rounded-lg transition-all"
                whileHover={{ scale: 1.02 }}
              >
                Pricing
              </motion.button>
            </div>
          </nav>
        </motion.div>
      </div>
    </motion.header>
  );
}