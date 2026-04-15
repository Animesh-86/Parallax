import { motion } from 'motion/react';
import { ArrowRight, Code2, Globe, ShieldCheck, Zap } from 'lucide-react';

interface CardItem {
  title: string;
  description: string;
  buttonText: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const cards: CardItem[] = [
  {
    title: 'Real-Time Collaborative Editor',
    description: 'Monaco-powered editing with live multi-cursor collaboration, syntax highlighting, and shared workspace context.',
    buttonText: 'Explore Editor',
    href: '/features',
    icon: Code2,
  },
  {
    title: 'Sandboxed Code Execution',
    description: 'Run code inside isolated containers with fast startup, clean output, and support for popular languages.',
    buttonText: 'View Execution',
    href: '/room',
    icon: Zap,
  },
  {
    title: 'Built-In Voice & Video',
    description: 'Talk through problems in the workspace with WebRTC voice, video, and screen-sharing controls.',
    buttonText: 'Open Meeting Room',
    href: '/features',
    icon: Globe,
  },
  {
    title: 'Instant Session Creation',
    description: 'Create a room, share a link, and start collaborating in seconds with your project context intact.',
    buttonText: 'Create a Room',
    href: '/dashboard',
    icon: ShieldCheck,
  },
];

const cardColors = [
  'from-cyan-500/20 via-cyan-400/10 to-transparent',
  'from-emerald-500/20 via-emerald-400/10 to-transparent',
  'from-violet-500/20 via-violet-400/10 to-transparent',
  'from-amber-500/20 via-amber-400/10 to-transparent',
];

export function FluidCardStack() {
  return (
    <section className="mt-14">
      <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-3 md:p-4 shadow-2xl shadow-black/20 overflow-hidden">
        <div className="hidden md:flex gap-2 min-h-[420px]">
          {cards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.article
                key={card.title}
                className={`relative min-w-0 flex-[1_1_0%] rounded-[22px] border border-white/10 bg-[#101522] overflow-hidden group transition-shadow duration-300 hover:shadow-2xl hover:shadow-black/30`}
                whileHover={{ flexGrow: 1.35, y: -4 }}
                transition={{ type: 'spring', stiffness: 240, damping: 24 }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${cardColors[index]} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                <div className="absolute inset-x-0 top-0 h-[1px] bg-white/10" />
                <div className="relative h-full flex flex-col justify-between p-6 lg:p-7">
                  <div>
                    <div className="w-14 h-14 rounded-2xl bg-[#A286FE]/15 border border-[#A286FE]/25 flex items-center justify-center mb-5">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl lg:text-[2.15rem] font-semibold tracking-tight text-white mb-3 max-w-[9ch]">
                      {card.title}
                    </h3>
                    <p className="text-sm lg:text-base text-white/72 leading-relaxed max-w-md">
                      {card.description}
                    </p>
                  </div>

                  <div className="pt-8">
                    <a
                      href={card.href}
                      className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition-transform duration-200 hover:scale-[1.02]"
                    >
                      {card.buttonText}
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>

        <div className="md:hidden grid gap-3">
          {cards.map((card, index) => {
            const Icon = card.icon;
            return (
              <article
                key={card.title}
                className="relative overflow-hidden rounded-[22px] border border-white/10 bg-[#101522] p-5"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${cardColors[index]} opacity-70`} />
                <div className="relative flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#A286FE]/15 border border-[#A286FE]/25 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xl font-semibold tracking-tight text-white mb-2">{card.title}</h3>
                    <p className="text-sm text-white/75 leading-relaxed mb-4">{card.description}</p>
                    <a
                      href={card.href}
                      className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black"
                    >
                      {card.buttonText}
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
