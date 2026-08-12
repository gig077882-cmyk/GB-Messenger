# Круг backend

Node.js/TypeScript/Fastify backend для семейного мессенджера. SQLite работает в WAL-режиме; вложения хранятся локально вне БД.

## Запуск

```text
cp .env.example .env
npm install
npm run build
npm test
npm start
```

## REST API

- Auth: `POST /api/auth/bootstrap`, `/register`, `/login`, `/refresh`, `/logout`; приглашения `POST /api/invites`.
- Профили: `GET|PATCH /api/me`, `GET /api/users`.
- Чаты: создание direct/group, список, участники, archive/pin.
- Сообщения: история/создание, reply/forward, реакции, receipts delivered/read, delete me/everyone, FTS search.
- Файлы: создание upload, status, PUT chunks, complete, download и download-confirmation. По умолчанию 8 MiB chunk, 5 GiB/file и 72 часа хранения.
- Сообщения: author-only edit (15 минут), pin/unpin только для владельца/админа, безопасная проверка sticker/GIF assetRef или allowlisted HTTPS URL.
- Настройки чата: per-user mute, admin-only TTL disappearing (60 секунд—30 дней) и owner-only `POST /api/admin/cleanup` для немедленной очистки истёкших сообщений.
- Безопасность и приватность: `PATCH /api/me/privacy`, block/unblock; блокировка применяется к прямым сообщениям и звонкам. Read receipts не публикуются, если получатель их отключил.
- Polls: `POST /api/chats/:id/polls`, `POST /api/polls/:id/votes`, `GET /api/polls/:id/results`; single-choice голос заменяется идемпотентно.
- Звонки: create/join/leave; сервер жёстко ограничивает активных участников до 3.

## WebSocket

Подключение: `/ws?token=<access-token>`. Серверные события: `session.ready`, `presence.online/offline`, `message.created/deleted/delivered/read`, `reaction.updated`, `chat.member_*`, `call.ringing/joined/left`. Клиентские события: `typing.start/stop`, `webrtc.offer/answer/ice`; signaling разрешён только между активными участниками звонка.

TLS завершается на reverse proxy. В production обязательно задайте случайный `JWT_SECRET`, `COOKIE_SECURE=true`, ограничьте origin на proxy и обеспечьте backup каталога `data`.
