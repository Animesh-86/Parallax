type IDEHeaderProps = {
  visible: boolean;
  projectName: string;
};

export function IDEHeader({ visible, projectName }: IDEHeaderProps) {
  if (!visible) return null;

  return (
    <header className="h-10 border-b border-white/5 bg-[#09090B] flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.8)]" />
        <span className="text-sm font-bold bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] bg-clip-text text-transparent font-serif italic tracking-wide">
          {projectName}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-red-500/20 border border-red-500/50" />
        <div className="w-2 h-2 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
        <div className="w-2 h-2 rounded-full bg-green-500/20 border border-green-500/50" />
      </div>
    </header>
  );
}
