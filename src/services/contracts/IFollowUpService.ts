import { FollowUp, FollowUpFilterOptions } from '../../types';

export interface IFollowUpService {
  getFollowUps(filters?: FollowUpFilterOptions): Promise<FollowUp[]>;
  getContactFollowUps(contactId: string): Promise<FollowUp[]>;
  createFollowUp(data: Omit<FollowUp, 'id'>): Promise<FollowUp>;
  updateFollowUp(id: string, data: Partial<FollowUp>): Promise<FollowUp>;
  deleteFollowUp(id: string): Promise<void>;
  toggleFollowUp(id: string): Promise<FollowUp>;
}
