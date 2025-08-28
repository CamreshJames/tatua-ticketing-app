export function showModal(id) {
    const modalEl = document.getElementById(id);
    if (modalEl) {
        modalEl.classList.add('is-active');
    }
}

export function hideModal(id) {
    const modalEl = document.getElementById(id);
    if (modalEl) {
        modalEl.classList.remove('is-active');
    }
}