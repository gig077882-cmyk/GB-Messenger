# Круг iOS — starter

Этот каталог фиксирует безопасную стартовую структуру нативного iOS-клиента. Выбран React Native + TypeScript: UI и доменная логика могут разделять типы с web-клиентом, а нативные возможности iOS подключаются только после проверки на реальном устройстве.

## Статус и границы

Здесь нет сгенерированного Xcode-проекта, entitlements, provisioning profiles, сертификатов, ключей или токенов. Их нельзя добавлять как шаблон: значения зависят от bundle identifier, Apple Developer team и разрешений конкретного проекта. Перед первым архивированием владелец Apple Developer-аккаунта создаёт и проверяет их в Xcode.

Приложение предназначено для личного распространения; публикация в App Store не планируется. Пока нативный клиент не собран, поддерживаемым клиентом MVP остаётся Web/PWA.

## Структура

```text
apps/ios/
  README.md
  package.json
  tsconfig.json
  src/
    config.ts       # URL REST/WS без секретов
    api/client.ts   # access-token REST transport
    ws/client.ts    # WebSocket lifecycle
    native/README.md # контракты нативных интеграций
```

Для создания shell-проекта на macOS используйте актуальный React Native CLI в отдельной рабочей ветке, затем перенесите/подключите этот `src/` каталог. Не запускайте генератор в Windows-папке как замену проверки Xcode: архив `.ipa` собирается только на macOS с Xcode.

## API-интеграция

- Базовый REST URL и WebSocket URL задаются на этапе сборки через `KRUG_API_URL` и `KRUG_WS_URL`; они не содержат секретов.
- REST: `POST /api/auth/bootstrap|register|login|refresh|logout`, затем profiles, chats, messages и uploads.
- После входа access token отправляется как `Authorization: Bearer <token>`; refresh token не следует хранить в обычном AsyncStorage.
- WebSocket: `wss://<host>/ws?token=<access-token>`. Подписывайтесь на `session.ready`, presence, message, receipt, chat и call-события; при reconnect заново загружайте изменившиеся REST-ресурсы.
- WebRTC signaling передаётся через `webrtc.offer`, `webrtc.answer`, `webrtc.ice`. Реализуйте mesh максимум для трёх участников, как ограничивает сервер; TURN берите из контролируемой конфигурации звонка, не вшивайте shared secret в приложение.

Сверяйте DTO и события с `backend/src/app.ts` до реализации экранов: эта заготовка не объявляет отдельный, расходящийся контракт API.

## Нативные возможности: план подключения

1. **Secure storage.** Использовать Keychain-backed библиотеку, проверенную для текущей версии React Native. Хранить access/refresh tokens, очищать при logout/компрометации. Не хранить пароли, TURN shared secret или Apple credentials.
2. **WebRTC.** Подключить поддерживаемую iOS-библиотеку WebRTC; запросить камеру/микрофон через штатные privacy descriptions Xcode-проекта. Проверить background/foreground reconnect и TURN fallback на устройстве.
3. **APNs и PushKit.** Настроить APNs key/certificate и capabilities только в Apple Developer/Xcode. Обычные уведомления — для сообщений; PushKit — исключительно для входящих VoIP-вызовов и в связке с CallKit. Серверную регистрацию device token, ротацию, удаление и rate limits нужно реализовать отдельно: текущий backend таких endpoint'ов ещё не содержит.
4. **CallKit.** Сообщать о VoIP-вызове в CallKit без задержки, синхронизировать answer/end с WebRTC signaling, проверять отмену и конкурирующие звонки. Не обещать background incoming calls до подтверждения entitlements и device testing.
5. **Background uploads.** Использовать iOS background `URLSession` через проверенный native bridge; сохранять upload id, номер chunks и SHA-256, возобновлять через `/api/uploads/:id` после запуска. Фоновая работа не гарантирована системой, поэтому UI должен явно показывать состояние и позволять продолжить загрузку.

## Конфигурация и запуск

```sh
cd apps/ios
npm ci
npm run typecheck
```

`npm run start` предназначен для будущего React Native shell. После его создания на macOS устанавливают CocoaPods/зависимости и запускают iOS target из Xcode. URL по умолчанию указывает на `https://localhost` и должен быть заменён безопасной build-time конфигурацией для устройства.

## TrollStore-compatible `.ipa`

TrollStore не является универсальным способом установки: совместимость определяется устройством, версией iOS/iPadOS и актуальной документацией TrollStore. Процесс не заменяет Apple signing для функций, требующих Apple capabilities.

1. На macOS создайте и соберите Xcode target с уникальным bundle identifier; добавьте только подтверждённые capabilities.
2. Прогоните typecheck, unit/integration smoke tests, HTTPS/WS/TURN и звонки на тестовом устройстве.
3. Выполните `Product → Archive` и экспортируйте `.ipa` подходящим для личного распространения методом, который соответствует вашему signing и совместимости устройства.
4. Проверьте целостность, bundle id, версию, отсутствие секретов и установку на совместимом тестовом устройстве; храните `.ipa` в приватном release-хранилище.
5. Отдельно подтвердите работу push/CallKit: TrollStore-установка сама по себе не выдаёт APNs/PushKit entitlement.

Не публикуйте `.ipa`, подписи, профили, private keys или устройства/UDID в репозитории и CI-артефактах.
