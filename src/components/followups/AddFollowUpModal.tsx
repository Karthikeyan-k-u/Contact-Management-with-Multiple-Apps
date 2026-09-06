import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Contact, FollowUp, FollowUpPriority } from '../../types';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { useContacts } from '../../hooks/useCRM';
import { followUpSchema, FollowUpFormData } from '../../validations';

export interface AddFollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<FollowUp, 'id'>) => void;
  preselectedContactId?: string;
  initialFollowUp?: FollowUp | null;
  isLoading?: boolean;
}

export function AddFollowUpModal({
  isOpen,
  onClose,
  onSubmit,
  preselectedContactId,
  initialFollowUp,
  isLoading = false,
}: AddFollowUpModalProps) {
  const { data: contacts = [] } = useContacts();

  const getDefaultDate = (daysAhead: number = 1) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    d.setHours(12, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  };

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FollowUpFormData>({
    resolver: zodResolver(followUpSchema),
    defaultValues: {
      contactId: preselectedContactId || '',
      title: '',
      dueDate: getDefaultDate(1),
      priority: 'medium',
      notes: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialFollowUp) {
        reset({
          contactId: initialFollowUp.contactId,
          title: initialFollowUp.title,
          dueDate: new Date(initialFollowUp.dueDate).toISOString().slice(0, 16),
          priority: initialFollowUp.priority,
          notes: initialFollowUp.notes || '',
        });
      } else {
        reset({
          contactId: preselectedContactId || (contacts[0]?.id ?? ''),
          title: '',
          dueDate: getDefaultDate(1),
          priority: 'medium',
          notes: '',
        });
      }
    }
  }, [isOpen, preselectedContactId, initialFollowUp, reset, contacts]);

  const onFormSubmit = (data: FollowUpFormData) => {
    onSubmit({
      contactId: data.contactId,
      title: data.title,
      dueDate: new Date(data.dueDate).toISOString(),
      priority: data.priority as FollowUpPriority,
      notes: data.notes || undefined,
      completed: initialFollowUp ? initialFollowUp.completed : false,
    });
  };

  const setQuickDate = (daysAhead: number) => {
    setValue('dueDate', getDefaultDate(daysAhead));
  };

  const isEditing = Boolean(initialFollowUp);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title={isEditing ? 'Edit Follow-up Reminder' : 'Create Follow-up Reminder'}
      description={
        isEditing
          ? 'Modify deadline, priority, or reminder context'
          : 'Schedule an action item or reminder tied to a contact'
      }
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        {!preselectedContactId ? (
          <Select
            label="Contact *"
            error={errors.contactId?.message}
            {...register('contactId')}
            options={contacts.map((c: Contact) => ({
              value: c.id,
              label: `${c.firstName} ${c.lastName || ''} (${c.company || c.email})`,
            }))}
          />
        ) : null}

        <Input
          label="Follow-up Title *"
          placeholder="e.g. Call Sarah regarding contract sign-off"
          error={errors.title?.message}
          {...register('title')}
        />

        {/* Due Date & Quick Dates */}
        <div className="space-y-1.5">
          <Input
            label="Due Date & Time *"
            type="datetime-local"
            error={errors.dueDate?.message}
            {...register('dueDate')}
          />
          <div className="flex gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => setQuickDate(0)}
              className="text-[11px] font-medium px-2 py-0.5 rounded border border-border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setQuickDate(1)}
              className="text-[11px] font-medium px-2 py-0.5 rounded border border-border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              Tomorrow
            </button>
            <button
              type="button"
              onClick={() => setQuickDate(3)}
              className="text-[11px] font-medium px-2 py-0.5 rounded border border-border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              In 3 Days
            </button>
            <button
              type="button"
              onClick={() => setQuickDate(7)}
              className="text-[11px] font-medium px-2 py-0.5 rounded border border-border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              Next Week
            </button>
          </div>
        </div>

        {/* Priority */}
        <Select
          label="Priority Level"
          error={errors.priority?.message}
          {...register('priority')}
          options={[
            { value: 'urgent', label: 'Urgent' },
            { value: 'high', label: 'High' },
            { value: 'medium', label: 'Medium' },
            { value: 'low', label: 'Low' },
          ]}
        />

        <Textarea
          label="Additional Details / Context"
          placeholder="Specific questions to ask, documents to prepare..."
          rows={2}
          {...register('notes')}
        />

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/70">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" size="sm" isLoading={isLoading}>
            {isEditing ? 'Update' : 'Schedule Follow-up'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
