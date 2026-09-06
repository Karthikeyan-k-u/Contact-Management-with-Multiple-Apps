import { IFollowUpService } from '../contracts/IFollowUpService';
import { crmStorage } from '../crmStorage';
import { FollowUp, FollowUpFilterOptions } from '../../types';

export class MockFollowUpService implements IFollowUpService {
  async getFollowUps(filters?: FollowUpFilterOptions): Promise<FollowUp[]> {
    let items = crmStorage.getFollowUps();

    if (filters?.contactId) {
      items = items.filter((f) => f.contactId === filters.contactId);
    }

    if (filters?.priority && filters.priority !== 'all') {
      items = items.filter((f) => f.priority === filters.priority);
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    if (filters?.status === 'pending') {
      items = items.filter((f) => !f.completed);
    } else if (filters?.status === 'completed') {
      items = items.filter((f) => f.completed);
    } else if (filters?.status === 'overdue') {
      items = items.filter((f) => !f.completed && new Date(f.dueDate) < todayStart);
    } else if (filters?.status === 'today') {
      items = items.filter((f) => {
        if (f.completed) return false;
        const due = new Date(f.dueDate);
        return due >= todayStart && due <= todayEnd;
      });
    }

    return items.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }

  async getContactFollowUps(contactId: string): Promise<FollowUp[]> {
    return this.getFollowUps({ contactId });
  }

  async createFollowUp(data: Omit<FollowUp, 'id'>): Promise<FollowUp> {
    return crmStorage.createFollowUp(data);
  }

  async updateFollowUp(id: string, data: Partial<FollowUp>): Promise<FollowUp> {
    return crmStorage.updateFollowUp(id, data);
  }

  async deleteFollowUp(id: string): Promise<void> {
    crmStorage.deleteFollowUp(id);
  }

  async toggleFollowUp(id: string): Promise<FollowUp> {
    return crmStorage.toggleFollowUp(id);
  }
}
