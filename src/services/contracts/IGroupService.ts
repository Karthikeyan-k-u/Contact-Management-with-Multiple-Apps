import { Group } from '../../types';

export interface IGroupService {
  getGroups(): Promise<Group[]>;
  createGroup(data: Omit<Group, 'id' | 'contactCount'>): Promise<Group>;
  updateGroup(id: string, data: Partial<Group>): Promise<Group>;
  deleteGroup(id: string): Promise<void>;
  assignContactToGroup(contactId: string, groupId: string): Promise<void>;
  removeContactFromGroup(contactId: string, groupId: string): Promise<void>;
}
