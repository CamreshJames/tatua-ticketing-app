export function setupFormValidationListeners(formId) {
    const form = document.getElementById(formId);
    form.querySelectorAll('input, textarea, select').forEach(input => {
        input.addEventListener('blur', (e) => validateField(e.target));
        input.addEventListener('input', (e) => validateField(e.target));
    });
}

export function validateField(field) {
    const fieldName = field.name || field.id;
    let isValid = true;
    clearFieldError(fieldName);

    switch (fieldName) {
        case 'fullName': case 'editFullName':
            if (!field.value.trim()) {
                showFieldError(fieldName, 'Full name is required'); isValid = false;
            } else if (field.value.trim().length < 2) {
                showFieldError(fieldName, 'Must be at least 2 characters'); isValid = false;
            }
            break;
        case 'email': case 'editEmail':
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!field.value.trim()) {
                showFieldError(fieldName, 'Email is required'); isValid = false;
            } else if (!emailPattern.test(field.value.trim())) {
                showFieldError(fieldName, 'Please enter a valid email'); isValid = false;
            }
            break;
        case 'phone': case 'editPhone':
            const phonePattern = /^(?:0[17]\d{8}|(?:\+|00)[1-9]\d{6,14})$/;
            if (!field.value.trim()) {
                showFieldError(fieldName, 'Phone number is required'); isValid = false;
            } else if (!phonePattern.test(field.value.replace(/[\s\-\(\)]/g, ''))) {
                showFieldError(fieldName, 'Enter a valid Kenyan (07/01) or intl number'); isValid = false;
            }
            break;
        case 'subject': case 'editSubject':
            if (!field.value) { showFieldError(fieldName, 'Please select a subject'); isValid = false; }
            break;
        case 'message': case 'editMessage':
            if (!field.value.trim()) {
                showFieldError(fieldName, 'Message is required'); isValid = false;
            } else if (field.value.trim().length < 10) {
                showFieldError(fieldName, 'Message must be at least 10 characters'); isValid = false;
            }
            break;
        case 'terms':
            if (!field.checked) { showFieldError(fieldName, 'You must agree to the terms'); isValid = false; }
            break;
        case 'contact': case 'editContact':
            const form = field.closest('form');
            if (!form.querySelector(`input[name="${fieldName}"]:checked`)) {
                showFieldError(fieldName, 'Please select a contact method'); isValid = false;
            }
            break;
    }
    return isValid;
}

export function validateForm(formId) {
    let isValid = true;
    const form = document.getElementById(formId);
    form.querySelectorAll('input:not([type=radio]), textarea, select').forEach(field => {
        if (!validateField(field)) isValid = false;
    });

    const contactField = form.querySelector('[name="contact"], [name="editContact"]');
    if (contactField && !validateField(contactField)) isValid = false;
    const termsField = form.querySelector('[name="terms"]');
    if (termsField && !validateField(termsField)) isValid = false;

    return isValid;
}

export function showFieldError(fieldName, message) {
    const field = document.getElementById(fieldName) || document.querySelector(`[name=${fieldName}]`);
    if (!field) return;
    const inputContainer = field.closest('.input-container');
    const errorElement = document.getElementById(fieldName + 'Error');
    if (inputContainer) inputContainer.classList.add('has-error');
    if (errorElement) errorElement.textContent = message;
}

export function clearFieldError(fieldName) {
    const field = document.getElementById(fieldName) || document.querySelector(`[name=${fieldName}]`);
    if (!field) return;
    const inputContainer = field.closest('.input-container');
    const errorElement = document.getElementById(fieldName + 'Error');
    if (inputContainer) inputContainer.classList.remove('has-error');
    if (errorElement) errorElement.textContent = '';
}

export function resetForm(formId) {
    const form = document.getElementById(formId);
    form.reset();
    form.querySelectorAll('.has-error').forEach(el => el.classList.remove('has-error'));
    form.querySelectorAll('.error-message').forEach(el => el.textContent = '');
    const fileText = form.querySelector('.file-text');
    if (fileText) fileText.textContent = 'No file chosen';
    const filePreview = form.querySelector('.file-preview-container');
    if (filePreview) filePreview.innerHTML = '';
}