import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { ScrollReveal, ScrollScale3D } from "./ScrollReveal";
import { Check, Sparkles, Zap, Rocket, Building, Star } from "lucide-react";
import { ScrollReveal, ScrollScale3D } from "./ScrollReveal";
import { Check, Sparkles, Zap, Rocket, Building, Star } from "lucide-react";
import { GradientShineText } from "./effects/GradientShineText";

const plans = [
  {
    name: "Stardust",
    icon: Star,
    tagline: "Perfect for Getting Started",
    price: "Coming Soon",
    priceDetail: "Forever",
    gradient: "from-[#D4AF37] to-[#71717A]",
    glowColor: "rgba(212, 175, 55, 0.3)",
    popular: false,
    features: [
      "1 active project",
      "Basic real-time collaboration",
      "2 collaborators max",
      "Basic voice chat",
      "Limited code sandbox",
      "Community workspace",
      "Standard compute resources",
      "Public room hosting",
      "Community support",
    ],
  },
  {
    name: "Nova",
    icon: Sparkles,
    tagline: "Students & Hackathons",
    price: "Coming Soon",
    priceDetail: "Event or Student Access",
    gradient: "from-[#F59E0B] to-[#D4AF37]",
    glowColor: "rgba(212, 175, 55, 0.3)",
    popular: true,
    features: [
      "Up to 10 collaborators",
      "Fast compute resources",
      "Multi-file workspace",
      "Temporary team rooms",
      "Event storage allocation",
      "'Hack Mode' theme",
      "Extended session duration",
      "Event-specific tools",
      "Student verification system",
    ],
  },
  {
    name: "Supernova",
    icon: Zap,
    tagline: "For Professional Developers",
    price: "Coming Soon",
    priceDetail: "",
    gradient: "from-[#F59E0B] via-[#D4AF37] to-[#A1A1AA]",
    glowColor: "rgba(249, 115, 22, 0.3)",
    popular: false,
    features: [
      "Unlimited projects",
      "Unlimited collaborators",
      "Private coding rooms",
      "Fast compute & execution",
      "Full AI assistance",
      "Complete version history",
      "Advanced voice + screen sync",
      "Custom themes",
      "Personal cloud storage",
    ],
  },
  {
    name: "Galaxy",
    icon: Rocket,
    tagline: "Team Collaboration",
    price: "Coming Soon",
    priceDetail: "",
    gradient: "from-[#71717A] via-[#A1A1AA] to-[#F8FAFC]",
    glowColor: "rgba(161, 161, 170, 0.3)",
    popular: false,
    features: [
      "Team workspace dashboard",
      "Multiple team rooms",
      "Role-based access control",
      "Shared AI resource pool",
      "Faster compute tier",
      "Team file sharing",
      "Team version history",
      "Project voice channels",
      "Usage analytics",
    ],
  },
  {
    name: "Astra Core",
    icon: Building,
    tagline: "Enterprise Solution",
    price: "Coming Soon",
    priceDetail: "Contact Sales",
    gradient: "from-[#F59E0B] via-[#D4AF37] to-[#09090B]",
    glowColor: "rgba(212, 175, 55, 0.3)",
    popular: false,
    features: [
      "Organization workspace",
      "SSO & SAML integration",
      "Custom compute allocation",
      "Dedicated cloud nodes",
      "Unlimited rooms & projects",
      "Comprehensive audit logs",
      "End-to-end encryption",
      "Custom branding",
      "Priority 24/7 support",
    ],
  },
];

export function PricingSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

  return (
    <section ref={ref} className="relative py-24 px-4 md:px-8 overflow-hidden">
      {/* Animated cosmic background */}
      <motion.div
        className="absolute inset-0 opacity-20"
        style={{ y: backgroundY }}
      >
        <motion.div
          className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-[#D4AF37]/30 to-[#D4AF37]/30 blur-3xl"
          animate={{
            x: [0, 40, 0],
            y: [0, -30, 0]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-[#D4AF37]/30 to-[#D4AF37]/30 blur-3xl"
          animate={{
            x: [0, -40, 0],
            y: [0, 30, 0]
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-[#D4AF37]"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              boxShadow: "0 0 10px rgba(212, 175, 55, 0.8)",
            }}
            animate={{
              y: [0, -120, 0],
              opacity: [0, 0.8, 0],
              x: [0, Math.random() * 30 - 15, 0],
            }}
            transition={{
              duration: 6 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "easeInOut",
              transform: "translateZ(0)",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section Header */}
        <ScrollScale3D>
          <motion.div
            className="text-center mb-16 md:mb-20"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 italic font-serif">
              <span className="relative inline-block">
                <span className="absolute inset-0 blur-xl bg-gradient-to-r from-[#D4AF37] to-[#D4AF37] opacity-15" />
                <span className="relative">
                  <GradientShineText text="Simple, Transparent Pricing" />
                </span>
              </span>
            </h2>
            <motion.p
              className="text-xl text-zinc-400 max-w-2xl mx-auto italic font-serif opacity-80"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 1 }}
            >
              From solo developers to enterprise teams, find the perfect plan to power your collaborative coding journey
            </motion.p>
          </motion.div>
        </ScrollScale3D>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {plans.map((plan, index) => (
            <ScrollReveal key={index} direction="up" delay={index * 0.1} scale={true} rotate={true} className="h-full">
              <PricingCard plan={plan} index={index} />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingCard({ plan, index }: { plan: typeof plans[0], index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [0.85, 1]);
  const rotateY = useTransform(scrollYProgress, [0, 1], [20, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0.8]);

  return (
    // ... imports remain same ...

    // Inside PricingCard component return:
    <motion.div
      ref={ref}
      className="group relative h-full"
      style={{
        scale,
        rotateY,
        opacity,
        transformPerspective: 1200,
      }}
    >
      {/* Popular badge - Subtler */}
      {plan.popular && (
        <motion.div
          className="absolute -top-4 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 rounded-full backdrop-blur-md bg-[#D4AF37]/20 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-semibold shadow-lg shadow-[#0D0D0F]/40"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          Most Popular
        </motion.div>
      )}

      {/* Subtler Hover Glow */}
      <motion.div
        className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-10 dark:opacity-0 group-hover:dark:opacity-20 transition-opacity duration-700 pointer-events-none"
        style={{ background: plan.gradient ? `linear-gradient(to bottom right, ${plan.glowColor}, transparent)` : plan.glowColor }}
      />

      {/* Card Body - Cleaner */}
      <motion.div
        className={`relative p-6 md:p-8 rounded-3xl backdrop-blur-xl bg-[#09090B] border transition-all duration-300 h-full flex flex-col min-h-[600px]
          ${plan.popular
            ? 'border-[#D4AF37]/30 bg-[#D4AF37]/[0.02]'
            : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20'
          }`}
        whileHover={{ y: -8, boxShadow: "0 20px 40px -10px rgba(0,0,0,0.5)" }}
        transition={{ duration: 0.3 }}
      >
        {/* Icon - Refined */}
        <motion.div
          className={`w-14 h-14 md:w-16 md:h-16 mb-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center transition-colors duration-300
             ${plan.popular ? 'group-hover:border-[#D4AF37]/30 group-hover:bg-[#D4AF37]/10' : 'group-hover:border-white/20'}`}
        >
          <plan.icon
            className={`w-7 h-7 md:w-8 md:h-8 ${plan.popular ? 'text-[#F59E0B]' : 'text-[#A1A1AA] group-hover:text-[#CBD5E1]'} transition-colors`}
            strokeWidth={1.5}
          />
        </motion.div>

        {/* Plan name & tagline */}
        <div className="mb-6">
          <h3 className={`text-2xl md:text-3xl mb-2 font-bold font-serif italic ${plan.popular ? 'text-white' : 'text-zinc-300'}`}>
            {plan.name}
          </h3>
          <p className="text-xs md:text-sm text-zinc-500 min-h-[2.5rem] leading-relaxed italic">
            {plan.tagline}
          </p>
        </div>

        {/* Price */}
        <div className="mb-6 md:mb-8 min-h-[5rem]">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl md:text-4xl font-semibold text-white">{plan.price}</span>
            {plan.priceDetail && plan.priceDetail !== "Forever" && plan.priceDetail !== "Contact Sales" && plan.priceDetail !== "Event or Student Access" && (
              <span className="text-[#71717A] text-sm">/{plan.priceDetail}</span>
            )}
          </div>
          {(plan.priceDetail === "Forever" || plan.priceDetail === "Contact Sales" || plan.priceDetail === "Event or Student Access") && (
            <p className="text-sm text-[#71717A] mt-1">
              {plan.priceDetail}
            </p>
          )}
        </div>

        {/* CTA Button - Professional */}
        <motion.button
          className={`w-full py-3 rounded-xl border mb-6 md:mb-8 font-medium transition-all duration-300
            ${plan.popular
              ? 'bg-[#D4AF37] border-[#D4AF37] text-white hover:bg-[#D4AF37] hover:shadow-lg hover:shadow-[#0D0D0F]/20'
              : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20'
            }`}
          whileTap={{ scale: 0.98 }}
        >
          {plan.price === "Custom" ? "Contact Sales" : "Get Started"}
        </motion.button>

        {/* Features list */}
        <div className="space-y-3 md:space-y-4 flex-grow">
          {plan.features.map((feature, idx) => (
            <div key={idx} className="flex items-start gap-3 group/item">
              <Check className={`w-4 h-4 md:w-5 md:h-5 mt-0.5 flex-shrink-0 ${plan.popular ? 'text-[#F59E0B]' : 'text-zinc-600 group-hover/item:text-zinc-400'} transition-colors`} strokeWidth={2} />
              <span className="text-xs md:text-sm text-zinc-400 leading-relaxed group-hover/item:text-zinc-200 transition-colors duration-300">
                {feature}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
