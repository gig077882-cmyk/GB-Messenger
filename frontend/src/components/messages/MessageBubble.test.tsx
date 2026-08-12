import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageBubble } from './MessageBubble';

// Minimal store-free rendering test: no current user means an incoming bubble.
describe('MessageBubble', () => {
  it('shows text and deletion label', () => {
    const { rerender } = render(<MessageBubble message={{ id:'m1', chat_id:'c1', sender_id:'u1', kind:'text', text:'Привет, семья!', file_id:null, reply_to_id:null, forwarded_from_id:null, deleted_for_everyone_at:null, created_at:'2026-01-01T10:00:00Z', updated_at:'2026-01-01T10:00:00Z', reactions:{} }} isOwn={false} onReply={() => {}} />);
    expect(screen.getByText('Привет, семья!')).toBeInTheDocument();
    rerender(<MessageBubble message={{ id:'m1', chat_id:'c1', sender_id:'u1', kind:'text', text:null, file_id:null, reply_to_id:null, forwarded_from_id:null, deleted_for_everyone_at:'2026-01-01T10:01:00Z', created_at:'2026-01-01T10:00:00Z', updated_at:'2026-01-01T10:00:00Z', reactions:{} }} isOwn={false} onReply={() => {}} />);
    expect(screen.getByText('Сообщение удалено')).toBeInTheDocument();
  });
});
