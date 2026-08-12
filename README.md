<<<<<<< HEAD
# Круг / GB-Messenger

«Круг» — self-hosted мессенджер для небольшой закрытой группы до 60 пользователей. MVP рассчитан на запуск одного экземпляра backend на собственном сервере через Docker Compose.

## Возможности

- личные и групповые чаты, ответы, пересылка, реакции, поиск и статусы доставки/прочтения;
- приглашения и роли `owner`, `admin`, `member`;
- временные вложения до 5 ГиБ с загрузкой частями и возобновлением;
- presence, typing и доставка событий через WebSocket;
- аудио- и видеозвонки WebRTC до трёх участников с TURN;
- адаптивный web-клиент React PWA;
- заготовка TypeScript для будущего нативного iOS-клиента.

## Сервисы и архитектура

| Компонент | Назначение |
| --- | --- |
| `backend/` | Fastify + TypeScript: REST API, WebSocket signaling и SQLite в WAL-режиме. |
| `frontend/` | React, Vite и TypeScript: web/PWA-клиент. |
| `infra/caddy/` | HTTPS/TLS и reverse proxy — единственная внешняя HTTP-точка входа. |
| `infra/coturn/` | TURN для резервного маршрута WebRTC. |
| `infra/backup/` | Резервное копирование SQLite и конфигурационных метаданных по расписанию. |
| `apps/ios/` | Документированная основа будущего iOS-клиента. |

Backend намеренно запускается в одном экземпляре: это соответствует модели записи SQLite в MVP. Подробнее: [архитектура](docs/architecture.md).

## Быстрый старт

### Разработка web и backend

Требуется Node.js 20+.

```powershell
# Терминал 1
cd backend
Copy-Item .env.example .env
npm ci
npm run dev

# Терминал 2
cd frontend
npm ci
npm run dev
```

Vite запускает web-клиент; запросы `/api` и `/ws` проксируются на backend `localhost:3000`.

### Полный стек Docker Compose

Требуется Docker Desktop или Docker Engine с Compose v2.

1. Создайте локальный `.env` из `.env.example`.
2. Замените шаблонные `JWT_SECRET` и `TURN_SHARED_SECRET` на уникальные случайные значения длиной не менее 32 символов.
3. Укажите параметры TURN: `TURN_REALM`, `TURN_EXTERNAL_IP` и при необходимости `TURN_HOST`.
4. Проверьте конфигурацию и запустите сервисы:

```powershell
Copy-Item .env.example .env
# Отредактируйте .env, не добавляя его в репозиторий.
docker compose --env-file .env config -q
docker compose --env-file .env up -d --build
docker compose --env-file .env ps
```

### Запуск на Windows через скрипт

`scripts/start-server.ps1` выполняет безопасные предварительные проверки, не выводит значения из `.env`, проверяет обязательные переменные и запускает Compose.

```powershell
.\scripts\start-server.ps1
# Без пересборки образов:
.\scripts\start-server.ps1 -NoBuild
```

Перед запуском создайте и заполните `.env`. Скрипт не заменяет настройку DNS, TLS и firewall.

## Конфигурация и безопасная эксплуатация

- `.env.example` — только шаблон; рабочий `.env` храните вне Git и с ограниченным доступом.
- Для production задайте `DOMAIN`, `ACME_EMAIL`, публичный `TURN_EXTERNAL_IP`, `TURN_REALM`, а также уникальные `JWT_SECRET` и `TURN_SHARED_SECRET`.
- Оставляйте `COOKIE_SECURE=true` при HTTPS. Не публикуйте backend и frontend напрямую — используйте Caddy.
- Откройте TCP 80/443, UDP 443, TCP/UDP 3478 и UDP 49160–49200.
- Вложения временные и не входят в резервные копии; контролируйте свободное место и проверяйте восстановление backup.

Полная инструкция: [развёртывание](docs/deployment.md).

## Проверки и CI

```sh
npm run check --prefix backend
npm run build --prefix frontend
npm test --prefix frontend
docker compose --env-file .env.validation config -q
```

GitHub Actions запускает проверку backend, сборку и тесты frontend, а также валидацию Docker Compose. `.env.validation` содержит только безопасные непроизводственные значения и предназначен исключительно для проверки конфигурации.

## Безопасность и границы MVP

Передача данных защищается HTTPS/TLS. **Сквозное шифрование (E2EE) в MVP не реализовано**: оператор сервера технически может иметь доступ к данным. Не коммитьте `.env`, ключи, сертификаты, provisioning profiles, токены или резервные копии с данными; не выводите их в CI-логи.

## Дополнительная документация

- [Архитектура](docs/architecture.md)
- [Развёртывание](docs/deployment.md)
- [iOS-клиент: статус и план интеграции](apps/ios/README.md)
- [Правила участия](CONTRIBUTING.md)
- [Лицензия MIT](LICENSE)
=======
# GB-Messenger
>>>>>>> cc57631ee1e02bad07d299160a72eff223b77888
