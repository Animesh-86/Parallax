import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { ScrollReveal, ScrollScale3D } from "./ScrollReveal";
import { Check, Sparkles, Zap, Rocket, Building, Star } from "lucide-react";

const plans = [
  {
    name: "Stardust",
    icon: Star,
    tagline: "Perfect for Getting Started",
    price: "Free",
    priceDetail: "Forever",
    gradient: "from-cyan-400 to-blue-500",
    glowColor: "rgba(0, 229, 255, 0.3)",
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
    price: "Free",
    priceDetail: "Event or Student Access",
    gradient: "from-purple-400 to-pink-500",
    glowColor: "rgba(168, 85, 247, 0.3)",
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
    price: "$12",
    priceDetail: "per month",
    gradient: "from-orange-400 via-pink-500 to-purple-500",
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
    price: "$49",
    priceDetail: "per month",
    gradient: "from-emerald-400 via-cyan-500 to-blue-500",
    glowColor: "rgba(16, 185, 129, 0.3)",
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
    price: "Custom",
    priceDetail: "Contact Sales",
    gradient: "from-indigo-400 via-purple-500 to-pink-500",
    glowColor: "rgba(99, 102, 241, 0.3)",
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
    <section ref={ref} className="relative py-8 md:py-12 px-4 md:px-8 overflow-hidden">
      {/* Animated cosmic background */}
      <motion.div
        className="absolute inset-0 opacity-20"
        style={{ y: backgroundY }}
      >
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-cyan-400/30 to-purple-500/30 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 blur-3xl" />
      </motion.div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-cyan-400"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              boxShadow: "0 0 10px rgba(0, 229, 255, 0.8)",
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 5 + Math.random() * 5,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto">
        {/* Section Header */}
        <ScrollScale3D>
          <motion.div
            className="text-center mb-8 md:mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-4xl xl:text-5xl mb-3 md:mb-4">
              <span className="relative inline-block">
                <span className="absolute inset-0 blur-xl bg-gradient-to-r from-cyan-400 to-purple-600 opacity-15" />
                <span className="relative bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  Choose Your Universe
                </span>
              </span>
            </h2>
            <p className="text-sm md:text-base text-gray-400 max-w-2xl mx-auto">
              From solo developers to enterprise teams, find the perfect plan to power your collaborative coding journey
            </p>
          </motion.div>
        </ScrollScale3D>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {plans.map((plan, index) => (
            <ScrollReveal key={index} direction="up" delay={index * 0.1} scale={true} rotate={true}>
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

  const scale = useTransform(scrollYProgress, [0, 1], [0.9, 1]);
  const rotateY = useTransform(scrollYProgress, [0, 1], [15, 0]);

  return (
    <motion.div
      ref={ref}
      className="group relative"
      style={{
        scale,
        rotateY,
        transformPerspective: 1200,
      }}
    >
      {/* Popular badge */}
      {plan.popular && (
        <motion.div
          className="absolute -top-4 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 rounded-full backdrop-blur-xl bg-gradient-to-r from-purple-500 to-pink-500 border border-white/20 text-xs"
          animate={{
            y: [0, -5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        >
          Most Popular
        </motion.div>
      )}

      {/* Glow effect */}
      <div 
        className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 blur-3xl transition-opacity duration-500"
        style={{ background: plan.glowColor }}
      />

      {/* Card */}
      <motion.div
        className={`relative p-6 md:p-8 rounded-3xl backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border-2 ${
          plan.popular ? 'border-purple-500/50' : 'border-white/10'
        } group-hover:border-white/30 transition-all duration-300 h-full flex flex-col min-h-[600px]`}
        whileHover={{ y: -10 }}
      >
        {/* Icon */}
        <motion.div
          className={`w-14 h-14 md:w-16 md:h-16 mb-4 rounded-2xl bg-gradient-to-br ${plan.gradient} bg-opacity-20 backdrop-blur-xl border border-white/20 flex items-center justify-center`}
          whileHover={{ rotate: 360, scale: 1.1 }}
          transition={{ duration: 0.6 }}
        >
          <plan.icon 
            className={`w-7 h-7 md:w-8 md:h-8 bg-gradient-to-br ${plan.gradient} bg-clip-text text-transparent`} 
            strokeWidth={2} 
          />
        </motion.div>

        {/* Plan name & tagline */}
        <div className="mb-6">
          <h3 className={`text-2xl md:text-3xl mb-2 bg-gradient-to-br ${plan.gradient} bg-clip-text text-transparent`}>
            {plan.name}
          </h3>
          <p className="text-xs md:text-sm text-gray-400 min-h-[2.5rem]">
            {plan.tagline}
          </p>
        </div>

        {/* Price */}
        <div className="mb-6 md:mb-8 min-h-[5rem]">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl md:text-4xl">{plan.price}</span>
            {plan.priceDetail !== "Forever" && plan.priceDetail !== "Contact Sales" && plan.priceDetail !== "Event or Student Access" && (
              <span className="text-gray-400 text-sm">/{plan.priceDetail}</span>
            )}
          </div>
          {(plan.priceDetail === "Forever" || plan.priceDetail === "Contact Sales" || plan.priceDetail === "Event or Student Access") && (
            <p className="text-sm text-gray-400 mt-1">{plan.priceDetail}</p>
          )}
        </div>

        {/* CTA Button */}
        <motion.button
          className={`w-full py-3 md:py-3.5 rounded-xl backdrop-blur-xl bg-gradient-to-r ${plan.gradient} border border-white/20 mb-6 md:mb-8 group/btn relative overflow-hidden`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="relative z-10 text-sm md:text-base">
            {plan.price === "Custom" ? "Contact Sales" : "Get Started"}
          </span>
          <motion.div
            className="absolute inset-0 bg-white/10"
            initial={{ x: "-100%" }}
            whileHover={{ x: "100%" }}
            transition={{ duration: 0.5 }}
          />
        </motion.button>

        {/* Features list */}
        <div className="space-y-3 md:space-y-4 flex-grow">
          {plan.features.map((feature, idx) => (
            <motion.div
              key={idx}
              className="flex items-start gap-3"
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
            >
              <Check className={`w-4 h-4 md:w-5 md:h-5 mt-0.5 flex-shrink-0 bg-gradient-to-br ${plan.gradient} bg-clip-text text-transparent`} strokeWidth={3} />
              <span className="text-xs md:text-sm text-gray-300 leading-relaxed">
                {feature}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Decorative orbital ring */}
        <motion.div
          className="absolute -bottom-6 -right-6 w-24 h-24 md:w-32 md:h-32 rounded-full border border-white/5 pointer-events-none"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          <div className={`absolute top-0 left-1/2 w-2 h-2 rounded-full bg-gradient-to-br ${plan.gradient} -translate-x-1/2`} />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}