import { dom } from '../components/dom.js';

function escapeHtml(text) {
    return text ? text.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;") : "";
}

export function createTicketFromForm(formData, attachmentData) {
    return {
        id: `TKT-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`.toUpperCase(),
        fullName: formData.get('fullName').trim(),
        email: formData.get('email').trim(),
        phone: formData.get('phone').trim(),
        subject: formData.get('subject'),
        message: formData.get('message').trim(),
        contact: formData.get('contact'),
        attachmentName: formData.get('attachment').name || null,
        attachmentData: attachmentData,
        dateCreated: new Date().toISOString(),
        status: 'Open'
    };
}

export function processTickets(tickets, filters, sorters) {
    let processedTickets = [...tickets];
    if (filters.length > 0) {
        processedTickets = processedTickets.filter(ticket => {
            return filters.every(filter => {
                const ticketValue = (ticket[filter.column] || '').toString().toLowerCase();
                const filterValue = (filter.value || '').toString().toLowerCase();
                switch (filter.relation) {
                    case 'equals': return ticketValue === filterValue;
                    case 'contains': return ticketValue.includes(filterValue);
                    case 'startsWith': return ticketValue.startsWith(filterValue);
                    case 'endsWith': return ticketValue.endsWith(filterValue);
                    default: return true;
                }
            });
        });
    }

    processedTickets.sort((a, b) => {
        for (const sorter of sorters) {
            const valA = a[sorter.column]; const valB = b[sorter.column];
            let comparison = 0;
            if (valA > valB) comparison = 1;
            else if (valA < valB) comparison = -1;
            if (comparison !== 0) return sorter.order === 'asc' ? comparison : -comparison;
        }
        return 0;
    });

    return processedTickets;
}

export function renderTickets(tickets) {
    dom.ticketsTable.style.display = tickets.length === 0 ? 'none' : 'table';
    dom.emptyState.style.display = tickets.length === 0 ? 'block' : 'none';
    dom.ticketsTableBody.innerHTML = tickets.map(renderTicketRow).join('');
}

function renderTicketRow(ticket) {
    const formattedDate = new Date(ticket.dateCreated).toLocaleString();
    return `
        <tr>
            <td class="ticket-id">${escapeHtml(ticket.id)}</td>
            <td>
                <div class="user-name">${escapeHtml(ticket.fullName)}</div>
                <div class="user-email">${escapeHtml(ticket.email)}</div>
            </td>
            <td>
                <div class="ticket-subject">${escapeHtml(ticket.subject)}</div>
                <div class="ticket-message">${escapeHtml(ticket.message)}</div>
            </td>
            <td class="ticket-date">${formattedDate}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn" title="View" onclick="app.viewTicket('${ticket.id}')"><svg class="icon" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" /></svg></button>
                    <a href="mailto:${ticket.email}" class="action-btn ${ticket.contact === 'Email' ? 'is-active' : ''}" title="Email User"><svg class="icon" viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg></a>
                    <a href="tel:${ticket.phone}" class="action-btn ${ticket.contact === 'Phone' ? 'is-active' : ''}" title="Call User"><svg class="icon" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg></a>
                    <button class="action-btn" title="Edit" onclick="app.editTicket('${ticket.id}')"><svg class="icon" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" /></svg></button>
                    <button class="action-btn delete" title="Delete" onclick="app.confirmDelete('${ticket.id}')"><svg class="icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg></button>
                </div>
            </td>
        </tr>
    `;
}

export function populateViewModal(ticket) {
    let attachmentPreviewHTML = 'None';
    if (ticket.attachmentData) {
        if (ticket.attachmentData.type.startsWith('image/')) {
            attachmentPreviewHTML = `<img src="${ticket.attachmentData.data}" alt="Attachment preview" class="attachment-preview-img">`;
        } else if (ticket.attachmentData.type === 'application/pdf') {
            attachmentPreviewHTML = `<a href="${ticket.attachmentData.data}" target="_blank" class="pdf-icon-link" title="Open PDF">PDF</a>`;
        }
    }
    dom.viewModalTitle.textContent = `Ticket Details`;
    dom.viewModalBody.innerHTML = `
        <dl class="view-details-list">
            <dt>Ticket ID</dt><dd>${escapeHtml(ticket.id)}</dd>
            <dt>Full Name</dt><dd>${escapeHtml(ticket.fullName)}</dd>
            <dt>Email</dt><dd>${escapeHtml(ticket.email)}</dd>
            <dt>Phone</dt><dd>${escapeHtml(ticket.phone)}</dd>
            <dt>Subject</dt><dd>${escapeHtml(ticket.subject)}</dd>
            <dt>Message</dt><dd>${escapeHtml(ticket.message)}</dd>
            <dt>Preferred Contact</dt><dd>${escapeHtml(ticket.contact)}</dd>
            <dt>Date Created</dt><dd>${new Date(ticket.dateCreated).toLocaleString()}</dd>
            <dt>Attachment</dt><dd>${attachmentPreviewHTML}</dd>
        </dl>`;
}

export function populateEditModal(ticket) {
    const form = dom.editTicketForm;
    form.querySelector('[name=editFullName]').value = ticket.fullName;
    form.querySelector('[name=editEmail]').value = ticket.email;
    form.querySelector('[name=editPhone]').value = ticket.phone;
    form.querySelector('[name=editSubject]').value = ticket.subject;
    form.querySelector('[name=editMessage]').value = ticket.message;
    form.querySelector(`input[name="editContact"][value="${ticket.contact}"]`).checked = true;

    const fileText = form.querySelector('.file-text');
    const filePreview = form.querySelector('.file-preview-container');
    form.querySelector('#editAttachment').value = '';

    if (ticket.attachmentData) {
        fileText.textContent = ticket.attachmentName || 'Attachment present';
        if (ticket.attachmentData.type.startsWith('image/')) {
            filePreview.innerHTML = `<img src="${ticket.attachmentData.data}" alt="File preview">`;
        } else if (ticket.attachmentData.type === 'application/pdf') {
            filePreview.innerHTML = `<div class="pdf-icon" title="${ticket.attachmentName}">PDF</div>`;
        }
    } else {
        fileText.textContent = 'No file chosen';
        filePreview.innerHTML = '';
    }
    form.querySelectorAll('.has-error').forEach(el => el.classList.remove('has-error'));
    form.querySelectorAll('.error-message').forEach(el => el.textContent = '');
}

export function getEditFormData(originalTicket, newAttachmentData) {
    const form = dom.editTicketForm;
    const attachmentFile = form.querySelector('#editAttachment').files[0];
    return {
        fullName: form.querySelector('[name=editFullName]').value.trim(),
        email: form.querySelector('[name=editEmail]').value.trim(),
        phone: form.querySelector('[name=editPhone]').value.trim(),
        subject: form.querySelector('[name=editSubject]').value,
        message: form.querySelector('[name=editMessage]').value.trim(),
        contact: form.querySelector('input[name="editContact"]:checked').value,
        attachmentName: newAttachmentData ? attachmentFile.name : originalTicket.attachmentName,
        attachmentData: newAttachmentData ? newAttachmentData : originalTicket.attachmentData,
    };
}

export function downloadTicketDetails(ticket) {
    const text = Object.entries(ticket)
        .filter(([key]) => key !== 'attachmentData')
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ticket_${ticket.id}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
}

// Filter/Sort Modal Row Rendering
export function renderSorterRows(sorters) {
    dom.sorterRowsContainer.innerHTML = '';
    if (sorters.length === 0) addSorterRow();
    else sorters.forEach(sorter => addSorterRow(sorter));
}

export function addSorterRow(sorter = { column: 'dateCreated', order: 'desc' }) {
    const row = document.createElement('div');
    row.className = 'modal-dynamic-row';
    row.innerHTML = `
        <select name="sortColumn">
            <option value="id" ${sorter.column === 'id' ? 'selected' : ''}>Ticket ID</option>
            <option value="fullName" ${sorter.column === 'fullName' ? 'selected' : ''}>Full Name</option>
            <option value="dateCreated" ${sorter.column === 'dateCreated' ? 'selected' : ''}>Date Created</option>
        </select>
        <select name="sortOrder">
            <option value="asc" ${sorter.order === 'asc' ? 'selected' : ''}>Ascending</option>
            <option value="desc" ${sorter.order === 'desc' ? 'selected' : ''}>Descending</option>
        </select>
        <button class="modal-delete-btn" title="Remove sorter">&times;</button>`;
    row.querySelector('.modal-delete-btn').addEventListener('click', () => row.remove());
    dom.sorterRowsContainer.appendChild(row);
}

export function renderFilterRows(filters) {
    dom.filterRowsContainer.innerHTML = '';
    if (filters.length === 0) addFilterRow();
    else filters.forEach(filter => addFilterRow(filter));
}

export function addFilterRow(filter = { column: '', relation: '', value: '' }) {
    const row = document.createElement('div');
    row.className = 'modal-dynamic-row';
    row.innerHTML = `
        <select name="filterColumn">
            <option value="id" ${filter.column === 'id' ? 'selected' : ''}>Ticket ID</option>
            <option value="fullName" ${filter.column === 'fullName' ? 'selected' : ''}>Full Name</option>
            <option value="email" ${filter.column === 'email' ? 'selected' : ''}>Email</option>
            <option value="subject" ${filter.column === 'subject' ? 'selected' : ''}>Subject</option>
        </select>
        <select name="filterRelation">
            <option value="contains" ${filter.relation === 'contains' ? 'selected' : ''}>Contains</option>
            <option value="equals" ${filter.relation === 'equals' ? 'selected' : ''}>Equals</option>
        </select>
        <input type="text" name="filterValue" placeholder="Enter value" value="${escapeHtml(filter.value)}">
        <button class="modal-delete-btn" title="Remove filter">&times;</button>`;
    row.querySelector('.modal-delete-btn').addEventListener('click', () => row.remove());
    dom.filterRowsContainer.appendChild(row);
}