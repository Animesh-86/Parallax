import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { voiceWs, SignalMessage, CallParticipantsMessage } from "../services/wsVoice";
import { toast } from "sonner";
import { jwtDecode } from "jwt-decode";
import { Client } from "@stomp/stompjs";

interface VoiceContextType {
    joinCall: (projectId: string) => Promise<void>;
    leaveCall: (manual?: boolean) => void;
    toggleMute: () => void;
    toggleVideo: () => void;
    isMuted: boolean;
    isVideoEnabled: boolean;
    isConnected: boolean;
    activeSpeakers: string[];
    peers: Map<string, RTCPeerConnection>;
    localStream: MediaStream | null;
    remoteStreams: Map<string, MediaStream>;
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

// GLOBAL AudioContext Singleton
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

    // State for streams
    const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [isVideoEnabled, setIsVideoEnabled] = useState(false);

    // State to force re-render when peers map changes
    const [peersMapVersion, setPeersMapVersion] = useState(0);

    const localStreamRef = useRef<MediaStream | null>(null);
    const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
    const projectIdRef = useRef<string | null>(null);
    const userIdRef = useRef<string>("");

    // Active Speaker Detection Refs
    const analysersRef = useRef<Map<string, AnalyserNode>>(new Map());
    const speakingFramesRef = useRef<Map<string, number>>(new Map());

    // Get User ID from token
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

    const initLocalStream = async () => {
        try {
            // V1 Rule 6: Audio Only, acquire once
            if (localStreamRef.current) return localStreamRef.current;

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            localStreamRef.current = stream;
            setLocalStream(stream);

            // Apply initial mute state
            stream.getAudioTracks().forEach(track => track.enabled = !isMuted);

            // SETUP LOCAL AUDIO ANALYSIS (Crucial Fix: Analyze OWN audio)
            // We verify userId is present first
            if (userIdRef.current) {
                setupAudioAnalysis(userIdRef.current, stream);
            } else {
                console.warn("User ID not available during initLocalStream, analytics might fail for self");
            }

            return stream;
        } catch (error) {
            console.error("Failed to get local audio", error);
            toast.error("Could not access microphone");
            throw error;
        }
    };

    const toggleVideo = async () => {
        if (!localStreamRef.current) return;

        const videoTracks = localStreamRef.current.getVideoTracks();

        if (videoTracks.length > 0) {
            // Turning OFF: Fully Stop Track to release hardware (Light OFF)
            videoTracks.forEach(track => {
                track.stop();
                localStreamRef.current?.removeTrack(track);
            });
            setIsVideoEnabled(false);

            // Force React re-render of local stream consumers
            // We create a new object reference to ensure components detect the change
            setLocalStream(new MediaStream(localStreamRef.current.getTracks()));

            // Update peers?
            // Since we removed the track, we might need to renegotiate or simply let the 'mute' happen.
            // But stripping the track is cleaner for hardware.
            // Ideally we should replaceTrack(null) or wait for renegotiation.
            // For now, this is enough to kill the local preview and light.

        } else {
            // Turning ON
            try {
                const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
                const newVideoTrack = videoStream.getVideoTracks()[0];

                localStreamRef.current.addTrack(newVideoTrack);
                setIsVideoEnabled(true);

                // Force Update
                setLocalStream(new MediaStream(localStreamRef.current.getTracks()));

                // Add to existing connections
                peersRef.current.forEach((pc, peerId) => {
                    // Check if there is a sender for video
                    const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                    if (sender) {
                        sender.replaceTrack(newVideoTrack);
                    } else {
                        pc.addTrack(newVideoTrack, localStreamRef.current!);
                        // Trigger renegotiation if possible/needed
                        // In this simplified context, we just add the track. 
                        // If renegotiation is required, we call createPeerConnection(..., true) again usually, 
                        // but that creates a new offer which might be complex mid-call.
                        // Assuming stable connection allows "addTrack" -> "negotiationneeded"
                        pc.createOffer().then(offer => {
                            pc.setLocalDescription(offer);
                            voiceWs.sendSignal({ type: "CALL_OFFER", payload: offer, senderId: userIdRef.current, targetId: peerId });
                        }).catch(e => console.error("Renegotiation failed", e));
                    }
                });

            } catch (e) {
                console.error("Failed to enable camera", e);
                toast.error("Could not access camera");
            }
        }
    };

    const joinCall = useCallback(async (projectId: string) => {
        if (isConnected) return;

        console.log(`📞 V1 Joining call for project: ${projectId}`);
        projectIdRef.current = projectId;

        try {
            await initLocalStream();
            await voiceWs.connect(
                projectId,
                handleSignal,
                () => {
                    // On Disconnect Callback (from wsVoice)
                    console.warn("⚠️ Voice WS Disconnected (Timeout or Network)");
                    // We call leaveCall but suppress the "Left voice channel" toast if needed, 
                    // or show a different one.
                    handleDisconnection();
                }
            );

            setIsConnected(true);
            toast.success("Joined voice channel");
        } catch (error) {
            console.error("Failed to join voice call:", error);
            toast.error("Failed to connect to voice server");
            setIsConnected(false);
        }
    }, [isConnected]);

    // Internal cleaner without Toast for timeouts
    const handleDisconnection = useCallback(() => {
        cleanupVoiceState();
        // toast.error("Voice connection lost (Timeout)"); // User requested no popup on timeout
    }, []);

    const cleanupVoiceState = () => {
        peersRef.current.forEach(pc => pc.close());
        peersRef.current.clear();
        setRemoteStreams(new Map());
        setPeersMapVersion(v => v + 1);

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
            setLocalStream(null);
        }

        setIsConnected(false);
        setIsVideoEnabled(false);
        setActiveSpeakers([]);
        analysersRef.current.clear();
        speakingFramesRef.current.clear();
    };

    const leaveCall = useCallback((manual: boolean = false) => {
        console.group("leaveCall Trace");
        console.trace("Who called leaveCall?");
        console.groupEnd();

        if (!isConnected) return;

        voiceWs.disconnect();
        cleanupVoiceState();

        if (manual) {
            toast.info("You left the voice channel");
        }
    }, [isConnected]);

    const handleSignal = async (signal: SignalMessage | CallParticipantsMessage) => {
        if ('participants' in signal) {
            const { participants } = signal;
            participants.forEach(pId => {
                if (pId !== userIdRef.current) {
                    createPeerConnection(pId, false);
                }
            });
            return;
        }

        const { type, payload, senderId, targetId } = signal;
        if (targetId && targetId !== userIdRef.current) return;

        console.log(`📶 Received V1 signal: ${type} from ${senderId}`);

        switch (type) {
            case "CALL_JOIN":
                createPeerConnection(senderId, true);
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
            case "CALL_LEAVE":
                removePeer(senderId);
                break;
        }
    };

    const createPeerConnection = async (targetId: string, initiator: boolean) => {
        let pc = peersRef.current.get(targetId);

        if (!pc) {
            console.log(`🔗 Creating PC for ${targetId}. Initiator: ${initiator}`);
            pc = new RTCPeerConnection(RTC_CONFIG);
            peersRef.current.set(targetId, pc);
            setPeersMapVersion(v => v + 1);
        }

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                if (pc!.getSenders().some(s => s.track?.id === track.id)) return;
                pc!.addTrack(track, localStreamRef.current!);
            });
        }

        pc.ontrack = (event) => {
            console.log(`🔊/📹 Received remote track from ${targetId} (${event.track.kind})`);
            const stream = event.streams[0];

            setRemoteStreams(prev => {
                const newMap = new Map(prev);
                newMap.set(targetId, stream);
                return newMap;
            });

            if (event.track.kind === 'audio') {
                setupAudioAnalysis(targetId, stream);
            }
        };

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                voiceWs.sendSignal({
                    type: "CALL_ICE",
                    payload: event.candidate,
                    senderId: userIdRef.current,
                    targetId
                });
            }
        };

        if (initiator) {
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
                console.error("Error creating offer", err);
            }
        }

        return pc;
    };

    const handleOffer = async (senderId: string, offer: RTCSessionDescriptionInit) => {
        const pc = await createPeerConnection(senderId, false);
        if (!pc) return;

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        voiceWs.sendSignal({
            type: "CALL_ANSWER",
            payload: answer,
            senderId: userIdRef.current,
            targetId: senderId
        });
    };

    const handleAnswer = async (senderId: string, answer: RTCSessionDescriptionInit) => {
        const pc = peersRef.current.get(senderId);
        if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
        }
    };

    const handleIceCandidate = async (senderId: string, candidate: RTCIceCandidateInit) => {
        const pc = peersRef.current.get(senderId);
        if (pc) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
    };

    const removePeer = (senderId: string) => {
        // Double check we don't process our own leave signal if it somehow loops back
        if (senderId === userIdRef.current) return;

        const pc = peersRef.current.get(senderId);
        if (pc) {
            const analyser = analysersRef.current.get(senderId);
            if (analyser) {
                analyser.disconnect();
                analysersRef.current.delete(senderId);
            }
            pc.close();
            peersRef.current.delete(senderId);
            setRemoteStreams(prev => {
                const newMap = new Map(prev);
                newMap.delete(senderId);
                return newMap;
            });
            setPeersMapVersion(v => v + 1);
            // toast.info("User left call"); // Removed per user request to avoid ghost notification spam
        } else {
            // If peer didn't exist in our map, it might be a ghost or duplicate signal.
            // Suppress the toast.
            console.warn(`Ignored CALL_LEAVE from unknown/unconnected peer: ${senderId}`);
        }
    };

    const toggleMute = () => {
        if (localStreamRef.current) {
            const newState = !isMuted;
            localStreamRef.current.getAudioTracks().forEach(track => {
                track.enabled = !newState;
            });
            setIsMuted(newState);
        }
    };

    const setupAudioAnalysis = (userId: string, stream: MediaStream) => {
        const ctx = getAudioContext();
        if (!ctx) return;

        // V1 Phase 2.2: Source -> Analyser
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

            // Reduced threshold to 20 for easier triggering
            const SPEAKING_THRESHOLD = 20;

            analysersRef.current.forEach((analyser, userId) => {
                const dataArray = new Uint8Array(analyser.frequencyBinCount);
                analyser.getByteFrequencyData(dataArray);

                const sum = dataArray.reduce((acc, val) => acc + val, 0);
                const average = sum / dataArray.length;

                let frames = speakingFramesRef.current.get(userId) || 0;

                if (average > SPEAKING_THRESHOLD) {
                    frames++;
                } else {
                    frames = Math.max(0, frames - 1);
                }
                speakingFramesRef.current.set(userId, frames);

                if (frames > 3) { // Reduced frame count for faster response
                    speaking.push(userId);
                }
            });

            setActiveSpeakers(prev => {
                const isSame = prev.length === speaking.length && prev.every(id => speaking.includes(id));
                return isSame ? prev : speaking;
            });

            animationFrameId = requestAnimationFrame(detectSpeaking);
        };

        const raf = requestAnimationFrame(detectSpeaking);
        return () => {
            cancelAnimationFrame(raf);
        };
    }, [isConnected]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === "Space" && isMuted && isConnected && !e.repeat) {
                const active = document.activeElement;
                const tagName = active?.tagName;
                const isInput = tagName === "INPUT" || tagName === "TEXTAREA";
                const isEditor = active?.classList.contains("monaco-mouse-cursor-text") || active?.closest(".monaco-editor");

                if (isInput || isEditor) return;

                e.preventDefault();

                if (localStreamRef.current) {
                    localStreamRef.current.getAudioTracks().forEach(t => t.enabled = true);
                    setIsMuted(false);
                }
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === "Space" && !isMuted && isConnected) {
                if (localStreamRef.current) {
                    localStreamRef.current.getAudioTracks().forEach(t => t.enabled = false);
                    setIsMuted(true);
                }
            }
        };

        const handleBlur = () => {
            if (!isMuted && isConnected && localStreamRef.current) {
                localStreamRef.current.getAudioTracks().forEach(t => t.enabled = false);
                setIsMuted(true);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        window.addEventListener("blur", handleBlur);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
            window.removeEventListener("blur", handleBlur);
        };
    }, [isConnected, isMuted]);

    return (
        <VoiceContext.Provider value={{
            joinCall,
            leaveCall,
            toggleMute,
            toggleVideo,
            isMuted,
            isVideoEnabled,
            isConnected,
            activeSpeakers,
            peers: peersRef.current,
            localStream,
            remoteStreams
        }}>
            {children}
        </VoiceContext.Provider>
    );
};
