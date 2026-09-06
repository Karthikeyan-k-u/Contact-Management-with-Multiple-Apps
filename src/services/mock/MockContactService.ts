import { IContactService } from '../contracts/IContactService';
import { contactService as legacyContactService } from '../contactService';
import { crmStorage } from '../crmStorage';
import { Contact, ContactFilterOptions, ContactStatus } from '../../types';

export class MockContactService implements IContactService {
  async getContacts(filters?: ContactFilterOptions): Promise<Contact[]> {
    return legacyContactService.getAll(filters);
  }

  async getContact(id: string): Promise<Contact | undefined> {
    return legacyContactService.getById(id);
  }

  async createContact(data: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Promise<Contact> {
    return legacyContactService.create(data);
  }

  async updateContact(id: string, data: Partial<Contact>): Promise<Contact> {
    return legacyContactService.update(id, data);
  }

  async deleteContact(id: string): Promise<void> {
    legacyContactService.delete(id);
  }

  async searchContacts(query: string): Promise<Contact[]> {
    return legacyContactService.getAll({ search: query });
  }

  async filterContacts(filters: ContactFilterOptions): Promise<Contact[]> {
    return legacyContactService.getAll(filters);
  }

  async toggleFavorite(id: string): Promise<Contact> {
    return legacyContactService.toggleFavorite(id);
  }

  async addTag(contactId: string, tag: string): Promise<Contact> {
    return legacyContactService.addTag(contactId, tag);
  }

  async removeTag(contactId: string, tag: string): Promise<Contact> {
    return legacyContactService.removeTag(contactId, tag);
  }

  async getAllTags(): Promise<string[]> {
    return crmStorage.getAllTags();
  }

  async bulkDelete(ids: string[]): Promise<void> {
    legacyContactService.bulkDelete(ids);
  }

  async bulkSetStatus(ids: string[], status: ContactStatus): Promise<void> {
    legacyContactService.bulkSetStatus(ids, status);
  }

  async bulkAssignGroup(ids: string[], groupId: string): Promise<void> {
    legacyContactService.bulkAssignGroup(ids, groupId);
  }

  async bulkAddTag(ids: string[], tag: string): Promise<void> {
    legacyContactService.bulkAddTag(ids, tag);
  }
}
