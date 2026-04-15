import { motion } from "motion/react";
import { Github, Twitter, Linkedin, Mail } from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";
import { Link } from "react-router-dom";

export function Footer() {
  const socialLinks = [
    { Icon: Github, href: "#", label: "GitHub" },
    { Icon: Twitter, href: "#", label: "Twitter" },
    { Icon: Linkedin, href: "#", label: "LinkedIn" },
    { Icon: Mail, href: "#", label: "Email" },
  ];

  const footerLinks = [
    {
      title: "Product",
      links: [
        { label: "Features", href: "/features" },
        { label: "Security", href: "/security" },
        { label: "Roadmap", href: "/roadmap" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Documentation", href: "/docs" },
        { label: "API", href: "/api" },
        { label: "Support", href: "/support" },
        { label: "Status", href: "/status" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About", href: "/about" },
        { label: "Contact", href: "/contact" },
      ],
    },
  ];

  return (
    <footer className="relative py-16 md:py-24 px-6 md:px-12 bg-[#09090B] overflow-hidden">
      {/* Structural divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-white/5" />
      <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 md:gap-16 mb-20">
          {/* Brand column */}
          <ScrollReveal direction="up" className="lg:col-span-2">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 border border-[#D4AF37]/30 rounded-lg flex items-center justify-center">
                  <span className="text-[#D4AF37] font-mono text-[10px] font-bold">PX</span>
                </div>
                <h3 className="text-xl tracking-[0.4em] text-white font-bold uppercase transition-colors">
                  PARALLAX
                </h3>
              </div>
              <p className="text-sm text-zinc-500 max-w-sm leading-relaxed">
                A high-fidelity collaborative engine for the next generation of software architectures. 
                Built for precision, synced for speed.
              </p>

              {/* Social links */}
              <div className="flex gap-4 pt-2">
                {socialLinks.map((social, index) => (
                  <motion.a
                    key={index}
                    href={social.href}
                    className="w-10 h-10 rounded-xl bg-zinc-950 border border-white/5 hover:border-[#D4AF37]/40 flex items-center justify-center transition-all duration-500 group"
                    whileHover={{ y: -4 }}
                  >
                    <social.Icon className="w-4 h-4 text-zinc-600 group-hover:text-[#D4AF37] transition-colors" strokeWidth={1.5} />
                  </motion.a>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* Link columns */}
          {footerLinks.map((column, idx) => (
            <ScrollReveal key={idx} direction="up" delay={idx * 0.1}>
              <div className="space-y-6">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#D4AF37]">
                  {column.title}
                </h4>
                <ul className="space-y-3">
                  {column.links.map((link, linkIdx) => (
                    <li key={linkIdx}>
                      <Link
                        to={link.href}
                        className="text-xs text-zinc-600 hover:text-white uppercase tracking-widest transition-colors inline-block"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-[9px] font-mono text-zinc-700 uppercase tracking-[0.2em]">
            <span>© 2026</span>
            <span className="h-1 w-1 rounded-full bg-[#D4AF37]/30" />
            <span>PX_ENGINE_V2.0</span>
          </div>
          <div className="flex items-center gap-8">
            <Link to="/privacy" className="text-[9px] font-mono text-zinc-700 hover:text-zinc-500 transition-colors uppercase tracking-[0.2em]">Privacy[Registry]</Link>
            <Link to="/terms" className="text-[9px] font-mono text-zinc-700 hover:text-zinc-500 transition-colors uppercase tracking-[0.2em]">Terms[Protocol]</Link>
          </div>
        </div>
      </div>

      {/* Background Ambience */}
      <div className="absolute bottom-0 right-0 w-1/3 h-1/2 bg-gradient-to-tl from-[#D4AF37]/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-0 left-0 w-1/4 h-1/4 bg-white/[0.01] blur-3xl pointer-events-none" />
    </footer>
  );
}
