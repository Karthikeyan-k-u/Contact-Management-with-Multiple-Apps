export type ContactStatus = 'Lead' | 'Customer' | 'Prospect' | 'VIP' | 'Inactive';

export type InteractionType = 'call' | 'email' | 'sms' | 'whatsapp' | 'instagram' | 'note';

export type InteractionDirection = 'incoming' | 'outgoing';

export type InteractionStatus = 'Opened' | 'Ready to send' | 'Logged' | 'Draft' | 'Sent' | 'Failed' | 'Completed' | 'Missed';

export type CallOutcome = 'Answered' | 'No answer' | 'Voicemail' | 'Busy' | 'Callback requested';

export type FollowUpPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Contact {
  id: string;
  firstName: string;
  lastName?: string;
  avatar?: string;
  phone: string;
  email: string;
  whatsapp?: string;
  instagram?: string;
  company?: string;
  jobTitle?: string;
  address?: string;
  website?: string;
  tags: string[];
  groupIds: string[];
  notes?: string;
  favorite: boolean;
  status: ContactStatus;
  createdAt: string;
  updatedAt: string;
  lastContactedAt?: string;
}

export interface Interaction {
  id: string;
  contactId: string;
  type: InteractionType;
  direction: InteractionDirection;
  subject: string;
  message: string;
  status: InteractionStatus | string;
  outcome?: CallOutcome;
  createdAt: string;
}

export interface FollowUp {
  id: string;
  contactId: string;
  title: string;
  notes?: string;
  dueDate: string;
  priority: FollowUpPriority;
  completed: boolean;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  color: string;
  contactCount: number;
}

export interface ContactFilterOptions {
  search?: string;
  status?: ContactStatus | 'all';
  groupId?: string | 'all';
  tag?: string | 'all';
  favoriteOnly?: boolean;
  sortBy?: 'name' | 'nameDesc' | 'company' | 'lastContacted' | 'recent' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface InteractionFilterOptions {
  contactId?: string;
  type?: InteractionType | 'all';
  direction?: InteractionDirection | 'all';
  status?: string | 'all';
  dateRange?: 'all' | 'today' | '7days' | '30days';
  search?: string;
  sortOrder?: 'newest' | 'oldest';
}

export interface FollowUpFilterOptions {
  contactId?: string;
  status?: 'all' | 'pending' | 'completed' | 'overdue' | 'today';
  priority?: FollowUpPriority | 'all';
}

export type CommunicationChannel = 'phone' | 'email' | 'sms' | 'whatsapp' | 'instagram';

export interface BulkActionPayload {
  contactIds: string[];
  action: 'delete' | 'setStatus' | 'assignGroup' | 'removeGroup' | 'addTag' | 'removeTag';
  value?: string;
}

export interface InteractionStats {
  total: number;
  calls: number;
  emails: number;
  sms: number;
  whatsapp: number;
  instagram: number;
  notes: number;
}
