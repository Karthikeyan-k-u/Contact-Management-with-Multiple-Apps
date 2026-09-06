export type CommunicationChannel = 'phone' | 'email' | 'sms' | 'whatsapp' | 'instagram';

export type CommunicationStatus = 'Opened' | 'Ready to send' | 'Logged' | 'Sent' | 'Failed';

export type DeliveryMode = 'external_client' | 'api';

export interface CommunicationPayload {
  channel: CommunicationChannel;
  recipient: string;
  subject?: string;
  message?: string;
  contactName?: string;
}

export interface CommunicationResult {
  success: boolean;
  status: CommunicationStatus;
  deliveryMode: DeliveryMode;
  channel: CommunicationChannel;
  message: string;
  actionTaken: string;
  targetUri?: string;
}

export interface ICommunicationProvider {
  readonly channel: CommunicationChannel;
  readonly name: string;
  readonly deliveryMode: DeliveryMode;
  execute(payload: CommunicationPayload): Promise<CommunicationResult>;
}
