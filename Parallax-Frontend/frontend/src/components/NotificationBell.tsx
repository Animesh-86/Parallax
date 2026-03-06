import { Bell, Check, X } from "lucide-react";
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
                    {pendingInvites.length > 0 && (
                        <div className="absolute top-1 right-1 w-2 h-2 bg-[#94A3B8] rounded-full animate-pulse border border-[#060910]" />
                    )}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 bg-[#060910] border border-white/10 text-white" align="end">
                <div className="p-4 border-b border-white/10">
                    <h4 className="font-semibold leading-none">Notifications</h4>
                    <p className="text-xs text-white/40 mt-1">
                        You have {pendingInvites.length} pending invitations
                    </p>
                </div>
                <ScrollArea className="h-[300px]">
                    {pendingInvites.length === 0 ? (
                        <div className="p-8 text-center text-sm text-white/40">
                            No new notifications
                        </div>
                    ) : (
                        <div className="p-2 space-y-2">
                            {pendingInvites.map((invite) => (
                                <div
                                    key={invite.invitationId}
                                    className="p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
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
                                            className="h-7 text-xs bg-[#4ADE80]/20 text-[#4ADE80] hover:bg-[#4ADE80]/30 border-[#4ADE80]/30"
                                            onClick={() => handleAccept(invite.invitationId)}
                                        >
                                            <Check className="w-3 h-3 mr-1" />
                                            Accept
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-7 text-xs bg-[#EF6461]/10 text-[#9A3412] hover:bg-[#EF6461]/20 border-[#EF6461]/30 border-transparent"
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
