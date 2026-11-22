# Cursor Limits for BUSY Bar (`app.busy.cursor_limits`)

Автономное JavaScript-приложение для устройства **BUSY Bar**, отображающее оставшиеся лимиты и процент использования в IDE **Cursor** (тариф Pro / Hobby).

---

## Почему токен не сохраняется через веб-интерфейс устройства?

В прошивке BUSY Bar для полей строкового типа в `settings.json` установлено аппаратное ограничение protobuf: **максимум 64 байта** (рассчитано на короткие API-ключи, названия городов и т.д.). Токен сессии Cursor (`WorkosCursorSessionToken`) содержит полный JWT-токен и имеет длину более **450 символов**, поэтому веб-интерфейс устройства выдает ошибку `"token too long"`.

Согласно официальным рекомендациям `AGENTS.md` (*"Do not put secrets in settings files"*), длинные токены и ключи вшиваются напрямую в приложение при сборке.

---

## 🚀 Как установить токен (в одну команду)

### Вариант 1. Через команду `npm run set-token` (Рекомендуется)

Подключите BUSY Bar по USB к компьютеру и выполните:

```bash
npm run set-token "ВАШ_ТОКЕН_ИЗ_КУКИ"
```

Скрипт автоматически:
1. Сохранит токен в [src/config.ts](file:///Users/aleksandrivanov/Desktop/busy%20bar%20app/src/config.ts);
2. Соберет бандл (`npm run build`);
3. Установит и запустит приложение на вашем BUSY Bar (`npm run app:install && npm run app:run`).

---

### Вариант 2. Вручную

1. Откройте файл [src/config.ts](file:///Users/aleksandrivanov/Desktop/busy%20bar%20app/src/config.ts);
2. Вставьте ваш токен в поле `sessionToken`:
   ```ts
   export const config = {
     sessionToken: "user_...::...",
     refreshIntervalMin: 5,
     defaultMode: "remaining",
   };
   ```
3. Соберите и отправьте на подключенный бар:
   ```bash
   npm run build
   npm run app:install
   npm run app:run
   ```

---

## 🔍 Где взять `WorkosCursorSessionToken`

1. Зайдите на [cursor.com](https://www.cursor.com) в браузере и войдите в аккаунт.
2. Нажмите `F12` (или `Cmd + Option + I` на Mac) $\to$ вкладка **Application** (в Safari/Firefox: **Хранилище / Storage**).
3. В левом меню раскройте **Cookies** $\to$ выберите `https://cursor.com`.
4. Найдите строку **`WorkosCursorSessionToken`** и скопируйте её значение.

---

## Управление на BUSY Bar

* **`start`** (или энкодер): переключение между режимами:
  * `55% LEFT` — оставшийся процент лимита;
  * `45% USED` — использованный процент;
  * `14D RESET` — количество дней до сброса периода подписки.
* **`ok`**: принудительная внеочередная синхронизация с серверами Cursor.
* **`back`**: корректный выход из приложения.
