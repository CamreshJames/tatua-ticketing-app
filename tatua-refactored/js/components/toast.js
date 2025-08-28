import { dom } from './dom.js';

let toastTimeout;

export function showToast(message, isError = false) {
    clearTimeout(toastTimeout);
    dom.toast.textContent = message;
    dom.toast.className = `toast ${isError ? 'is-error' : ''}`;
    
    // Use a slight delay to ensure the transition is triggered
    setTimeout(() => dom.toast.classList.add('is-visible'), 10);

    toastTimeout = setTimeout(() => {
        dom.toast.classList.remove('is-visible');
    }, 3000);
}