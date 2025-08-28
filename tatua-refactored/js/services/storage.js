import { encryptAES, decryptAES } from './crypto.js';

class StorageStrategy {
    getTickets() { throw new Error("getTickets() must be implemented"); }
    saveTicket(ticket) { throw new Error("saveTicket() must be implemented"); }
    getTicket(ticketId) { throw new Error("getTicket() must be implemented"); }
    deleteTicket(ticketId) { throw new Error("deleteTicket() must be implemented"); }
    updateTicket(ticketId, data) { throw new Error("updateTicket() must be implemented"); }
}

export class MemoryStorage extends StorageStrategy {
    constructor() { super(); this.tickets = []; }
    getTickets() { return [...this.tickets]; }
    saveTicket(ticket) { this.tickets.unshift(ticket); }
    getTicket(ticketId) { return this.tickets.find(t => t.id === ticketId); }
    deleteTicket(ticketId) { this.tickets = this.tickets.filter(t => t.id !== ticketId); }
    updateTicket(ticketId, updatedData) {
        const index = this.tickets.findIndex(t => t.id === ticketId);
        if (index !== -1) this.tickets[index] = { ...this.tickets[index], ...updatedData };
    }
}

class PersistentStorage extends StorageStrategy {
    constructor(storage, key) { super(); this.storage = storage; this.storageKey = key; }
    getTickets() {
        const stored = this.storage.getItem(this.storageKey);
        if (!stored) return [];
        try {
            return JSON.parse(decryptAES(stored));
        } catch (e) {
            console.error('Failed to parse tickets:', e);
            return [];
        }
    }
    saveToStorage(tickets) { this.storage.setItem(this.storageKey, encryptAES(JSON.stringify(tickets))); }
    saveTicket(ticket) {
        const tickets = this.getTickets();
        tickets.unshift(ticket);
        this.saveToStorage(tickets);
    }
    getTicket(ticketId) { return this.getTickets().find(t => t.id === ticketId); }
    deleteTicket(ticketId) {
        const tickets = this.getTickets().filter(t => t.id !== ticketId);
        this.saveToStorage(tickets);
    }
    updateTicket(ticketId, updatedData) {
        const tickets = this.getTickets();
        const index = tickets.findIndex(t => t.id === ticketId);
        if (index !== -1) {
            tickets[index] = { ...tickets[index], ...updatedData };
            this.saveToStorage(tickets);
        }
    }
}

export class SessionStorage extends PersistentStorage {
    constructor() { super(sessionStorage, 'tatua_tickets_session_aes'); }
}

export class LocalStorage extends PersistentStorage {
    constructor() { super(localStorage, 'tatua_tickets_local_aes'); }
}