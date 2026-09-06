import { Contact, ContactStatus, FollowUp, Group, Interaction } from '../types';
import {
  INITIAL_CONTACTS,
  INITIAL_FOLLOWUPS,
  INITIAL_GROUPS,
  INITIAL_INTERACTIONS,
} from './mockData';

const STORAGE_KEYS = {
  CONTACTS: 'nexus_crm_contacts_v3',
  GROUPS: 'nexus_crm_groups_v3',
  INTERACTIONS: 'nexus_crm_interactions_v3',
  FOLLOWUPS: 'nexus_crm_followups_v3',
};

const MIGRATION_KEYS = {
  CONTACTS_DEDUPE: 'nexus_crm_contacts_dedupe_v1',
};

function getItem<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(item);
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return fallback;
  }
}

function setItem<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
}

function normalizeContact(c: Contact): Contact {
  return {
    ...c,
    whatsapp: c.whatsapp && c.whatsapp.trim() ? c.whatsapp.trim() : c.phone,
  };
}

let idCounter = 0;

function generateId(prefix: string): string {
  idCounter += 1;
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    const uuid = crypto.randomUUID().replace(/[^a-z0-9]/gi, '').slice(0, 8);
    return `${prefix}-${uuid}`;
  }
  const time = new Date().getTime();
  const rand = Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0');
  return `${prefix}-${time}-${rand}-${idCounter}`;
}

function migrateDuplicateContactIds(): void {
  try {
    if (localStorage.getItem(MIGRATION_KEYS.CONTACTS_DEDUPE)) return;

    const contacts = getItem<Contact[]>(STORAGE_KEYS.CONTACTS, INITIAL_CONTACTS);
    if (contacts.length === 0) {
      localStorage.setItem(MIGRATION_KEYS.CONTACTS_DEDUPE, 'done');
      return;
    }

    const seen = new Set<string>();
    let patched = 0;
    const patchedContacts = contacts.map((c) => {
      if (seen.has(c.id)) {
        patched += 1;
        return { ...c, id: generateId('cont') };
      }
      seen.add(c.id);
      return c;
    });

    if (patched === 0) {
      localStorage.setItem(MIGRATION_KEYS.CONTACTS_DEDUPE, 'done');
      return;
    }

    setItem(STORAGE_KEYS.CONTACTS, patchedContacts);

    localStorage.setItem(MIGRATION_KEYS.CONTACTS_DEDUPE, 'done');
    console.info(`[ComHub] Duplicate contact ID fix: patched ${patched} record(s)`);
  } catch (error) {
    console.error('[ComHub] Duplicate contact ID migration failed:', error);
  }
}

migrateDuplicateContactIds();

export const crmStorage = {
  // CONTACTS
  getContacts(): Contact[] {
    return getItem<Contact[]>(STORAGE_KEYS.CONTACTS, INITIAL_CONTACTS).map(normalizeContact);
  },

  getContactById(id: string): Contact | undefined {
    const contacts = this.getContacts();
    return contacts.find((c) => c.id === id);
  },

  createContact(contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Contact {
    const contacts = this.getContacts();
    const newContact: Contact = normalizeContact({
      ...contact,
      id: generateId('cont'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const updated = [newContact, ...contacts];
    setItem(STORAGE_KEYS.CONTACTS, updated);

    // Update group counts
    this.recalculateGroupCounts();
    return newContact;
  },

  updateContact(id: string, updates: Partial<Contact>): Contact {
    const contacts = this.getContacts();
    const index = contacts.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error(`Contact with id ${id} not found`);
    }

    const updatedContact: Contact = normalizeContact({
      ...contacts[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    contacts[index] = updatedContact;
    setItem(STORAGE_KEYS.CONTACTS, contacts);

    // Update group counts if groupIds changed
    if (updates.groupIds) {
      this.recalculateGroupCounts();
    }
    return updatedContact;
  },

  deleteContact(id: string): void {
    const contacts = this.getContacts().filter((c) => c.id !== id);
    setItem(STORAGE_KEYS.CONTACTS, contacts);

    const followups = this.getFollowUps().filter((f) => f.contactId !== id);
    setItem(STORAGE_KEYS.FOLLOWUPS, followups);

    this.recalculateGroupCounts();
  },

  toggleFavorite(id: string): Contact {
    const contact = this.getContactById(id);
    if (!contact) throw new Error('Contact not found');
    return this.updateContact(id, { favorite: !contact.favorite });
  },

  // TAG MANAGEMENT
  addContactTag(contactId: string, tag: string): Contact {
    const contact = this.getContactById(contactId);
    if (!contact) throw new Error('Contact not found');

    const cleanTag = tag.trim();
    if (!cleanTag || contact.tags.includes(cleanTag)) return contact;

    return this.updateContact(contactId, {
      tags: [...contact.tags, cleanTag],
    });
  },

  removeContactTag(contactId: string, tagToRemove: string): Contact {
    const contact = this.getContactById(contactId);
    if (!contact) throw new Error('Contact not found');

    return this.updateContact(contactId, {
      tags: contact.tags.filter((t) => t !== tagToRemove),
    });
  },

  getAllTags(): string[] {
    const contacts = this.getContacts();
    const tagSet = new Set<string>();
    for (const c of contacts) {
      for (const t of c.tags) {
        if (t.trim()) tagSet.add(t.trim());
      }
    }
    return Array.from(tagSet).sort();
  },

  // BULK OPERATIONS
  bulkDeleteContacts(ids: string[]): void {
    const set = new Set(ids);
    const contacts = this.getContacts().filter((c) => !set.has(c.id));
    setItem(STORAGE_KEYS.CONTACTS, contacts);

    const followups = this.getFollowUps().filter((f) => !set.has(f.contactId));
    setItem(STORAGE_KEYS.FOLLOWUPS, followups);

    this.recalculateGroupCounts();
  },

  bulkSetStatus(ids: string[], status: ContactStatus): void {
    const set = new Set(ids);
    const contacts = this.getContacts().map((c) =>
      set.has(c.id) ? { ...c, status, updatedAt: new Date().toISOString() } : c
    );
    setItem(STORAGE_KEYS.CONTACTS, contacts);
  },

  bulkAssignGroup(ids: string[], groupId: string): void {
    const set = new Set(ids);
    const contacts = this.getContacts().map((c) => {
      if (set.has(c.id) && !c.groupIds.includes(groupId)) {
        return {
          ...c,
          groupIds: [...c.groupIds, groupId],
          updatedAt: new Date().toISOString(),
        };
      }
      return c;
    });
    setItem(STORAGE_KEYS.CONTACTS, contacts);
    this.recalculateGroupCounts();
  },

  bulkAddTag(ids: string[], tag: string): void {
    const cleanTag = tag.trim();
    if (!cleanTag) return;
    const set = new Set(ids);
    const contacts = this.getContacts().map((c) => {
      if (set.has(c.id) && !c.tags.includes(cleanTag)) {
        return {
          ...c,
          tags: [...c.tags, cleanTag],
          updatedAt: new Date().toISOString(),
        };
      }
      return c;
    });
    setItem(STORAGE_KEYS.CONTACTS, contacts);
  },

  // GROUPS
  getGroups(): Group[] {
    return getItem<Group[]>(STORAGE_KEYS.GROUPS, INITIAL_GROUPS);
  },

  createGroup(group: Omit<Group, 'id' | 'contactCount'>): Group {
    const groups = this.getGroups();
    const newGroup: Group = {
      ...group,
      id: generateId('grp'),
      contactCount: 0,
    };
    const updated = [...groups, newGroup];
    setItem(STORAGE_KEYS.GROUPS, updated);
    return newGroup;
  },

  updateGroup(id: string, updates: Partial<Group>): Group {
    const groups = this.getGroups();
    const index = groups.findIndex((g) => g.id === id);
    if (index === -1) throw new Error('Group not found');
    const updatedGroup = { ...groups[index], ...updates };
    groups[index] = updatedGroup;
    setItem(STORAGE_KEYS.GROUPS, groups);
    return updatedGroup;
  },

  deleteGroup(id: string): void {
    const groups = this.getGroups().filter((g) => g.id !== id);
    setItem(STORAGE_KEYS.GROUPS, groups);

    const contacts = this.getContacts().map((c) => ({
      ...c,
      groupIds: c.groupIds.filter((gid) => gid !== id),
    }));
    setItem(STORAGE_KEYS.CONTACTS, contacts);
  },

  assignContactToGroup(contactId: string, groupId: string): void {
    const contacts = this.getContacts();
    const contact = contacts.find((c) => c.id === contactId);
    if (contact && !contact.groupIds.includes(groupId)) {
      this.updateContact(contactId, {
        groupIds: [...contact.groupIds, groupId],
      });
      this.recalculateGroupCounts();
    }
  },

  removeContactFromGroup(contactId: string, groupId: string): void {
    const contacts = this.getContacts();
    const contact = contacts.find((c) => c.id === contactId);
    if (contact && contact.groupIds.includes(groupId)) {
      this.updateContact(contactId, {
        groupIds: contact.groupIds.filter((gid) => gid !== groupId),
      });
      this.recalculateGroupCounts();
    }
  },

  recalculateGroupCounts(): void {
    const contacts = this.getContacts();
    const groups = this.getGroups();

    const counts: Record<string, number> = {};
    for (const c of contacts) {
      for (const gid of c.groupIds) {
        counts[gid] = (counts[gid] || 0) + 1;
      }
    }

    const updatedGroups = groups.map((g) => ({
      ...g,
      contactCount: counts[g.id] || 0,
    }));
    setItem(STORAGE_KEYS.GROUPS, updatedGroups);
  },

  // INTERACTIONS
  getInteractions(): Interaction[] {
    return getItem<Interaction[]>(STORAGE_KEYS.INTERACTIONS, INITIAL_INTERACTIONS);
  },

  getInteractionsByContactId(contactId: string): Interaction[] {
    return this.getInteractions()
      .filter((i) => i.contactId === contactId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  createInteraction(interaction: Omit<Interaction, 'id' | 'createdAt'>): Interaction {
    const interactions = this.getInteractions();
    const newInteraction: Interaction = {
      ...interaction,
      id: generateId('int'),
      createdAt: new Date().toISOString(),
    };
    const updated = [newInteraction, ...interactions];
    setItem(STORAGE_KEYS.INTERACTIONS, updated);

    try {
      this.updateContact(interaction.contactId, {
        lastContactedAt: newInteraction.createdAt,
      });
    } catch {
      // Ignored if contact not found
    }

    return newInteraction;
  },

  deleteInteraction(id: string): void {
    const interactions = this.getInteractions().filter((i) => i.id !== id);
    setItem(STORAGE_KEYS.INTERACTIONS, interactions);
  },

  // FOLLOW-UPS
  getFollowUps(): FollowUp[] {
    return getItem<FollowUp[]>(STORAGE_KEYS.FOLLOWUPS, INITIAL_FOLLOWUPS);
  },

  getFollowUpsByContactId(contactId: string): FollowUp[] {
    return this.getFollowUps().filter((f) => f.contactId === contactId);
  },

  createFollowUp(followUp: Omit<FollowUp, 'id'>): FollowUp {
    const followUps = this.getFollowUps();
    const newFollowUp: FollowUp = {
      ...followUp,
      id: generateId('fol'),
    };
    const updated = [newFollowUp, ...followUps];
    setItem(STORAGE_KEYS.FOLLOWUPS, updated);
    return newFollowUp;
  },

  updateFollowUp(id: string, updates: Partial<FollowUp>): FollowUp {
    const followUps = this.getFollowUps();
    const index = followUps.findIndex((f) => f.id === id);
    if (index === -1) throw new Error('Follow-up not found');

    const updatedFollowUp = { ...followUps[index], ...updates };
    followUps[index] = updatedFollowUp;
    setItem(STORAGE_KEYS.FOLLOWUPS, followUps);
    return updatedFollowUp;
  },

  toggleFollowUp(id: string): FollowUp {
    const followUps = this.getFollowUps();
    const target = followUps.find((f) => f.id === id);
    if (!target) throw new Error('Follow-up not found');
    return this.updateFollowUp(id, { completed: !target.completed });
  },

  deleteFollowUp(id: string): void {
    const followUps = this.getFollowUps().filter((f) => f.id !== id);
    setItem(STORAGE_KEYS.FOLLOWUPS, followUps);
  },

  // DATA MANAGEMENT
  resetToFactoryDefaults(): void {
    setItem(STORAGE_KEYS.CONTACTS, INITIAL_CONTACTS);
    setItem(STORAGE_KEYS.GROUPS, INITIAL_GROUPS);
    setItem(STORAGE_KEYS.INTERACTIONS, INITIAL_INTERACTIONS);
    setItem(STORAGE_KEYS.FOLLOWUPS, INITIAL_FOLLOWUPS);
  },

  exportData(): string {
    return JSON.stringify(
      {
        contacts: this.getContacts(),
        groups: this.getGroups(),
        interactions: this.getInteractions(),
        followUps: this.getFollowUps(),
        exportedAt: new Date().toISOString(),
      },
      null,
      2
    );
  },

  exportContactsAsCsv(contactsToExport?: Contact[]): string {
    const contacts = contactsToExport || this.getContacts();
    const groups = this.getGroups();
    const groupMap = new Map(groups.map((g) => [g.id, g.name]));

    const headers = [
      'Name',
      'Email',
      'Phone',
      'WhatsApp',
      'Instagram',
      'Company',
      'Job Title',
      'Status',
      'Groups',
      'Tags',
      'Created Date',
      'Last Contacted',
    ];

    const rows = contacts.map((c) => {
      const fullName = `${c.firstName} ${c.lastName || ''}`.trim();
      const groupNames = c.groupIds.map((gid) => groupMap.get(gid) || gid).join('; ');
      const tags = c.tags.join('; ');

      return [
        fullName,
        c.email,
        c.phone,
        c.whatsapp || '',
        c.instagram || '',
        c.company || '',
        c.jobTitle || '',
        c.status,
        groupNames,
        tags,
        c.createdAt,
        c.lastContactedAt || '',
      ].map((val) => `"${String(val).replace(/"/g, '""')}"`);
    });

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  },

  importContacts(newContacts: Partial<Contact>[]): { added: number } {
    let added = 0;
    for (const item of newContacts) {
      if (!item.firstName || !item.email) continue;
      this.createContact({
        firstName: item.firstName,
        lastName: item.lastName || '',
        email: item.email,
        phone: item.phone || '',
        whatsapp: item.whatsapp || '',
        instagram: item.instagram || '',
        company: item.company || '',
        jobTitle: item.jobTitle || '',
        status: item.status || 'Lead',
        tags: Array.isArray(item.tags) ? item.tags : [],
        groupIds: Array.isArray(item.groupIds) ? item.groupIds : [],
        notes: item.notes || '',
        favorite: Boolean(item.favorite),
        avatar: item.avatar || undefined,
        address: item.address || undefined,
        website: item.website || undefined,
      });
      added++;
    }
    return { added };
  },
};
