# form-generator-app

Профессиональный генератор форм на Vue 3 + TypeScript

## Быстрый старт

sh
npm install
npm run dev


## Структура проекта


form-generator-app/
├── public/                # Статические файлы (index.html, favicon, animejs CDN)
├── src/
│   ├── assets/            # SCSS-стили, картинки
│   ├── components/        # FormGenerator, ContactTitle, другие компоненты
│   ├── views/             # Демо-страницы: ContactDemo, WizardDemo, DynamicDemo
│   ├── store/             # Vuex store
│   ├── router/            # Vue Router
│   ├── App.vue            # Корневой компонент
│   └── main.js            # Точка входа
├── package.json           # Зависимости и скрипты
├── README.md              # Документация
└── ...


## Как запускать
1. Перейдите в папку проекта:
   sh
   cd form-generator-app
   
2. Установите зависимости:
   sh
   npm install
   
3. Запустите dev-сервер:
   sh
   npm run dev
   
4. Откройте браузер по адресу, который появится в терминале (обычно http://localhost:5173)

## Архитектура
- **FormGenerator** — универсальный компонент генерации форм с поддержкой слотов, строгой типизацией и валидацией
- **Vuex** — для хранения состояния форм
- **Vue Router** — для навигации между демо-страницами
- **SCSS + BEM** — для стилей
- **Демо-страницы**:
  - Contact Demo — простая контактная форма
  - Wizard Demo — многошаговая форма
  - Dynamic Demo — форма с динамическими полями

## Скриншоты
https://postimg.cc/RJqpVQVD
https://postimg.cc/YjyyDVdK
https://postimg.cc/LhsbTRB3


Автор: Бушин Дмитрий
