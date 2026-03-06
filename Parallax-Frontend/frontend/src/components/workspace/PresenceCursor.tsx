interface PresenceCursorProps {
  user: {
    id: number;
    name: string;
    color: string;
    avatar: string;
  };
  showPopover: boolean;
}

export function PresenceCursor({ user, showPopover }: PresenceCursorProps) {
  return (
    <div className="inline-block relative">
      {/* Cursor */}
      <div
        className="absolute left-0 top-0 w-0.5 h-5 animate-pulse"
        style={{ backgroundColor: user.color, boxShadow: `0 0 8px ${user.color}` }}
      />

      {/* Popover on hover */}
      {showPopover && (
        <div
          className="absolute left-2 -top-10 px-3 py-1.5 rounded-lg backdrop-blur-md border text-xs whitespace-nowrap z-10 animate-in fade-in slide-in-from-bottom-2 duration-200"
          style={{
            backgroundColor: `${user.color}20`,
            borderColor: user.color,
            color: user.color,
          }}
        >
          {user.name} is editing here
        </div>
      )}
    </div>
  );
}
