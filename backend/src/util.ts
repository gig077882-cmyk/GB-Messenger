import { createHash, randomBytes, randomUUID } from 'node:crypto';

export const id = () => randomUUID();
export const token = () => randomBytes(32).toString('base64url');
export const sha256 = (value: string | Buffer) =>
  createHash('sha256').update(value).digest('hex');
export const now = () => new Date().toISOString();
export const future = (days: number) =>
  new Date(Date.now() + days * 86_400_000).toISOString();

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
