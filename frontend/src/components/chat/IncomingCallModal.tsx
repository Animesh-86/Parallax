import React from "react";
import { Phone, PhoneOff, Video } from "lucide-react";

interface IncomingCallModalProps {
    callerName: string;
    isVideo: boolean;
    onAccept: () => void;
    onReject: () => void;
}

const IncomingCallModal: React.FC<IncomingCallModalProps> = ({ callerName, isVideo, onAccept, onReject }) => {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-300">
            <div className="bg-[#1e1f22] w-80 p-6 rounded-2xl shadow-2xl border border-white/10 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mb-4 shadow-lg animate-pulse">
                    {isVideo ? <Video className="w-10 h-10 text-white" /> : <Phone className="w-10 h-10 text-white" />}
                </div>
                
                <h3 className="text-xl font-bold text-white mb-1">{callerName}</h3>
                <p className="text-gray-400 text-sm mb-8">Incoming {isVideo ? "Video" : "Voice"} Call...</p>
                
                <div className="flex gap-4 w-full">
                    <button 
                        onClick={onReject}
                        className="flex-1 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white py-3 rounded-xl transition-all flex items-center justify-center gap-2 font-medium"
                    >
                        <PhoneOff className="w-5 h-5" />
                        Decline
                    </button>
                    <button 
                        onClick={onAccept}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl transition-all shadow-lg shadow-green-500/20 flex items-center justify-center gap-2 font-medium"
                    >
                        <Phone className="w-5 h-5" />
                        Accept
                    </button>
                </div>
            </div>
        </div>
    );
};

export default IncomingCallModal;
