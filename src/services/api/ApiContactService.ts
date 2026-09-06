import { IContactService } from '../contracts/IContactService';
import { apiClient } from './apiClient';
import { Contact, ContactFilterOptions, ContactStatus } from '../../types';

/**
 * Production REST API Implementation of IContactService.
 * Ready for backend endpoint connectivity.
 */
export class ApiContactService implements IContactService {
  async getContacts(filters?: ContactFilterOptions): Promise<Contact[]> {
    return apiClient<Contact[]>('/api/contacts', {
      params: filters as Record<string, string | number | boolean | undefined>,
    });
  }

  async getContact(id: string): Promise<Contact | undefined> {
    return apiClient<Contact>(`/api/contacts/${id}`);
  }

  async createContact(data: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Promise<Contact> {
    return apiClient<Contact>('/api/contacts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateContact(id: string, data: Partial<Contact>): Promise<Contact> {
    return apiClient<Contact>(`/api/contacts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteContact(id: string): Promise<void> {
    await apiClient<void>(`/api/contacts/${id}`, {
      method: 'DELETE',
    });
  }

  async searchContacts(query: string): Promise<Contact[]> {
    return apiClient<Contact[]>('/api/contacts/search', {
      params: { q: query },
    });
  }

  async filterContacts(filters: ContactFilterOptions): Promise<Contact[]> {
    return this.getContacts(filters);
  }

  async toggleFavorite(id: string): Promise<Contact> {
    return apiClient<Contact>(`/api/contacts/${id}/favorite`, {
      method: 'POST',
    });
  }

  async addTag(contactId: string, tag: string): Promise<Contact> {
    return apiClient<Contact>(`/api/contacts/${contactId}/tags`, {
      method: 'POST',
      body: JSON.stringify({ tag }),
    });
  }

  async removeTag(contactId: string, tag: string): Promise<Contact> {
    return apiClient<Contact>(`/api/contacts/${contactId}/tags/${encodeURIComponent(tag)}`, {
      method: 'DELETE',
    });
  }

  async getAllTags(): Promise<string[]> {
    return apiClient<string[]>('/api/tags');
  }

  async bulkDelete(ids: string[]): Promise<void> {
    await apiClient<void>('/api/contacts/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  }

  async bulkSetStatus(ids: string[], status: ContactStatus): Promise<void> {
    await apiClient<void>('/api/contacts/bulk-status', {
      method: 'POST',
      body: JSON.stringify({ ids, status }),
    });
  }

  async bulkAssignGroup(ids: string[], groupId: string): Promise<void> {
    await apiClient<void>('/api/contacts/bulk-group', {
      method: 'POST',
      body: JSON.stringify({ ids, groupId }),
    });
  }

  async bulkAddTag(ids: string[], tag: string): Promise<void> {
    await apiClient<void>('/api/contacts/bulk-tag', {
      method: 'POST',
      body: JSON.stringify({ ids, tag }),
    });
  }
}
