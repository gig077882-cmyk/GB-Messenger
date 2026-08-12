// ─── Typing indicator hook ────────────────────────────────────────────────────
import { useCallback, useRef } from 'react';
import { wsClient } from '@/lib/ws';

export function useTyping(chatId: string) {
  const typingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onInput = useCallback(() => {
    if (!typingRef.current) {
      typingRef.current = true;
      wsClient.send({ type: 'typing.start', chatId });
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      typingRef.current = false;
      wsClient.send({ type: 'typing.stop', chatId });
    }, 2000);
  }, [chatId]);

  return { onInput };
}
