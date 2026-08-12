import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { openDatabase } from '../src/db.js';

let app:any, db:any;
const cfg={NODE_ENV:'test' as const,DATABASE_PATH:':memory:',STORAGE_PATH:`./data/test-${process.pid}`,JWT_SECRET:'test-secret-must-be-at-least-32-characters',COOKIE_SECURE:false,MIN_FREE_BYTES:0};
beforeEach(async()=>{db=openDatabase(':memory:');app=await buildApp({config:cfg,db})});
afterEach(async()=>{await app.close();db.close()});
const bootstrap=async()=>{const r=await app.inject({method:'POST',url:'/api/auth/bootstrap',payload:{email:'owner@example.com',password:'very-secure-pass',displayName:'Owner'}});return {body:r.json(),cookie:r.cookies[0]?.value}};

describe('auth',()=>{
 it('bootstraps only one owner and logs in',async()=>{const first=await bootstrap();expect(first.body.user.role).toBe('owner');expect((await app.inject({method:'POST',url:'/api/auth/bootstrap',payload:{email:'x@y.com',password:'very-secure-pass',displayName:'X'}})).statusCode).toBe(409);const login=await app.inject({method:'POST',url:'/api/auth/login',payload:{email:'owner@example.com',password:'very-secure-pass'}});expect(login.statusCode).toBe(200);expect(login.json().accessToken).toBeTruthy()});
 it('registers with a single-use invitation',async()=>{const {body}=await bootstrap();const inv=await app.inject({method:'POST',url:'/api/invites',headers:{authorization:`Bearer ${body.accessToken}`},payload:{role:'member'}});const payload={email:'member@example.com',password:'member-secure-pass',displayName:'Member',inviteToken:inv.json().inviteToken};expect((await app.inject({method:'POST',url:'/api/auth/register',payload})).statusCode).toBe(201);expect((await app.inject({method:'POST',url:'/api/auth/register',payload:{...payload,email:'two@example.com'}})).statusCode).toBe(400)});
});
describe('chat and messages',()=>{
 it('creates a unique direct chat, message, reaction and receipt',async()=>{const {body:owner}=await bootstrap();const inv=(await app.inject({method:'POST',url:'/api/invites',headers:{authorization:`Bearer ${owner.accessToken}`},payload:{}})).json();const reg=(await app.inject({method:'POST',url:'/api/auth/register',payload:{email:'member@example.com',password:'member-secure-pass',displayName:'Member',inviteToken:inv.inviteToken}})).json();const h={authorization:`Bearer ${owner.accessToken}`};const a=await app.inject({method:'POST',url:'/api/chats/direct',headers:h,payload:{userId:reg.user.id}});const b=await app.inject({method:'POST',url:'/api/chats/direct',headers:h,payload:{userId:reg.user.id}});expect(a.json().id).toBe(b.json().id);const msg=await app.inject({method:'POST',url:`/api/chats/${a.json().id}/messages`,headers:h,payload:{text:'hello'}});expect(msg.statusCode).toBe(201);expect((await app.inject({method:'POST',url:`/api/messages/${msg.json().id}/reactions`,headers:{authorization:`Bearer ${reg.accessToken}`},payload:{emoji:'❤️'}})).statusCode).toBe(200);expect((await app.inject({method:'POST',url:`/api/messages/${msg.json().id}/receipt`,headers:{authorization:`Bearer ${reg.accessToken}`},payload:{state:'read'}})).statusCode).toBe(200)});
});
