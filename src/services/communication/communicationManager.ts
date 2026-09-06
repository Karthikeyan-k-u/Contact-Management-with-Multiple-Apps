import {
  CommunicationChannel,
  CommunicationPayload,
  CommunicationResult,
  ICommunicationProvider,
} from './contracts';
import {
  PhoneDeepLinkAdapter,
  EmailMailtoAdapter,
  SmsDeepLinkAdapter,
  WhatsAppDeepLinkAdapter,
  InstagramProfileAdapter,
} from './adapters';

export class CommunicationManager {
  private providers: Map<CommunicationChannel, ICommunicationProvider> = new Map();

  constructor() {
    // Register default deep link adapters
    this.registerProvider(new PhoneDeepLinkAdapter());
    this.registerProvider(new EmailMailtoAdapter());
    this.registerProvider(new SmsDeepLinkAdapter());
    this.registerProvider(new WhatsAppDeepLinkAdapter());
    this.registerProvider(new InstagramProfileAdapter());
  }

  public registerProvider(provider: ICommunicationProvider): void {
    this.providers.set(provider.channel, provider);
  }

  public getProvider(channel: CommunicationChannel): ICommunicationProvider | undefined {
    return this.providers.get(channel);
  }

  public async dispatch(payload: CommunicationPayload): Promise<CommunicationResult> {
    const provider = this.getProvider(payload.channel);
    if (!provider) {
      return {
        success: false,
        status: 'Failed',
        deliveryMode: 'external_client',
        channel: payload.channel,
        actionTaken: 'No provider registered',
        message: `No active communication provider found for channel "${payload.channel}"`,
      };
    }

    try {
      return await provider.execute(payload);
    } catch (error) {
      return {
        success: false,
        status: 'Failed',
        deliveryMode: provider.deliveryMode,
        channel: payload.channel,
        actionTaken: 'Provider execution failed',
        message: error instanceof Error ? error.message : 'Unknown communication error',
      };
    }
  }
}

export const communicationManager = new CommunicationManager();
