// ─── WebSocket event dispatcher ───────────────────────────────────────────────
import { useEffect } from 'react';
import { wsClient } from '@/lib/ws';
import { useChatsStore } from '@/store/chats';
import { useCallsStore } from '@/store/calls';
import type { WsEvent } from '@/types/api';

export function useWsEvents() {
  const addMessage = useChatsStore((s) => s.addMessage);
  const deleteMessage = useChatsStore((s) => s.deleteMessage);
  const updateMessage = useChatsStore((s) => s.updateMessage);
  const updateReaction = useChatsStore((s) => s.updateReaction);
  const setTyping = useChatsStore((s) => s.setTyping);
  const setOnline = useChatsStore((s) => s.setOnline);
  const addChatMember = useChatsStore((s) => s.addChatMember);
  const removeChatMember = useChatsStore((s) => s.removeChatMember);

  const handleOffer = useCallsStore((s) => s.handleOffer);
  const handleAnswer = useCallsStore((s) => s.handleAnswer);
  const handleIce = useCallsStore((s) => s.handleIce);
  const setIncomingCall = useCallsStore((s) => s.setIncomingCall);

  useEffect(() => {
    const unsub = wsClient.on((event: WsEvent) => {
      switch (event.type) {
        case 'message.created':
          addMessage(event.chatId, event.message);
          break;
        case 'message.deleted':
          deleteMessage(event.messageId, event.scope);
          break;
        case 'reaction.updated':
          updateReaction(event.messageId, event.userId, event.emoji, event.active);
          break;
        case 'typing.start':
          setTyping(event.chatId, event.userId, true);
          break;
        case 'typing.stop':
          setTyping(event.chatId, event.userId, false);
          break;
        case 'presence.online':
          setOnline(event.userId, true);
          break;
        case 'presence.offline':
          setOnline(event.userId, false);
          break;
        case 'call.ringing':
          setIncomingCall(event.callId, event.chatId);
          break;
        case 'webrtc.offer':
          void handleOffer(event.callId, event.fromUserId, event.sdp);
          break;
        case 'webrtc.answer':
          handleAnswer(event.fromUserId, event.sdp);
          break;
        case 'webrtc.ice':
          handleIce(event.fromUserId, event.candidate);
          break;
        case 'message.edited':
          updateMessage((event as any).messageId, { text: (event as any).text, updated_at: (event as any).edited_at ?? (event as any).editedAt ?? new Date().toISOString() });
          break;
        case 'message.pinned':
          updateMessage((event as any).messageId, { pinned: true });
          break;
        case 'message.unpinned':
          updateMessage((event as any).messageId, { pinned: false });
          break;
        case 'chat.member_added':
          addChatMember((event as any).chatId, (event as any).member);
          break;
        case 'chat.member_removed':
          removeChatMember((event as any).chatId, (event as any).userId);
          break;
        case 'message.delivered':
          updateMessage((event as any).messageId, { delivered: true });
          break;
        case 'message.read':
          updateMessage((event as any).messageId, { read: true });
          break;
        case 'poll.created':
          // Poll arrives as a message
          addMessage((event as any).chatId, (event as any).message);
          break;
        case 'poll.updated':
          updateMessage((event as any).messageId, { poll: (event as any).poll });
          break;
        case 'user.blocked':
          // no local state needed currently
          console.info('[WS] user.blocked', event);
          break;
        case 'chat.disappearing_updated':
          console.info('[WS] chat.disappearing_updated', event);
          break;
      }
    });
    return unsub;
  }, [addMessage, deleteMessage, updateMessage, updateReaction, setTyping, setOnline, addChatMember, removeChatMember, handleOffer, handleAnswer, handleIce, setIncomingCall]);
}
