import { crmStorage } from './crmStorage';
import { Contact, ContactFilterOptions, ContactStatus } from '../types';

export const contactService = {
  getAll(filters?: ContactFilterOptions): Contact[] {
    let contacts = crmStorage.getContacts();

    if (filters?.search) {
      const query = filters.search.toLowerCase().trim();
      contacts = contacts.filter((c) => {
        const fullName = `${c.firstName} ${c.lastName || ''}`.toLowerCase();
        const email = c.email.toLowerCase();
        const phone = c.phone.toLowerCase();
        const company = (c.company || '').toLowerCase();
        const jobTitle = (c.jobTitle || '').toLowerCase();
        const matchesTag = c.tags.some((t) => t.toLowerCase().includes(query));

        return (
          fullName.includes(query) ||
          email.includes(query) ||
          phone.includes(query) ||
          company.includes(query) ||
          jobTitle.includes(query) ||
          matchesTag
        );
      });
    }

    if (filters?.status && filters.status !== 'all') {
      contacts = contacts.filter((c) => c.status === filters.status);
    }

    if (filters?.groupId && filters.groupId !== 'all') {
      contacts = contacts.filter((c) => c.groupIds.includes(filters.groupId!));
    }

    if (filters?.tag && filters.tag !== 'all') {
      contacts = contacts.filter((c) => c.tags.includes(filters.tag!));
    }

    if (filters?.favoriteOnly) {
      contacts = contacts.filter((c) => c.favorite);
    }

    // Sort
    if (filters?.sortBy === 'name') {
      contacts.sort((a, b) => a.firstName.localeCompare(b.firstName));
    } else if (filters?.sortBy === 'nameDesc') {
      contacts.sort((a, b) => b.firstName.localeCompare(a.firstName));
    } else if (filters?.sortBy === 'company') {
      contacts.sort((a, b) => {
        const ca = a.company || '';
        const cb = b.company || '';
        return ca.localeCompare(cb);
      });
    } else if (filters?.sortBy === 'lastContacted') {
      contacts.sort((a, b) => {
        const timeA = a.lastContactedAt ? new Date(a.lastContactedAt).getTime() : 0;
        const timeB = b.lastContactedAt ? new Date(b.lastContactedAt).getTime() : 0;
        return timeB - timeA;
      });
    } else if (filters?.sortBy === 'status') {
      const statusOrder: Record<ContactStatus, number> = {
        VIP: 1,
        Customer: 2,
        Lead: 3,
        Prospect: 4,
        Inactive: 5,
      };
      contacts.sort((a, b) => (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99));
    } else {
      // default recent
      contacts.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    return contacts;
  },

  getById(id: string): Contact | undefined {
    return crmStorage.getContactById(id);
  },

  create(contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Contact {
    return crmStorage.createContact(contact);
  },

  update(id: string, updates: Partial<Contact>): Contact {
    return crmStorage.updateContact(id, updates);
  },

  delete(id: string): void {
    crmStorage.deleteContact(id);
  },

  toggleFavorite(id: string): Contact {
    return crmStorage.toggleFavorite(id);
  },

  addTag(contactId: string, tag: string): Contact {
    return crmStorage.addContactTag(contactId, tag);
  },

  removeTag(contactId: string, tag: string): Contact {
    return crmStorage.removeContactTag(contactId, tag);
  },

  bulkDelete(ids: string[]): void {
    crmStorage.bulkDeleteContacts(ids);
  },

  bulkSetStatus(ids: string[], status: ContactStatus): void {
    crmStorage.bulkSetStatus(ids, status);
  },

  bulkAssignGroup(ids: string[], groupId: string): void {
    crmStorage.bulkAssignGroup(ids, groupId);
  },

  bulkAddTag(ids: string[], tag: string): void {
    crmStorage.bulkAddTag(ids, tag);
  },
};
