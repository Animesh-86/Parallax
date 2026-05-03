import React, { useEffect, useRef } from "react";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Maximize2, Minimize2 } from "lucide-react";
import { useVoice } from "../../context/VoiceContext";

const CallOverlay: React.FC = () => {
    const { 
        isConnected, 
        leaveCall, 
        toggleMute, 
        toggleVideo, 
        isMuted, 
        isVideoEnabled, 
        localStream, 
        remoteStreams, 
        peerNames,
        peerVideoEnabled
    } = useVoice();

    const localVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    if (!isConnected) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-4 animate-in slide-in-from-right-10 duration-500">
            {/* Remote Streams Container */}
            <div className="flex flex-col gap-3">
                {Array.from(remoteStreams.entries()).map(([peerId, stream]) => (
                    <RemoteStreamView 
                        key={peerId} 
                        stream={stream} 
                        name={peerNames.get(peerId) || "Friend"} 
                        videoEnabled={peerVideoEnabled.get(peerId) || false}
                    />
                ))}
            </div>

            {/* Local Preview & Controls */}
            <div className="bg-[#1e1f22] rounded-2xl shadow-2xl border border-white/10 overflow-hidden w-64">
                <div className="relative aspect-video bg-black">
                    {isVideoEnabled ? (
                        <video 
                            ref={localVideoRef} 
                            autoPlay 
                            muted 
                            playsInline 
                            className="w-full h-full object-cover mirror"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/40 font-bold">
                                ME
                            </div>
                        </div>
                    )}
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 rounded text-[10px] text-white/80 font-medium">
                        You {isMuted && "(Muted)"}
                    </div>
                </div>

                <div className="p-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                        <button 
                            onClick={toggleMute}
                            className={`p-2 rounded-xl transition-all ${isMuted ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'}`}
                        >
                            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </button>
                        <button 
                            onClick={toggleVideo}
                            className={`p-2 rounded-xl transition-all ${!isVideoEnabled ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'}`}
                        >
                            {!isVideoEnabled ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                        </button>
                    </div>
                    
                    <button 
                        onClick={() => leaveCall(true)}
                        className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all shadow-lg shadow-red-500/20"
                    >
                        <PhoneOff className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <style>{`
                .mirror {
                    transform: scaleX(-1);
                }
            `}</style>
        </div>
    );
};

const RemoteStreamView: React.FC<{ stream: MediaStream, name: string, videoEnabled: boolean }> = ({ stream, name, videoEnabled }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        if (videoRef.current && videoEnabled) {
            videoRef.current.srcObject = stream;
        }
    }, [stream, videoEnabled]);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <div className="bg-[#1e1f22] rounded-2xl shadow-2xl border border-white/10 overflow-hidden w-64 animate-in zoom-in-95 duration-300">
            <div className="relative aspect-video bg-black">
                {videoEnabled ? (
                    <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-900/40 to-purple-900/40">
                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-lg">
                            {name.substring(0, 1).toUpperCase()}
                        </div>
                    </div>
                )}
                <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 rounded text-[10px] text-white/80 font-medium">
                    {name}
                </div>
            </div>
            {/* Audio element for the remote stream */}
            <audio ref={audioRef} autoPlay />
        </div>
    );
};

export default CallOverlay;
