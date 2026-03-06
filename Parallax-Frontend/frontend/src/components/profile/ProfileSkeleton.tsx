import { Skeleton } from "../ui/skeleton";

export function ProfileSkeleton() {
    return (
        <div className="min-h-screen bg-[#060910] text-white relative overflow-hidden flex pt-16">
            {/* Sidebar Skeleton */}
            <aside className="w-64 bg-[#060910] border-r border-white/5 p-4 fixed left-0 top-16 bottom-0 z-40">
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-10 w-full rounded-xl bg-white/5" />
                    ))}
                </div>
            </aside>

            {/* Main Content Skeleton */}
            <main className="flex-1 ml-64 p-8 relative z-10 space-y-8">
                <div className="bg-[#060910] border border-white/5 rounded-3xl overflow-hidden">
                    {/* Banner Skeleton */}
                    <Skeleton className="h-40 w-full bg-white/5" />

                    {/* Profile Header Skeleton */}
                    <div className="px-8 pb-8">
                        <div className="flex items-end gap-6 -mt-16 mb-6">
                            <Skeleton className="w-32 h-32 rounded-2xl border-4 border-[#060910] bg-white/10" />
                            <div className="flex-1 pt-8 space-y-2">
                                <Skeleton className="h-8 w-64 bg-white/10" />
                                <Skeleton className="h-4 w-32 bg-white/5" />
                            </div>
                        </div>
                        <div className="space-y-2 mb-6">
                            <Skeleton className="h-4 w-full max-w-2xl bg-white/5" />
                            <Skeleton className="h-4 w-2/3 max-w-xl bg-white/5" />
                        </div>
                        {/* Stats Skeleton */}
                        <div className="grid grid-cols-5 gap-4">
                            {[1, 2, 3].map(i => (
                                <Skeleton key={i} className="h-24 w-full rounded-2xl bg-white/5" />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Activity Skeleton */}
                <Skeleton className="h-64 w-full rounded-3xl bg-white/5" />
            </main>
        </div>
    );
}
