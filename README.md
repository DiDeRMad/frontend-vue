# Super Puper Online Game (Prototype)

Это монорепозиторий с серверной частью на TypeScript + Express + Socket.IO и (в будущем) клиентом на React / WebGL. Пока что здесь только MVP-сервер.

## Быстрый запуск

```bash
# Установить зависимости
cd server
npm install

# Запустить в режиме разработки
npm run dev
```

Сервер будет доступен на http://localhost:3000 и принимать Socket.IO-подключения на том же порту.

## Запуск клиента

```bash
cd client
npm install
npm run dev
```

Клиент откроется на http://localhost:5173 и будет подключаться к серверу на http://localhost:3000.
