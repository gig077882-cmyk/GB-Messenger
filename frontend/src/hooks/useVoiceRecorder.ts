// ─── Voice recorder hook ──────────────────────────────────────────────────────
import { useState, useRef, useCallback } from 'react';

export interface VoiceRecording {
  blob: Blob;
  durationMs: number;
  url: string;
}

export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
    chunksRef.current = [];
    mr.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    mr.start(100);
    mediaRecorderRef.current = mr;
    startTimeRef.current = Date.now();
    setIsRecording(true);
    setDuration(0);
    timerRef.current = setInterval(() => {
      setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 500);
  }, []);

  const stop = useCallback((): Promise<VoiceRecording> => {
    return new Promise((resolve) => {
      const mr = mediaRecorderRef.current;
      if (!mr) return;
      if (timerRef.current) clearInterval(timerRef.current);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const durationMs = Date.now() - startTimeRef.current;
        mr.stream.getTracks().forEach((t) => t.stop());
        setIsRecording(false);
        resolve({ blob, durationMs, url });
      };
      mr.stop();
    });
  }, []);

  const cancel = useCallback(() => {
    const mr = mediaRecorderRef.current;
    if (!mr) return;
    if (timerRef.current) clearInterval(timerRef.current);
    mr.stream.getTracks().forEach((t) => t.stop());
    mr.stop();
    setIsRecording(false);
    setDuration(0);
  }, []);

  return { isRecording, duration, start, stop, cancel };
}
