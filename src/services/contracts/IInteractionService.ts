import { Interaction, InteractionFilterOptions, InteractionStats } from '../../types';

export interface IInteractionService {
  getInteractions(filters?: InteractionFilterOptions): Promise<Interaction[]>;
  getContactInteractions(contactId: string): Promise<Interaction[]>;
  createInteraction(data: Omit<Interaction, 'id' | 'createdAt'>): Promise<Interaction>;
  deleteInteraction(id: string): Promise<void>;
  getStats(): Promise<InteractionStats>;
}
