// Centralizes all DOM element selections.
export const dom = {
    // Forms
    ticketForm: document.getElementById('ticketForm'),
    editTicketForm: document.getElementById('editTicketForm'),

    // Buttons
    refreshBtn: document.getElementById('refreshBtn'),
    saveChangesBtn: document.getElementById('saveChangesBtn'),
    sortBtn: document.getElementById('sortBtn'),
    filterBtn: document.getElementById('filterBtn'),
    downloadBtn: document.getElementById('downloadBtn'),
    confirmOkBtn: document.getElementById('confirmOkBtn'),
    addSorterBtn: document.getElementById('addSorterBtn'),
    resetSorterBtn: document.getElementById('resetSorterBtn'),
    submitSorterBtn: document.getElementById('submitSorterBtn'),
    addFilterBtn: document.getElementById('addFilterBtn'),
    resetFilterBtn: document.getElementById('resetFilterBtn'),
    submitFilterBtn: document.getElementById('submitFilterBtn'),

    // Navigation
    navLinks: document.querySelectorAll('.nav-link'),
    
    // Inputs & Selects
    storageTypeSelect: document.getElementById('storageType'),

    // Table
    ticketsTable: document.getElementById('ticketsTable'),
    ticketsTableBody: document.getElementById('ticketsTableBody'),
    emptyState: document.getElementById('emptyState'),

    // Modals & Containers
    toast: document.getElementById('toast'),
    viewModalTitle: document.getElementById('viewModalTitle'),
    viewModalBody: document.getElementById('viewModalBody'),
    sorterRowsContainer: document.getElementById('sorterRowsContainer'),
    filterRowsContainer: document.getElementById('filterRowsContainer'),
};