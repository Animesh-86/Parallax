import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { voiceWs, SignalMessage, CallParticipantsMessage } from "../services/wsVoice";
import { toast } from "sonner";
import { jwtDecode } from "jwt-decode";

interface VoiceContextType {
    joinCall: (channelId: string, channelType?: "project" | "room", initialAudio?: boolean, initialVideo?: boolean) => Promise<void>;
    leaveCall: (manual?: boolean) => void;
    toggleMute: () => void;
    toggleVideo: () => void;
    setIsMuted: (muted: boolean) => void;
    isMuted: boolean;
    isVideoEnabled: boolean;
    isConnected: boolean;
    activeSpeakers: string[];
    peers: Map<string, RTCPeerConnection>;
    localStream: MediaStream | null;
    remoteStreams: Map<string, MediaStream>;
    remoteScreenStreams: Map<string, MediaStream>;
    peerNames: Map<string, string>;
    peerVideoEnabled: Map<string, boolean>;
    changeAudioSource: (deviceId: string) => Promise<void>;
    changeVideoSource: (deviceId: string) => Promise<void>;
    beginScreenShare: (stream: MediaStream) => Promise<void>;
    endScreenShare: () => Promise<void>;
    isLocalScreenSharing: boolean;
}

const VoiceContext = createContext<VoiceContextType | null>(null);

export const useVoice = () => {
    const context = useContext(VoiceContext);
    if (!context) {
        throw new Error("useVoice must be used within a VoiceProvider");
    }
    return context;
};

const RTC_CONFIG: RTCConfiguration = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" }
    ]
};

let globalAudioContext: AudioContext | null = null;
function getAudioContext() {
    if (!globalAudioContext) {
        globalAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (globalAudioContext.state === 'suspended') {
        globalAudioContext.resume();
    }
    return globalAudioContext;
}

export const VoiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [activeSpeakers, setActiveSpeakers] = useState<string[]>([]);
    const [isLocalScreenSharing, setIsLocalScreenSharing] = useState(false);
    const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
    const [remoteScreenStreams, setRemoteScreenStreams] = useState<Map<string, MediaStream>>(new Map());
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [isVideoEnabled, setIsVideoEnabled] = useState(false);
    const [peersMapVersion, setPeersMapVersion] = useState(0);
    const [peerNames, setPeerNames] = useState<Map<string, string>>(new Map());
    const [peerVideoEnabled, setPeerVideoEnabled] = useState<Map<string, boolean>>(new Map());

    const localStreamRef = useRef<MediaStream | null>(null);
    const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
    const projectIdRef = useRef<string | null>(null);
    const userIdRef = useRef<string>("");
    const analysersRef = useRef<Map<string, AnalyserNode>>(new Map());
    const speakingFramesRef = useRef<Map<string, number>>(new Map());

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        if (token) {
            try {
                const decoded: any = jwtDecode(token);
                userIdRef.current = decoded.userId || decoded.sub;
            } catch (e) {
                console.error("Failed to decode token for VoiceContext");
            }
        }
    }, []);

    const initLocalStream = async (forceMute?: boolean) => {
        try {
            const activeMute = forceMute !== undefined ? forceMute : isMuted;
            if (localStreamRef.current) {
                localStreamRef.current.getAudioTracks().forEach(t => t.enabled = !activeMute);
                return localStreamRef.current;
            }
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            localStreamRef.current = stream;
            setLocalStream(stream);
            stream.getAudioTracks().forEach(track => track.enabled = !activeMute);
            if (userIdRef.current) setupAudioAnalysis(userIdRef.current, stream);
            return stream;
        } catch (error) {
            console.error("Failed to get local audio", error);
            toast.error("Could not access microphone");
            throw error;
        }
    };

    const negotiate = async (targetId: string, pc: RTCPeerConnection) => {
        try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            voiceWs.sendSignal({
                type: "CALL_OFFER",
                payload: offer,
                senderId: userIdRef.current,
                targetId
            });
        } catch (err) {
            console.error(`Negotiation failed with ${targetId}:`, err);
        }
    };

    const toggleVideo = async () => {
        if (!localStreamRef.current) return;
        const publishVideoPresence = (enabled: boolean) => {
            const message = {
                type: "CALL_PRESENCE" as const,
                senderId: userIdRef.current,
                payload: { videoEnabled: enabled }
            };
            voiceWs.sendSignal(message);
            setTimeout(() => voiceWs.sendSignal(message), 150);
        };
        const existingVideoTrack = localStreamRef.current.getVideoTracks()[0];

        if (existingVideoTrack) {
            if (isVideoEnabled || existingVideoTrack.enabled) {
                // Notify peers BEFORE stopping track
                publishVideoPresence(false);
                
                // Properly stop and remove video track to turn off camera light
                existingVideoTrack.stop();
                localStreamRef.current.removeTrack(existingVideoTrack);
                
                // Notify all peers to remove video sender and renegotiate
                peersRef.current.forEach(async (pc, peerId) => {
                    const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                    if (sender) {
                        await sender.replaceTrack(null);
                        // Renegotiate to update SDP with track removal
                        await negotiate(peerId, pc);
                    }
                });
                
                setIsVideoEnabled(false);
                setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
                return;
            }

            existingVideoTrack.enabled = true;
            setIsVideoEnabled(true);
            setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
            publishVideoPresence(true);
            return;
        }

        try {
            const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
            const newVideoTrack = videoStream.getVideoTracks()[0];
            localStreamRef.current.addTrack(newVideoTrack);
            setIsVideoEnabled(true);
            setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
            peersRef.current.forEach(async (pc, peerId) => {
                const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                if (sender) {
                    await sender.replaceTrack(newVideoTrack);
                } else {
                    pc.addTrack(newVideoTrack, localStreamRef.current!);
                }
                negotiate(peerId, pc);
            });
            publishVideoPresence(true);
        } catch (e) {
            console.error("Failed to enable camera", e);
            toast.error("Could not access camera");
        }
    };

    const changeAudioSource = async (deviceId: string) => {
        if (!localStreamRef.current) return;
        try {
            const newStream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: { exact: deviceId } } });
            const newTrack = newStream.getAudioTracks()[0];
            const oldTrack = localStreamRef.current.getAudioTracks()[0];
            if (oldTrack) { oldTrack.stop(); localStreamRef.current.removeTrack(oldTrack); }
            localStreamRef.current.addTrack(newTrack);
            newTrack.enabled = !isMuted;
            peersRef.current.forEach(pc => {
                const sender = pc.getSenders().find(s => s.track?.kind === 'audio');
                if (sender) sender.replaceTrack(newTrack);
            });
            setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
            setupAudioAnalysis(userIdRef.current, localStreamRef.current);
        } catch (e) {
            console.error("Failed to switch microphone", e);
            toast.error("Could not switch microphone");
        }
    };

    const changeVideoSource = async (deviceId: string) => {
        if (!localStreamRef.current || !isVideoEnabled) return;
        try {
            const newStream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: deviceId } } });
            const newTrack = newStream.getVideoTracks()[0];
            const oldTrack = localStreamRef.current.getVideoTracks()[0];
            if (oldTrack) { oldTrack.stop(); localStreamRef.current.removeTrack(oldTrack); }
            localStreamRef.current.addTrack(newTrack);
            peersRef.current.forEach(pc => {
                const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                if (sender) sender.replaceTrack(newTrack);
            });
            setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
        } catch (e) {
            console.error("Failed to switch camera", e);
            toast.error("Could not switch camera");
        }
    };

    const beginScreenShare = async (stream: MediaStream) => {
        if (!localStreamRef.current) return;
        const screenTrack = stream.getVideoTracks()[0];
        if (!screenTrack) return;

        setIsLocalScreenSharing(true);
        const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];
        if (oldVideoTrack) { oldVideoTrack.stop(); localStreamRef.current.removeTrack(oldVideoTrack); }
        localStreamRef.current.addTrack(screenTrack);

        screenTrack.onended = () => { endScreenShare(); };

        peersRef.current.forEach(async (pc, peerId) => {
            const sender = pc.getSenders().find(s => s.track?.kind === 'video');
            if (sender) {
                await sender.replaceTrack(screenTrack);
            } else {
                pc.addTrack(screenTrack, localStreamRef.current!);
            }
            negotiate(peerId, pc);
        });

        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
    };

    const endScreenShare = async () => {
        if (!localStreamRef.current) return;

        // Handle both explicit stop from our UI and browser-level "Stop sharing" events.
        const hadVideoTrack = localStreamRef.current.getVideoTracks().length > 0;
        if (!hadVideoTrack && !isLocalScreenSharing) return;

        setIsLocalScreenSharing(false);
        const tracks = localStreamRef.current.getVideoTracks();
        tracks.forEach(track => { track.stop(); localStreamRef.current?.removeTrack(track); });

        // Signaling is done via regular track update logic, which should trigger Spotlight reset if others watchCALL_JOIN/PRESENCE
        // But for local user, we need to explicitly re-enable camera if it was on
        if (isVideoEnabled) {
            try {
                const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
                const newVideoTrack = videoStream.getVideoTracks()[0];
                localStreamRef.current.addTrack(newVideoTrack);
                peersRef.current.forEach(async (pc, peerId) => {
                    const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                    if (sender) await sender.replaceTrack(newVideoTrack);
                    negotiate(peerId, pc);
                });
            } catch (e) {
                console.error("Failed to re-acquire camera", e);
                setIsVideoEnabled(false);
                peersRef.current.forEach(async (pc, peerId) => {
                    const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                    if (sender) await sender.replaceTrack(null);
                    negotiate(peerId, pc);
                });
            }
        } else {
            peersRef.current.forEach(async (pc, peerId) => {
                const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                if (sender) await sender.replaceTrack(null);
                negotiate(peerId, pc);
            });
        }
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
        
        // Explicitly notify others about sharing stop
        voiceWs.sendSignal({
            type: "CALL_SCREEN_SHARE",
            senderId: userIdRef.current,
            payload: { isSharing: false }
        });
    };

    const joinCall = useCallback(async (channelId: string, channelType: "project" | "room" = "project", initialAudio: boolean = true, initialVideo: boolean = false) => {
        if (isConnected) return;
        projectIdRef.current = channelId;
        setIsMuted(!initialAudio);
        setIsVideoEnabled(initialVideo);

        try {
            const stream = await initLocalStream(!initialAudio); 
            if (stream) {
                stream.getAudioTracks().forEach(t => t.enabled = initialAudio);
                if (initialVideo) {
                    try {
                        const vStream = await navigator.mediaDevices.getUserMedia({ video: true });
                        const vTrack = vStream.getVideoTracks()[0];
                        stream.addTrack(vTrack);
                        setLocalStream(new MediaStream(stream.getTracks()));
                    } catch (e) {
                        console.warn("Lobby video failed", e);
                        setIsVideoEnabled(false);
                    }
                }
            }

            await voiceWs.connect(channelId, channelType, handleSignal, handleDisconnection);
            setIsConnected(true);

            const getDisplayName = () => {
                const token = localStorage.getItem("access_token");
                if (!token) return "User";
                try {
                    const decoded: any = jwtDecode(token);
                    const name = decoded.displayName || decoded.fullName || decoded.username || decoded.name || decoded.sub?.substring(0, 8);
                    return name || "User";
                } catch { return "User"; }
            };

            voiceWs.sendSignal({ 
                type: "CALL_JOIN", 
                senderId: userIdRef.current,
                payload: { displayName: getDisplayName() } 
            });
            voiceWs.sendSignal({
                type: "CALL_PRESENCE",
                senderId: userIdRef.current,
                payload: { displayName: getDisplayName(), videoEnabled: initialVideo }
            });
            toast.success("Joined voice channel");
        } catch (error) {
            console.error("Failed to join voice call:", error);
            // toast.error("Failed to connect to voice server");
            setIsConnected(false);
        }
    }, [isConnected, initLocalStream]);

    const handleDisconnection = useCallback(() => {
        cleanupVoiceState();
    }, []);

    const cleanupVoiceState = () => {
        peersRef.current.forEach(pc => pc.close());
        peersRef.current.clear();
        setRemoteStreams(new Map());
        setRemoteScreenStreams(new Map());
        setPeerNames(new Map());
        setPeerVideoEnabled(new Map());
        setPeersMapVersion(v => v + 1);

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
            setLocalStream(null);
        }

        setIsConnected(false);
        setIsVideoEnabled(false);
        setIsLocalScreenSharing(false);
        setActiveSpeakers([]);
        analysersRef.current.clear();
        speakingFramesRef.current.clear();
    };

    const leaveCall = useCallback((manual: boolean = false) => {
        if (!isConnected) return;
        voiceWs.disconnect();
        cleanupVoiceState();
        if (manual) toast.info("You left the voice channel");
    }, [isConnected]);

    const handleSignal = async (signal: SignalMessage | CallParticipantsMessage) => {
        if ('participants' in signal) {
            const { participants } = signal;
            participants.forEach(pId => {
                if (pId !== userIdRef.current) createPeerConnection(pId, false);
            });
            return;
        }

        const { type, payload, senderId, targetId } = signal;
        if (targetId && targetId !== userIdRef.current) return;

        switch (type) {
            case "CALL_JOIN":
                if (payload?.displayName) {
                    setPeerNames(prev => new Map(prev).set(senderId, payload.displayName));
                }
                createPeerConnection(senderId, true);
                break;
            case "CALL_PRESENCE":
                if (payload?.displayName) {
                    setPeerNames(prev => new Map(prev).set(senderId, payload.displayName));
                }
                if (typeof payload?.videoEnabled === 'boolean') {
                    setPeerVideoEnabled(prev => new Map(prev).set(senderId, payload.videoEnabled));
                    setPeersMapVersion(v => v + 1);
                }
                break;
            case "CALL_OFFER":
                await handleOffer(senderId, payload);
                break;
            case "CALL_ANSWER":
                await handleAnswer(senderId, payload);
                break;
            case "CALL_ICE":
                await handleIceCandidate(senderId, payload);
                break;
            case "CALL_SCREEN_SHARE":
                setRemoteScreenStreams(prev => {
                    const next = new Map(prev);
                    if (payload.isSharing) {
                        // The track itself will arrive via joinCall/ontrack, 
                        // this signal just helps our UI know which peer is sharing.
                        // We set a marker here.
                        next.set(senderId, new MediaStream()); // Placeholder to indicate sharing
                    } else {
                        next.delete(senderId);
                    }
                    return next;
                });
                break;
            case "CALL_LEAVE":
                removePeer(senderId);
                break;
        }
    };

    const createPeerConnection = async (targetId: string, initiator: boolean) => {
        let pc = peersRef.current.get(targetId);

        if (!pc) {
            pc = new RTCPeerConnection(RTC_CONFIG);
            peersRef.current.set(targetId, pc);
            setPeersMapVersion(v => v + 1);
        }

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                if (!pc!.getSenders().some(s => s.track?.id === track.id)) {
                    pc!.addTrack(track, localStreamRef.current!);
                }
            });
        }

        pc.ontrack = (event) => {
            const stream = event.streams[0];
            setRemoteStreams(prev => {
                const newMap = new Map(prev);
                newMap.set(targetId, stream);
                return newMap;
            });

            if (event.track.kind === 'video') {
                // Keep a browser-agnostic source of truth for remote camera state.
                setPeerVideoEnabled(prev => new Map(prev).set(targetId, true));
            }

            if (event.track.kind === 'video') {
                event.track.onmute = () => {
                    setPeerVideoEnabled(prev => new Map(prev).set(targetId, false));
                    setPeersMapVersion(v => v + 1);
                };

                event.track.onunmute = () => {
                    setPeerVideoEnabled(prev => new Map(prev).set(targetId, true));
                    setPeersMapVersion(v => v + 1);
                };

                event.track.onended = () => {
                    setPeerVideoEnabled(prev => new Map(prev).set(targetId, false));
                    setPeersMapVersion(v => v + 1);
                };
            } else {
                event.track.onmute = () => setPeersMapVersion(v => v + 1);
                event.track.onunmute = () => setPeersMapVersion(v => v + 1);
                event.track.onended = () => setPeersMapVersion(v => v + 1);
            }

            if (event.track.kind === 'audio') setupAudioAnalysis(targetId, stream);
        };

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                voiceWs.sendSignal({ type: "CALL_ICE", payload: event.candidate, senderId: userIdRef.current, targetId });
            }
        };

        if (initiator) await negotiate(targetId, pc);
        return pc;
    };

    const handleOffer = async (senderId: string, offer: RTCSessionDescriptionInit) => {
        let pc = peersRef.current.get(senderId);
        if (!pc) pc = await createPeerConnection(senderId, false);
        if (!pc) return;

        try {
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            voiceWs.sendSignal({ type: "CALL_ANSWER", payload: answer, senderId: userIdRef.current, targetId: senderId });
        } catch (err) {
            console.error("Error in handleOffer", err);
        }
    };

    const handleAnswer = async (senderId: string, answer: RTCSessionDescriptionInit) => {
        const pc = peersRef.current.get(senderId);
        if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
    };

    const handleIceCandidate = async (senderId: string, candidate: RTCIceCandidateInit) => {
        const pc = peersRef.current.get(senderId);
        if (pc) await pc.addIceCandidate(new RTCIceCandidate(candidate));
    };

    const removePeer = (senderId: string) => {
        if (senderId === userIdRef.current) return;
        const pc = peersRef.current.get(senderId);
        if (pc) {
            const analyser = analysersRef.current.get(senderId);
            if (analyser) { analyser.disconnect(); analysersRef.current.delete(senderId); }
            pc.close();
            peersRef.current.delete(senderId);
            setRemoteStreams(prev => {
                const newMap = new Map(prev);
                newMap.delete(senderId);
                return newMap;
            });
            setPeerNames(prev => {
                const newMap = new Map(prev);
                newMap.delete(senderId);
                return newMap;
            });
            setPeerVideoEnabled(prev => {
                const newMap = new Map(prev);
                newMap.delete(senderId);
                return newMap;
            });
            setRemoteScreenStreams(prev => {
                const next = new Map(prev);
                next.delete(senderId);
                return next;
            });
            setPeersMapVersion(v => v + 1);
        }
    };

    const toggleMute = () => {
        if (localStreamRef.current) {
            const newState = !isMuted;
            localStreamRef.current.getAudioTracks().forEach(track => { track.enabled = !newState; });
            setIsMuted(newState);
        }
    };

    const setupAudioAnalysis = (userId: string, stream: MediaStream) => {
        const ctx = getAudioContext();
        if (!ctx) return;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);
        analysersRef.current.set(userId, analyser);
        speakingFramesRef.current.set(userId, 0);
    };

    useEffect(() => {
        let animationFrameId: number;
        const detectSpeaking = () => {
            if (!isConnected) return;
            const speaking: string[] = [];
            const SPEAKING_THRESHOLD = 20;

            analysersRef.current.forEach((analyser, userId) => {
                const dataArray = new Uint8Array(analyser.frequencyBinCount);
                analyser.getByteFrequencyData(dataArray);
                const sum = dataArray.reduce((acc, val) => acc + val, 0);
                const average = sum / dataArray.length;
                let frames = speakingFramesRef.current.get(userId) || 0;
                if (average > SPEAKING_THRESHOLD) frames++;
                else frames = Math.max(0, frames - 1);
                speakingFramesRef.current.set(userId, frames);
                if (frames > 3) speaking.push(userId);
            });

            setActiveSpeakers(prev => {
                const isSame = prev.length === speaking.length && prev.every(id => speaking.includes(id));
                return isSame ? prev : speaking;
            });
            animationFrameId = requestAnimationFrame(detectSpeaking);
        };
        const raf = requestAnimationFrame(detectSpeaking);
        return () => { cancelAnimationFrame(raf); };
    }, [isConnected]);

    return (
        <VoiceContext.Provider value={{
            joinCall, leaveCall, toggleMute, toggleVideo, setIsMuted,
            isMuted, isVideoEnabled, isConnected, activeSpeakers,
            peers: peersRef.current, localStream, remoteStreams, remoteScreenStreams, peerNames, peerVideoEnabled,
            changeAudioSource, changeVideoSource, beginScreenShare, endScreenShare, isLocalScreenSharing
        }}>
            {children}
        </VoiceContext.Provider>
    );
};
