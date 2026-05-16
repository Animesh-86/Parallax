import { Skeleton } from "./ui/skeleton";

export function ProjectSkeleton() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
      <Skeleton className="h-5 w-2/3 bg-white/10" />
      <Skeleton className="h-4 w-1/2 bg-white/10" />
      <Skeleton className="h-4 w-1/3 bg-white/10" />
    </div>
  );
}

export function FriendSkeleton() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
      <Skeleton className="h-10 w-10 rounded-full bg-white/10" />
      <Skeleton className="h-5 w-1/2 bg-white/10" />
      <Skeleton className="h-4 w-2/3 bg-white/10" />
    </div>
  );
}

export function RoomSkeleton() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
      <Skeleton className="h-5 w-1/2 bg-white/10" />
      <Skeleton className="h-4 w-3/4 bg-white/10" />
      <Skeleton className="h-4 w-1/3 bg-white/10" />
    </div>
  );
}
