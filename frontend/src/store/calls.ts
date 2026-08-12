// ─── Calls store (WebRTC) ─────────────────────────────────────────────────────
import { create } from 'zustand';
import { calls as callsApi } from '@/lib/api';
import { wsClient } from '@/lib/ws';

export type CallStatus = 'idle' | 'ringing' | 'active' | 'ended';

interface Peer {
  userId: string;
  pc: RTCPeerConnection;
  stream: MediaStream | null;
}

interface CallsState {
  callId: string | null;
  chatId: string | null;
  status: CallStatus;
  localStream: MediaStream | null;
  peers: Peer[];
  isMuted: boolean;
  isVideoOn: boolean;
  iceServers: RTCIceServer[];

  startCall: (chatId: string) => Promise<void>;
  joinCall: (callId: string) => Promise<void>;
  leaveCall: () => Promise<void>;
  handleOffer: (callId: string, fromUserId: string, sdp: RTCSessionDescriptionInit) => Promise<void>;
  handleAnswer: (fromUserId: string, sdp: RTCSessionDescriptionInit) => void;
  handleIce: (fromUserId: string, candidate: RTCIceCandidateInit) => void;
  setIncomingCall: (callId: string, chatId: string) => void;
  toggleMute: () => void;
  toggleVideo: () => void;
}

// Fallback ICE servers constant (used if TURN config fetch fails)
const ICE_SERVERS_FALLBACK: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
];

function createPeerConnection(iceServers: RTCIceServer[], onIce: (c: RTCIceCandidateInit) => void): RTCPeerConnection {
  const pc = new RTCPeerConnection({ iceServers });
  pc.onicecandidate = (e) => {
    if (e.candidate) onIce(e.candidate.toJSON());
  };
  return pc;
}

export const useCallsStore = create<CallsState>()((set, get) => ({
  callId: null,
  chatId: null,
  status: 'idle',
  localStream: null,
  peers: [],
  isMuted: false,
  isVideoOn: false,
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],

  startCall: async (chatId) => {
    const config = await callsApi.turnConfig().catch(() => ({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' as const }] }));
    set({ iceServers: config.iceServers });
    const call = await callsApi.create(chatId);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    set({ callId: call.id, chatId, status: 'ringing', localStream: stream });
  },

  joinCall: async (callId) => {
    const config = await callsApi.turnConfig().catch(() => ({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' as const }] }));
    set({ iceServers: config.iceServers });
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    await callsApi.join(callId);
    set({ callId, status: 'active', localStream: stream });
  },

  leaveCall: async () => {
    const { callId, localStream, peers } = get();
    peers.forEach((p) => p.pc.close());
    localStream?.getTracks().forEach((t) => t.stop());
    if (callId) await callsApi.leave(callId).catch(() => {});
    set({ callId: null, chatId: null, status: 'idle', localStream: null, peers: [] });
  },

  handleOffer: async (callId, fromUserId, sdp) => {
    const { localStream } = get();
    if (!localStream) return;
    const pc = createPeerConnection(get().iceServers, (candidate) => {
      wsClient.send({ type: 'webrtc.ice', callId, toUserId: fromUserId, candidate });
    });
    localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));
    pc.ontrack = (e) => {
      set((s) => ({
        peers: s.peers.map((p) =>
          p.userId === fromUserId ? { ...p, stream: e.streams[0] } : p,
        ),
      }));
    };
    await pc.setRemoteDescription(sdp);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    wsClient.send({ type: 'webrtc.answer', callId, toUserId: fromUserId, sdp: answer });
    set((s) => ({
      peers: [...s.peers.filter((p) => p.userId !== fromUserId), { userId: fromUserId, pc, stream: null }],
    }));
  },

  handleAnswer: (fromUserId, sdp) => {
    const peer = get().peers.find((p) => p.userId === fromUserId);
    peer?.pc.setRemoteDescription(sdp);
  },

  handleIce: (fromUserId, candidate) => {
    const peer = get().peers.find((p) => p.userId === fromUserId);
    peer?.pc.addIceCandidate(candidate);
  },

  setIncomingCall: (callId, chatId) => {
    set({ callId, chatId, status: 'ringing' });
  },

  toggleMute: () => {
    const { localStream, isMuted } = get();
    localStream?.getAudioTracks().forEach((t) => (t.enabled = isMuted));
    set({ isMuted: !isMuted });
  },

  toggleVideo: () => {
    const { localStream, isVideoOn } = get();
    localStream?.getVideoTracks().forEach((t) => (t.enabled = !isVideoOn));
    set({ isVideoOn: !isVideoOn });
  },
}));

// Re-export fallback for external use if needed
export { ICE_SERVERS_FALLBACK };
