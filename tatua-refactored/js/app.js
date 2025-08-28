import { dom } from './components/dom.js';
import * as validation from './components/validation.js';
import * as storage from './services/storage.js';
import * as ticketService from './services/ticket.js';
import * as screen from './components/screen.js';
import * as modal from './components/modal.js';
import { showToast } from './components/toast.js';

export class App {
    constructor() {
        this.storageStrategies = {
            memory: new storage.MemoryStorage(),
            session: new storage.SessionStorage(),
            local: new storage.LocalStorage(),
        };

        this.currentStorage = this.getStorageFromURL() || 'memory';
        this.currentFilters = [];
        this.currentSorters = [{ column: 'dateCreated', order: 'desc' }];
        this.currentAttachmentData = null;
        this.currentEditAttachmentData = null;
        this.editingTicketId = null;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadTickets();
        this.updateUI();
    }

    getStorageFromURL() {
        const params = new URLSearchParams(window.location.search);
        const storageType = params.get('storage');
        return ['memory', 'session', 'local'].includes(storageType) ? storageType : null;
    }

    updateURLStorage(storageType) {
        const url = new URL(window.location);
        url.searchParams.set('storage', storageType);
        window.history.pushState({}, '', url);
    }

    setupEventListeners() {
        dom.storageTypeSelect.addEventListener('change', (e) => this.switchStorage(e.target.value));
        dom.ticketForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });
        dom.editTicketForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEditedTicket();
        });
        dom.saveChangesBtn.addEventListener('click', () => this.saveEditedTicket());
        dom.refreshBtn.addEventListener('click', () => {
            this.loadTickets();
            showToast('Tickets refreshed successfully');
        });
        dom.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                screen.switchScreen(e.target.getAttribute('data-screen'));
                if (e.target.getAttribute('data-screen') === 'ticketsList') {
                    this.loadTickets();
                }
            });
        });

        validation.setupFormValidationListeners('ticketForm');
        validation.setupFormValidationListeners('editTicketForm');
        
        this.setupFileInputListeners('attachment', data => this.currentAttachmentData = data);
        this.setupFileInputListeners('editAttachment', data => this.currentEditAttachmentData = data);

        dom.sortBtn.addEventListener('click', () => this.openSortModal());
        dom.filterBtn.addEventListener('click', () => this.openFilterModal());
        
        document.querySelectorAll('.close-modal, .modal-cancel-btn').forEach(btn => {
            btn.addEventListener('click', (e) => modal.hideModal(e.target.closest('.modal').id));
        });
        window.addEventListener('click', (event) => {
            if (event.target.classList.contains('modal')) modal.hideModal(event.target.id);
        });

        dom.addSorterBtn.addEventListener('click', () => ticketService.addSorterRow());
        dom.resetSorterBtn.addEventListener('click', () => this.resetSorters());
        dom.submitSorterBtn.addEventListener('click', () => this.applySorters());
        dom.addFilterBtn.addEventListener('click', () => ticketService.addFilterRow());
        dom.resetFilterBtn.addEventListener('click', () => this.resetFilters());
        dom.submitFilterBtn.addEventListener('click', () => this.applyFilters());
    }

    setupFileInputListeners(inputId, onFileLoad) {
        const fileInput = document.getElementById(inputId);
        if (!fileInput) return;

        const wrapper = fileInput.closest('.input-container');
        const fileButton = wrapper.querySelector('.file-button');
        const fileText = wrapper.querySelector('.file-text');
        const filePreview = wrapper.querySelector('.file-preview-container');
        const fileErrorElement = wrapper.querySelector('.error-message');

        fileButton.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            fileErrorElement.textContent = '';
            filePreview.innerHTML = '';
            onFileLoad(null);

            if (file) {
                if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
                    fileErrorElement.textContent = 'Invalid file type. Please use PDF, JPG, or PNG.';
                    fileInput.value = ''; return;
                }
                if (file.size > 1 * 1024 * 1024) {
                    fileErrorElement.textContent = 'File size cannot exceed 1MB.';
                    fileInput.value = ''; return;
                }

                fileText.textContent = file.name;
                const reader = new FileReader();
                reader.onload = (event) => {
                    const fileData = { type: file.type, data: event.target.result };
                    onFileLoad(fileData);
                    if (file.type.startsWith('image/')) {
                        filePreview.innerHTML = `<img src="${event.target.result}" alt="File preview">`;
                    } else if (file.type === 'application/pdf') {
                        filePreview.innerHTML = `<div class="pdf-icon" title="${file.name}">PDF</div>`;
                    }
                };
                reader.readAsDataURL(file);
            } else {
                fileText.textContent = 'No file chosen';
            }
        });
    }

    switchStorage(newType) {
        if (this.currentStorage === newType) return;
        this.currentStorage = newType;
        this.updateURLStorage(newType);
        this.loadTickets();
        showToast(`Switched to ${newType} storage`);
        this.updateUI();
    }

    handleFormSubmit() {
        if (validation.validateForm('ticketForm')) {
            const formData = new FormData(dom.ticketForm);
            const ticket = ticketService.createTicketFromForm(formData, this.currentAttachmentData);
            this.storageStrategies[this.currentStorage].saveTicket(ticket);
            this.loadTickets();
            validation.resetForm('ticketForm');
            this.currentAttachmentData = null;
            showToast('Ticket submitted successfully!');
            screen.switchScreen('ticketsList');
        }
    }

    loadTickets() {
        let tickets = this.storageStrategies[this.currentStorage].getTickets();
        const processedTickets = ticketService.processTickets(tickets, this.currentFilters, this.currentSorters);
        ticketService.renderTickets(processedTickets);
    }
    
    viewTicket(ticketId) {
        const ticket = this.storageStrategies[this.currentStorage].getTicket(ticketId);
        if (!ticket) return;
        ticketService.populateViewModal(ticket);
        dom.downloadBtn.onclick = () => ticketService.downloadTicketDetails(ticket);
        modal.showModal('viewTicketModal');
    }
    
    editTicket(ticketId) {
        const ticket = this.storageStrategies[this.currentStorage].getTicket(ticketId);
        if (!ticket) return;
        this.editingTicketId = ticketId;
        this.currentEditAttachmentData = null;
        ticketService.populateEditModal(ticket);
        modal.showModal('editTicketModal');
    }
    
    saveEditedTicket() {
        if (!this.editingTicketId) return;
        if (validation.validateForm('editTicketForm')) {
            const originalTicket = this.storageStrategies[this.currentStorage].getTicket(this.editingTicketId);
            const updatedData = ticketService.getEditFormData(originalTicket, this.currentEditAttachmentData);
            this.storageStrategies[this.currentStorage].updateTicket(this.editingTicketId, updatedData);
            
            modal.hideModal('editTicketModal');
            this.loadTickets();
            showToast('Ticket updated successfully!');
            this.editingTicketId = null;
            this.currentEditAttachmentData = null;
        }
    }

    confirmDelete(ticketId) {
        modal.showModal('confirmModal');
        dom.confirmOkBtn.onclick = () => {
            this.deleteTicket(ticketId);
            modal.hideModal('confirmModal');
        };
    }

    deleteTicket(ticketId) {
        this.storageStrategies[this.currentStorage].deleteTicket(ticketId);
        this.loadTickets();
        showToast('Ticket deleted successfully');
    }

    openSortModal() {
        ticketService.renderSorterRows(this.currentSorters);
        modal.showModal('sortModal');
    }
    
    resetSorters() {
        this.currentSorters = [{ column: 'dateCreated', order: 'desc' }];
        ticketService.renderSorterRows(this.currentSorters);
    }

    applySorters() {
        this.currentSorters = Array.from(document.querySelectorAll('#sorterRowsContainer .modal-dynamic-row')).map(row => ({
            column: row.querySelector('[name=sortColumn]').value,
            order: row.querySelector('[name=sortOrder]').value
        }));
        this.loadTickets();
        modal.hideModal('sortModal');
        showToast('Tickets sorted');
    }
    
    openFilterModal() {
        ticketService.renderFilterRows(this.currentFilters);
        modal.showModal('filterModal');
    }
    
    resetFilters() {
        this.currentFilters = [];
        ticketService.renderFilterRows(this.currentFilters);
    }

    applyFilters() {
        this.currentFilters = Array.from(document.querySelectorAll('#filterRowsContainer .modal-dynamic-row'))
            .map(row => ({
                column: row.querySelector('[name=filterColumn]').value,
                relation: row.querySelector('[name=filterRelation]').value,
                value: row.querySelector('[name=filterValue]').value
            }))
            .filter(filter => filter.value.trim() !== '');
        this.loadTickets();
        modal.hideModal('filterModal');
        showToast(this.currentFilters.length > 0 ? 'Filter applied' : 'Filter cleared');
    }

    updateUI() {
        dom.storageTypeSelect.value = this.currentStorage;
    }
}