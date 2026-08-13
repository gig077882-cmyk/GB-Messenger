import { create } from 'zustand';
import { UploadQueueManager, type QueueItem } from '@/lib/uploadQueue';
import { messages as messagesApi } from '@/lib/api';
import { useChatsStore } from '@/store/chats';

interface UploadQueueState {
  items: QueueItem[];
  isVisible: boolean;
  add: (file: File, chatId: string, replyToId?: string) => void;
  remove: (id: string) => void;
  pause: (id: string) => void;
  resume: (id: string) => void;
  retry: (id: string) => void;
  clearDone: () => void;
  toggleVisible: () => void;
}

let manager: UploadQueueManager | null = null;

function getManager(
  set: (partial: Partial<UploadQueueState>) => void,
  _get: () => UploadQueueState,
): UploadQueueManager {
  if (!manager) {
    manager = new UploadQueueManager(
      (items) => set({ items: [...items] }),
      async (item, fileId) => {
        try {
          const message = await messagesApi.send(item.chatId, {
            kind: 'file',
            fileId,
            replyToId: item.replyToId,
          });
          useChatsStore.getState().addMessage(item.chatId, message);
        } catch (e) {
          console.error('Failed to send file message', e);
        }
      },
    );
  }
  return manager;
}

export const useUploadQueueStore = create<UploadQueueState>()(
  (set, get) => ({
    items: [],
    isVisible: true,

    add: (file, chatId, replyToId) => {
      getManager(set, get).add(file, chatId, replyToId);
    },

    remove: (id) => {
      getManager(set, get).remove(id);
    },

    pause: (id) => {
      getManager(set, get).pause(id);
    },

    resume: (id) => {
      getManager(set, get).resume(id);
    },

    retry: (id) => {
      getManager(set, get).retry(id);
    },

    clearDone: () => {
      getManager(set, get).clearDone();
    },

    toggleVisible: () => {
      set({ isVisible: !get().isVisible });
    },
  }),
);
