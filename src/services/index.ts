import { IContactService } from './contracts/IContactService';
import { IInteractionService } from './contracts/IInteractionService';
import { IFollowUpService } from './contracts/IFollowUpService';
import { IGroupService } from './contracts/IGroupService';
import { MockContactService } from './mock/MockContactService';
import { MockInteractionService } from './mock/MockInteractionService';
import { MockFollowUpService } from './mock/MockFollowUpService';
import { MockGroupService } from './mock/MockGroupService';

// Active service singletons (currently backed by mock/local storage implementation)
export const contactService: IContactService = new MockContactService();
export const interactionService: IInteractionService = new MockInteractionService();
export const followUpService: IFollowUpService = new MockFollowUpService();
export const groupService: IGroupService = new MockGroupService();

export * from './contracts/IContactService';
export * from './contracts/IInteractionService';
export * from './contracts/IFollowUpService';
export * from './contracts/IGroupService';
export { crmStorage } from './crmStorage';
