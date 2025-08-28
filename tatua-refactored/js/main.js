import { App } from './app.js';

document.addEventListener('DOMContentLoaded', () => {
    // Make the app instance globally available.
    // This is a pragmatic choice to allow simple `onclick="app.viewTicket(...)"` handlers in the HTML,
    // which simplifies dynamic table row generation.
    window.app = new App();
});