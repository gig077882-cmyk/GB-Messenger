# Развёртывание «Круга»

1. Скопируйте `.env.example` в `.env`, задайте домен, почту ACME, публичный IP TURN и новые криптографически стойкие `JWT_SECRET`/`TURN_SHARED_SECRET`.
2. Убедитесь, что DNS `DOMAIN` указывает на этот хост и что Docker имеет место для вложений и резервных копий.
3. Проверьте конфигурацию: `docker compose config`.
4. Соберите и запустите: `docker compose up -d --build`.
5. Состояние: `docker compose ps`; журнал: `docker compose logs -f backend caddy coturn backup`.

В production откройте firewall: TCP 80, TCP 443, UDP 443 (HTTP/3), TCP/UDP 3478 и UDP 49160–49200. Для локальной разработки используйте `DOMAIN=localhost`; Caddy создаст локальный сертификат. Не публикуйте порты backend/frontend напрямую.

Сервисы имеют лимиты 512+64+128+128+128 МБ = 960 МБ и 1.35 CPU. Backend строго один: SQLite находится в named volume `backend_data` вместе с `storage/uploads`.

`backup` раз в сутки делает SQLite online `.backup`, архивирует конфигурационные метаданные (без `.env`) и хранит 7 daily, 4 weekly и 3 monthly архива в named volume `backups`. Вложения остаются временными и не входят в backup; их безопасная очистка уже выполняется backend по `FILE_RETENTION_HOURS` каждый час. Лимиты upload/storage переданы backend через environment: 5 ГБ, 300 ГБ, резерв 50 ГБ.
