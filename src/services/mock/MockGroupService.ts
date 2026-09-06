import { IGroupService } from '../contracts/IGroupService';
import { crmStorage } from '../crmStorage';
import { Group } from '../../types';

export class MockGroupService implements IGroupService {
  async getGroups(): Promise<Group[]> {
    return crmStorage.getGroups();
  }

  async createGroup(data: Omit<Group, 'id' | 'contactCount'>): Promise<Group> {
    return crmStorage.createGroup(data);
  }

  async updateGroup(id: string, data: Partial<Group>): Promise<Group> {
    return crmStorage.updateGroup(id, data);
  }

  async deleteGroup(id: string): Promise<void> {
    crmStorage.deleteGroup(id);
  }

  async assignContactToGroup(contactId: string, groupId: string): Promise<void> {
    crmStorage.assignContactToGroup(contactId, groupId);
  }

  async removeContactFromGroup(contactId: string, groupId: string): Promise<void> {
    crmStorage.removeContactFromGroup(contactId, groupId);
  }
}
