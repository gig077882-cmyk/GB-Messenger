import { useEffect, useRef } from 'react';
import { useCallsStore } from '@/store/calls';
import { useChatsStore } from '@/store/chats';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import styles from './CallOverlay.module.css';

function Video({ stream, muted = false }: { stream: MediaStream | null; muted?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => { if (ref.current) ref.current.srcObject = stream; }, [stream]);
  return <video ref={ref} autoPlay playsInline muted={muted} className={styles.video} />;
}

export function CallOverlay() {
  const callId = useCallsStore((s) => s.callId);
  const chatId = useCallsStore((s) => s.chatId);
  const status = useCallsStore((s) => s.status);
  const localStream = useCallsStore((s) => s.localStream);
  const peers = useCallsStore((s) => s.peers);
  const isMuted = useCallsStore((s) => s.isMuted);
  const toggleMute = useCallsStore((s) => s.toggleMute);
  const toggleVideo = useCallsStore((s) => s.toggleVideo);
  const joinCall = useCallsStore((s) => s.joinCall);
  const leaveCall = useCallsStore((s) => s.leaveCall);
  const chats = useChatsStore((s) => s.chats);
  const chat = chats.find((c) => c.id === chatId);
  if (!callId) return null;
  const title = chat?.title ?? 'Звонок в Круге';
  return <div className={styles.overlay} role="dialog" aria-label="Звонок">
    <div className={styles.panel}>
      <div className={styles.title}><Avatar name={title} size="lg"/><h2>{title}</h2><p>{status === 'ringing' ? 'Входящий или исходящий звонок' : `Участников: ${1 + peers.length} из 3`}</p></div>
      {status === 'active' && <div className={styles.videos}><div className={styles.tile}><Video stream={localStream} muted/><span>Вы</span></div>{peers.map((p) => <div className={styles.tile} key={p.userId}><Video stream={p.stream}/><span>Участник</span></div>)}</div>}
      <div className={styles.controls}>
        {status === 'ringing' && !localStream && <Button onClick={() => void joinCall(callId)}>Присоединиться</Button>}
        {localStream && <Button variant="secondary" onClick={toggleMute}>{isMuted ? 'Включить микрофон' : 'Выключить микрофон'}</Button>}
        {localStream && <Button variant="secondary" onClick={toggleVideo}>Видео</Button>}
        <Button variant="danger" onClick={() => void leaveCall()}>Завершить</Button>
      </div>
      <p className={styles.hint}>Mesh WebRTC · максимум 3 участника · signaling через сервер</p>
    </div>
  </div>;
}
