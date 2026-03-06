import { motion } from "motion/react";
import { Github, Twitter, Linkedin, Mail } from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";

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
      links: ["Features", "Pricing", "Security", "Roadmap"],
    },
    {
      title: "Resources",
      links: ["Documentation", "API", "Support", "Status"],
    },
    {
      title: "Company",
      links: ["About", "Blog", "Careers", "Contact"],
    },
  ];

  return (
    <footer className="relative py-8 md:py-12 px-4 md:px-8 overflow-hidden">
      {/* Gradient divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />

      {/* Background glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-gradient-to-t from-cyan-400/10 via-purple-500/5 to-transparent blur-3xl" />

      <div className="relative z-10 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 md:gap-8 mb-8 md:mb-10">
          {/* Brand column */}
          <ScrollReveal direction="up" className="lg:col-span-2">
            <div className="space-y-4">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 via-purple-500/20 to-cyan-400/20 blur-xl" />
                <h3 className="relative text-2xl md:text-3xl tracking-wider bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  CodeAstra
                </h3>
              </div>
              <p className="text-sm md:text-base text-gray-400 max-w-sm">
                Your collaborative coding universe. Build together, ship faster, create boundlessly.
              </p>
              
              {/* Social links */}
              <div className="flex gap-3">
                {socialLinks.map((social, index) => (
                  <motion.a
                    key={index}
                    href={social.href}
                    className="w-10 h-10 rounded-xl backdrop-blur-xl bg-white/5 border border-white/10 hover:border-cyan-400/50 flex items-center justify-center transition-all duration-300 group"
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <social.Icon className="w-5 h-5 text-gray-400 group-hover:text-cyan-400 transition-colors" strokeWidth={1.5} />
                  </motion.a>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* Link columns */}
          {footerLinks.map((column, idx) => (
            <ScrollReveal key={idx} direction="up" delay={idx * 0.1}>
              <div>
                <h4 className="text-sm md:text-base mb-3 text-white/90">
                  {column.title}
                </h4>
                <ul className="space-y-2">
                  {column.links.map((link, linkIdx) => (
                    <li key={linkIdx}>
                      <motion.a
                        href="#"
                        className="text-sm text-gray-400 hover:text-cyan-400 transition-colors inline-block"
                        whileHover={{ x: 5 }}
                      >
                        {link}
                      </motion.a>
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Bottom bar */}
        <ScrollReveal direction="up" delay={0.3}>
          <div className="pt-6 border-t border-white/10">
            <div className="text-center">
              <p className="text-xs md:text-sm text-gray-400">
                © 2025 CodeAstra. All rights reserved.
              </p>
            </div>
          </div>
        </ScrollReveal>
      </div>

      {/* Decorative elements */}
      <motion.div
        className="absolute bottom-10 left-10 w-32 h-32 rounded-full border border-white/5"
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute top-0 left-1/2 w-2 h-2 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 -translate-x-1/2" />
      </motion.div>

      <motion.div
        className="absolute top-20 right-20 w-24 h-24 rounded-full border border-white/5"
        animate={{ rotate: -360 }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute bottom-0 left-1/2 w-2 h-2 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 -translate-x-1/2" />
      </motion.div>
    </footer>
  );
}