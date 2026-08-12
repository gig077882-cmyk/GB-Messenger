# Krug / GB-Messenger — download site

Независимая статическая страница для скачивания Android APK. Сайт использует только HTML, CSS и vanilla JavaScript; установка зависимостей не требуется.

## Локальный просмотр

Откройте `index.html` в браузере или запустите любой простой статический HTTP-сервер из папки `download-site`.

Например, если Python установлен:

```powershell
cd E:\GB_Mesenger\download-site
python -m http.server 8080
```

Затем откройте `http://localhost:8080`.

## GitHub Pages

1. Опубликуйте содержимое папки `download-site` в ветке или каталоге, выбранном для GitHub Pages.
2. В настройках репозитория откройте **Pages** и выберите источник публикации (ветку и папку с сайтом).
3. Сохраните настройки и дождитесь публикации.

Главная кнопка использует стабильную ссылку на последний APK-релиз:

`https://github.com/gig077882-cmyk/GB-Messenger/releases/latest/download/GB-Messenger-latest.apk`

При создании нового релиза с ассетом `GB-Messenger-latest.apk` эта ссылка автоматически будет отдавать новую сборку.
