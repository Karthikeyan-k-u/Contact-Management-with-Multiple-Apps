import { crmStorage } from './crmStorage';
import { Interaction, InteractionFilterOptions, InteractionStats } from '../types';
import { isWithinDateRange } from '../utils/dateUtils';

export const interactionService = {
  getAll(filters?: InteractionFilterOptions): Interaction[] {
    let items = crmStorage.getInteractions();

    if (filters?.contactId && filters.contactId !== 'all') {
      items = items.filter((i) => i.contactId === filters.contactId);
    }

    if (filters?.type && filters.type !== 'all') {
      items = items.filter((i) => i.type === filters.type);
    }

    if (filters?.direction && filters.direction !== 'all') {
      items = items.filter((i) => i.direction === filters.direction);
    }

    if (filters?.status && filters.status !== 'all') {
      items = items.filter((i) => i.status.toLowerCase() === filters.status!.toLowerCase());
    }

    if (filters?.dateRange && filters.dateRange !== 'all') {
      items = items.filter((i) => isWithinDateRange(i.createdAt, filters.dateRange!));
    }

    if (filters?.search) {
      const query = filters.search.toLowerCase().trim();
      const contacts = crmStorage.getContacts();
      const contactMap = new Map(contacts.map((c) => [c.id, `${c.firstName} ${c.lastName || ''}`.toLowerCase()]));

      items = items.filter((i) => {
        const contactName = contactMap.get(i.contactId) || '';
        return (
          i.subject.toLowerCase().includes(query) ||
          i.message.toLowerCase().includes(query) ||
          contactName.includes(query)
        );
      });
    }

    // Sort order
    if (filters?.sortOrder === 'oldest') {
      items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else {
      // default newest
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return items;
  },

  getByContactId(contactId: string): Interaction[] {
    return crmStorage.getInteractionsByContactId(contactId);
  },

  create(interaction: Omit<Interaction, 'id' | 'createdAt'>): Interaction {
    return crmStorage.createInteraction(interaction);
  },

  delete(id: string): void {
    crmStorage.deleteInteraction(id);
  },

  getStats(): InteractionStats {
    const all = crmStorage.getInteractions();
    return {
      total: all.length,
      calls: all.filter((i) => i.type === 'call').length,
      emails: all.filter((i) => i.type === 'email').length,
      sms: all.filter((i) => i.type === 'sms').length,
      whatsapp: all.filter((i) => i.type === 'whatsapp').length,
      instagram: all.filter((i) => i.type === 'instagram').length,
      notes: all.filter((i) => i.type === 'note').length,
    };
  },
};
