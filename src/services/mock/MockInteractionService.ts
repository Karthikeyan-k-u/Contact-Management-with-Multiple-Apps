import { IInteractionService } from '../contracts/IInteractionService';
import { interactionService as legacyInteractionService } from '../interactionService';
import { Interaction, InteractionFilterOptions, InteractionStats } from '../../types';

export class MockInteractionService implements IInteractionService {
  async getInteractions(filters?: InteractionFilterOptions): Promise<Interaction[]> {
    return legacyInteractionService.getAll(filters);
  }

  async getContactInteractions(contactId: string): Promise<Interaction[]> {
    return legacyInteractionService.getByContactId(contactId);
  }

  async createInteraction(data: Omit<Interaction, 'id' | 'createdAt'>): Promise<Interaction> {
    return legacyInteractionService.create(data);
  }

  async deleteInteraction(id: string): Promise<void> {
    legacyInteractionService.delete(id);
  }

  async getStats(): Promise<InteractionStats> {
    return legacyInteractionService.getStats();
  }
}
