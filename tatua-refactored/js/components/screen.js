import { dom } from './dom.js';

export function switchScreen(screenName) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('is-active');
    });
    document.getElementById(screenName + 'Screen').classList.add('is-active');

    dom.navLinks.forEach(link => {
        link.classList.remove('is-active');
        if (link.getAttribute('data-screen') === screenName) {
            link.classList.add('is-active');
        }
    });
}