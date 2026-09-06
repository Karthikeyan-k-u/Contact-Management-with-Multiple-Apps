import React from 'react';
import { Interaction, InteractionType } from '../../types';
import { InteractionComposerModal } from './InteractionComposerModal';

export interface LogInteractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: Omit<Interaction, 'id' | 'createdAt'>) => void;
  preselectedContactId?: string;
  defaultChannel?: InteractionType;
  isLoading?: boolean;
}

export function LogInteractionModal({
  isOpen,
  onClose,
  onSubmit,
  preselectedContactId,
  defaultChannel = 'call',
}: LogInteractionModalProps) {
  return (
    <InteractionComposerModal
      isOpen={isOpen}
      onClose={onClose}
      preselectedContactId={preselectedContactId}
      defaultChannel={defaultChannel}
      onSuccess={(created) => {
        if (onSubmit) {
          onSubmit(created);
        }
      }}
    />
  );
}

export { InteractionComposerModal };
