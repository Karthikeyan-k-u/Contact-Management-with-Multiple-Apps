import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  contactService,
  interactionService,
  followUpService,
  groupService,
  crmStorage,
} from '../services';
import {
  Contact,
  ContactFilterOptions,
  ContactStatus,
  FollowUp,
  FollowUpFilterOptions,
  Group,
  Interaction,
  InteractionFilterOptions,
} from '../types';

export const QUERY_KEYS = {
  contacts: ['contacts'] as const,
  contact: (id?: string) => ['contacts', id] as const,
  groups: ['groups'] as const,
  tags: ['tags'] as const,
  interactions: ['interactions'] as const,
  interactionStats: ['interactionStats'] as const,
  contactInteractions: (contactId?: string) => ['interactions', 'contact', contactId] as const,
  followUps: ['followUps'] as const,
  contactFollowUps: (contactId?: string) => ['followUps', 'contact', contactId] as const,
};

export function useContacts(filters?: ContactFilterOptions) {
  return useQuery({
    queryKey: [...QUERY_KEYS.contacts, filters],
    queryFn: () => contactService.getContacts(filters),
  });
}

export function useContact(id?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.contact(id),
    queryFn: () => (id ? contactService.getContact(id) : undefined),
    enabled: Boolean(id),
  });
}

export function useGroups() {
  return useQuery({
    queryKey: QUERY_KEYS.groups,
    queryFn: () => groupService.getGroups(),
  });
}

export function useAllTags() {
  return useQuery({
    queryKey: QUERY_KEYS.tags,
    queryFn: () => contactService.getAllTags(),
  });
}

export function useInteractions(filters?: InteractionFilterOptions) {
  return useQuery({
    queryKey: [...QUERY_KEYS.interactions, filters],
    queryFn: () => interactionService.getInteractions(filters),
  });
}

export function useInteractionStats() {
  return useQuery({
    queryKey: QUERY_KEYS.interactionStats,
    queryFn: () => interactionService.getStats(),
  });
}

export function useFollowUps(filters?: FollowUpFilterOptions) {
  return useQuery({
    queryKey: [...QUERY_KEYS.followUps, filters],
    queryFn: () => followUpService.getFollowUps(filters),
  });
}

export function useContactInteractions(contactId?: string) {
  return useInteractions({ contactId });
}

export function useContactFollowUps(contactId?: string) {
  return useFollowUps({ contactId });
}

// CONTACT MUTATIONS
export function useCreateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) =>
      contactService.createContact(contact),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contacts });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.groups });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tags });
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Contact> }) =>
      contactService.updateContact(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contacts });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contact(variables.id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.groups });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tags });
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => contactService.deleteContact(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contacts });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.groups });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.followUps });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tags });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.interactions });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.interactionStats });
    },
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => contactService.toggleFavorite(id),
    onMutate: async (id) => {
      const previousContacts = queryClient.getQueriesData({
        queryKey: QUERY_KEYS.contacts,
      });
      const previousContact = queryClient.getQueryData<Contact>(QUERY_KEYS.contact(id));

      queryClient.setQueriesData<Contact | Contact[]>(
        { queryKey: QUERY_KEYS.contacts },
        (old) => {
          if (Array.isArray(old)) {
            return old.map((c) =>
              c.id === id ? { ...c, favorite: !c.favorite } : c
            );
          }
          if (old && old.id === id) {
            return { ...old, favorite: !old.favorite };
          }
          return old;
        }
      );

      return { previousContacts, previousContact };
    },
    onError: (_err, id, context) => {
      if (context?.previousContacts) {
        for (const [key, data] of context.previousContacts) {
          queryClient.setQueryData(key, data);
        }
      }
      if (context?.previousContact !== undefined) {
        queryClient.setQueryData(QUERY_KEYS.contact(id), context.previousContact);
      }
    },
    onSettled: (_data, _error, id) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contacts });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contact(id) });
    },
  });
}

export function useAddContactTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ contactId, tag }: { contactId: string; tag: string }) =>
      contactService.addTag(contactId, tag),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contacts });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contact(variables.contactId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tags });
    },
  });
}

export function useRemoveContactTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ contactId, tag }: { contactId: string; tag: string }) =>
      contactService.removeTag(contactId, tag),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contacts });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contact(variables.contactId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tags });
    },
  });
}

// BULK CONTACT MUTATIONS
export function useBulkDeleteContacts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => contactService.bulkDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contacts });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.groups });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.followUps });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tags });
    },
  });
}

export function useBulkSetStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: ContactStatus }) =>
      contactService.bulkSetStatus(ids, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contacts });
    },
  });
}

export function useBulkAssignGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, groupId }: { ids: string[]; groupId: string }) =>
      contactService.bulkAssignGroup(ids, groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contacts });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.groups });
    },
  });
}

export function useBulkAddTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, tag }: { ids: string[]; tag: string }) =>
      contactService.bulkAddTag(ids, tag),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contacts });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tags });
    },
  });
}

// INTERACTION MUTATIONS
export function useLogInteraction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (interaction: Omit<Interaction, 'id' | 'createdAt'>) =>
      interactionService.createInteraction(interaction),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.interactions });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.interactionStats });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contacts });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contact(variables.contactId) });
    },
  });
}

export function useDeleteInteraction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => interactionService.deleteInteraction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.interactions });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.interactionStats });
    },
  });
}

// FOLLOW-UP MUTATIONS
export function useCreateFollowUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (followUp: Omit<FollowUp, 'id'>) =>
      followUpService.createFollowUp(followUp),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.followUps });
    },
  });
}

export function useToggleFollowUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => followUpService.toggleFollowUp(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.followUps });
    },
  });
}

export function useUpdateFollowUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<FollowUp> }) =>
      followUpService.updateFollowUp(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.followUps });
    },
  });
}

export function useDeleteFollowUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => followUpService.deleteFollowUp(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.followUps });
    },
  });
}

// GROUP MUTATIONS
export function useCreateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (group: Omit<Group, 'id' | 'contactCount'>) =>
      groupService.createGroup(group),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.groups });
    },
  });
}

export function useUpdateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Group> }) =>
      groupService.updateGroup(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.groups });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contacts });
    },
  });
}

export function useDeleteGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => groupService.deleteGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.groups });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contacts });
    },
  });
}

export function useAssignContactToGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ contactId, groupId }: { contactId: string; groupId: string }) =>
      groupService.assignContactToGroup(contactId, groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.groups });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contacts });
    },
  });
}

export function useRemoveContactFromGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ contactId, groupId }: { contactId: string; groupId: string }) =>
      groupService.removeContactFromGroup(contactId, groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.groups });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contacts });
    },
  });
}

// DATA MIGRATION & BACKUP MUTATIONS
export function useImportContacts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (contacts: Partial<Contact>[]) =>
      Promise.resolve(crmStorage.importContacts(contacts)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contacts });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.groups });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tags });
    },
  });
}

export function useResetData() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => Promise.resolve(crmStorage.resetToFactoryDefaults()),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}
