type IDEHeaderProps = {
  visible: boolean;
  projectName: string;
};

export function IDEHeader({ visible, projectName }: IDEHeaderProps) {
  if (!visible) return null;

  return (
    <header className="...">
      {/* Wherever you had "Parallax", do: */}
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#38BDF8] to-[#94A3B8] animate-pulse" />
        <span className="bg-gradient-to-r from-[#38BDF8] to-[#94A3B8] bg-clip-text text-transparent">
          {projectName}
        </span>
      </div>
      {/* ...rest of header */}
    </header>
  );
}
