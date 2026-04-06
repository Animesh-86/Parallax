import { Bell, Check, Sparkles, X } from "lucide-react";
import { useCollab } from "../context/CollaborationContext";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "./ui/popover";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { toast } from "sonner";
import { useState } from "react";

interface NotificationBellProps {
    onInviteAction?: () => void;
}

export function NotificationBell({ onInviteAction }: NotificationBellProps) {
    const { pendingInvites, acceptInvite, rejectInvite, refreshInvites } = useCollab();
    const [isOpen, setIsOpen] = useState(false);
    const pendingCount = pendingInvites.length;

    const handleAccept = async (invitationId: string) => {
        try {
            await acceptInvite(invitationId);
            toast.success("Invitation accepted!");
            refreshInvites();
            if (onInviteAction) onInviteAction();
        } catch (error) {
            // Error toast handled by api or generic handler? 
            // We should add proper error handling here if api throws
            toast.error("Failed to accept invitation");
        }
    };

    const handleReject = async (invitationId: string) => {
        try {
            await rejectInvite(invitationId);
            toast.info("Invitation rejected");
            refreshInvites();
        } catch (error) {
            toast.error("Failed to reject invitation");
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <button className="relative p-2 rounded-lg hover:bg-white/5 transition-colors">
                    <Bell className="w-5 h-5 text-white/60" />
                    {pendingCount > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-r from-[#38BDF8] to-[#94A3B8] text-[10px] leading-[18px] text-white text-center font-semibold border border-[#060910]">
                            {pendingCount > 9 ? "9+" : pendingCount}
                        </span>
                    )}
                </button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[min(92vw,380px)] p-0 bg-[#060910]/95 backdrop-blur-xl border border-white/10 text-white rounded-2xl shadow-2xl"
                align="end"
                sideOffset={10}
                collisionPadding={16}
            >
                <div className="px-4 py-3 border-b border-white/10 bg-gradient-to-r from-[#38BDF8]/10 to-transparent rounded-t-2xl">
                    <h4 className="font-semibold leading-none text-base">Notifications</h4>
                    <p className="text-xs text-white/50 mt-1">
                        {pendingCount === 0
                            ? "You're all caught up"
                            : `You have ${pendingCount} pending invitation${pendingCount > 1 ? "s" : ""}`}
                    </p>
                </div>
                <ScrollArea className="max-h-[min(65vh,420px)]">
                    {pendingCount === 0 ? (
                        <div className="px-6 py-12 text-center flex flex-col items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-[#38BDF8]" />
                            </div>
                            <p className="text-sm font-medium text-white/70">No new notifications</p>
                            <p className="text-xs text-white/40">Invites and updates will appear here.</p>
                        </div>
                    ) : (
                        <div className="p-2 space-y-2">
                            {pendingInvites.map((invite) => (
                                <div
                                    key={invite.invitationId}
                                    className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-[#38BDF8]/30 transition-colors"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h5 className="font-medium text-sm">{invite.projectName}</h5>
                                            <p className="text-xs text-white/60">
                                                Invited by <span className="text-[#94A3B8]">{invite.inviterEmail}</span>
                                            </p>
                                        </div>
                                        <span className="text-[10px] text-white/30 uppercase border border-white/10 px-1.5 py-0.5 rounded">
                                            {invite.role}
                                        </span>
                                    </div>
                                    <div className="flex gap-2 mt-3">
                                        <Button
                                            size="sm"
                                            className="h-8 text-xs bg-[#4ADE80]/20 text-[#4ADE80] hover:bg-[#4ADE80]/30 border-[#4ADE80]/30"
                                            onClick={() => handleAccept(invite.invitationId)}
                                        >
                                            <Check className="w-3 h-3 mr-1" />
                                            Accept
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-8 text-xs bg-[#EF6461]/10 text-[#9A3412] hover:bg-[#EF6461]/20 border-[#EF6461]/30 border-transparent"
                                            onClick={() => handleReject(invite.invitationId)}
                                        >
                                            <X className="w-3 h-3 mr-1" />
                                            Reject
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
