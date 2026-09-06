import { Contact, ContactFilterOptions, ContactStatus } from '../../types';

export interface IContactService {
  getContacts(filters?: ContactFilterOptions): Promise<Contact[]>;
  getContact(id: string): Promise<Contact | undefined>;
  createContact(data: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Promise<Contact>;
  updateContact(id: string, data: Partial<Contact>): Promise<Contact>;
  deleteContact(id: string): Promise<void>;
  searchContacts(query: string): Promise<Contact[]>;
  filterContacts(filters: ContactFilterOptions): Promise<Contact[]>;
  toggleFavorite(id: string): Promise<Contact>;
  addTag(contactId: string, tag: string): Promise<Contact>;
  removeTag(contactId: string, tag: string): Promise<Contact>;
  getAllTags(): Promise<string[]>;
  bulkDelete(ids: string[]): Promise<void>;
  bulkSetStatus(ids: string[], status: ContactStatus): Promise<void>;
  bulkAssignGroup(ids: string[], groupId: string): Promise<void>;
  bulkAddTag(ids: string[], tag: string): Promise<void>;
}
