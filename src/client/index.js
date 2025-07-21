import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Polyfills
import 'core-js/stable';
import 'regenerator-runtime/runtime';

// Global styles
import './styles/index.css';

// Service Worker for PWA
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(
            (registration) => {
                console.log('SW registered:', registration);
            },
            (error) => {
                console.log('SW registration failed:', error);
            }
        );
    });
}

// Disable right-click context menu in production
if (process.env.NODE_ENV === 'production') {
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
    });
}

// Performance monitoring
if (process.env.NODE_ENV === 'production') {
    // Report Web Vitals
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS(console.log);
        getFID(console.log);
        getFCP(console.log);
        getLCP(console.log);
        getTTFB(console.log);
    });
}

// Error logging
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    // Send to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
        // TODO: Send to Sentry or similar service
    }
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    // Send to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
        // TODO: Send to Sentry or similar service
    }
});

// Mount React app
const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);

root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);