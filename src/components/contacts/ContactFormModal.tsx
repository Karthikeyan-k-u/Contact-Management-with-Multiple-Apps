import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Contact, ContactStatus } from '../../types';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { useGroups } from '../../hooks/useCRM';
import { Phone, Mail, MessageCircle, Instagram, Building, User, Tag, FileText } from 'lucide-react';
import { contactFormSchema, ContactFormData } from '../../validations';

export interface ContactFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => void;
  initialContact?: Contact | null;
  isLoading?: boolean;
}

export function ContactFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialContact,
  isLoading = false,
}: ContactFormModalProps) {
  const { data: groups = [] } = useGroups();
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      whatsapp: '',
      instagram: '',
      company: '',
      jobTitle: '',
      status: 'Lead',
      website: '',
      address: '',
      notes: '',
      avatar: '',
      tagsString: '',
      groupIds: [],
      favorite: false,
    },
  });

  const selectedGroupIds = watch('groupIds') || [];
  const isFavorite = watch('favorite') || false;
  const phoneValue = watch('phone') || '';
  const whatsappValue = watch('whatsapp') || '';

  useEffect(() => {
    if (phoneValue && !whatsappValue) {
      setValue('whatsapp', phoneValue, { shouldDirty: true });
    }
  }, [phoneValue, whatsappValue, setValue]);

  useEffect(() => {
    if (initialContact) {
      reset({
        firstName: initialContact.firstName,
        lastName: initialContact.lastName || '',
        email: initialContact.email || '',
        phone: initialContact.phone || '',
        whatsapp: initialContact.whatsapp || '',
        instagram: initialContact.instagram || '',
        company: initialContact.company || '',
        jobTitle: initialContact.jobTitle || '',
        status: initialContact.status,
        website: initialContact.website || '',
        address: initialContact.address || '',
        notes: initialContact.notes || '',
        avatar: initialContact.avatar || '',
        tagsString: initialContact.tags ? initialContact.tags.join(', ') : '',
        groupIds: initialContact.groupIds || [],
        favorite: initialContact.favorite || false,
      });
    } else {
      reset({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        whatsapp: '',
        instagram: '',
        company: '',
        jobTitle: '',
        status: 'Lead',
        website: '',
        address: '',
        notes: '',
        avatar: '',
        tagsString: '',
        groupIds: [],
        favorite: false,
      });
    }
    setConfirmDiscard(false);
  }, [initialContact, reset, isOpen]);

  const handleClose = () => {
    if (isDirty && !confirmDiscard) {
      setConfirmDiscard(true);
      return;
    }
    setConfirmDiscard(false);
    onClose();
  };

  const onFormSubmit = (data: ContactFormData) => {
    const tags = data.tagsString
      ? data.tagsString
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    let formattedWebsite = data.website?.trim();
    if (formattedWebsite && !formattedWebsite.startsWith('http://') && !formattedWebsite.startsWith('https://')) {
      formattedWebsite = `https://${formattedWebsite}`;
    }

    const cleanInstagram = data.instagram ? data.instagram.trim().replace(/^@/, '') : undefined;

    onSubmit({
      firstName: data.firstName.trim(),
      lastName: data.lastName?.trim() || undefined,
      email: data.email?.trim() || '',
      phone: data.phone.trim(),
      whatsapp: data.whatsapp?.trim() || data.phone.trim(),
      instagram: cleanInstagram,
      company: data.company?.trim() || undefined,
      jobTitle: data.jobTitle?.trim() || undefined,
      status: data.status as ContactStatus,
      website: formattedWebsite || undefined,
      address: data.address?.trim() || undefined,
      notes: data.notes?.trim() || undefined,
      avatar: data.avatar?.trim() || undefined,
      tags,
      groupIds: data.groupIds,
      favorite: data.favorite,
      lastContactedAt: initialContact ? initialContact.lastContactedAt : undefined,
    });
  };

  const toggleGroup = (groupId: string) => {
    if (selectedGroupIds.includes(groupId)) {
      setValue(
        'groupIds',
        selectedGroupIds.filter((id) => id !== groupId),
        { shouldDirty: true }
      );
    } else {
      setValue('groupIds', [...selectedGroupIds, groupId], { shouldDirty: true });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="lg"
      title={initialContact ? 'Edit Contact Profile' : 'Add New Contact'}
      description={
        initialContact
          ? 'Update contact info, communication handles, and group assignments'
          : 'Create a new contact record with multi-channel handles'
      }
    >
      {confirmDiscard && (
        <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-300 flex items-center justify-between">
          <span>You have unsaved form changes. Are you sure you want to discard them?</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setConfirmDiscard(false)}
              className="font-semibold underline"
            >
              Keep Editing
            </button>
            <button
              type="button"
              onClick={onClose}
              className="font-semibold text-rose-600 dark:text-rose-400 underline"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
        {/* Section 1: Personal & Professional Identity */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-border/70 pb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <User className="h-3.5 w-3.5 text-primary" /> Identity & Position
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="First Name *"
              placeholder="e.g. Sarah"
              error={errors.firstName?.message}
              {...register('firstName')}
            />
            <Input
              label="Last Name"
              placeholder="e.g. Jenkins"
              error={errors.lastName?.message}
              {...register('lastName')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Company"
              placeholder="e.g. Acme Health Tech"
              error={errors.company?.message}
              {...register('company')}
            />
            <Input
              label="Job Title"
              placeholder="e.g. VP of Product Innovation"
              error={errors.jobTitle?.message}
              {...register('jobTitle')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Lifecycle Status *"
              error={errors.status?.message}
              {...register('status')}
              options={[
                { value: 'Lead', label: 'Lead' },
                { value: 'Customer', label: 'Customer' },
                { value: 'Prospect', label: 'Prospect' },
                { value: 'VIP', label: 'VIP' },
                { value: 'Inactive', label: 'Inactive' },
              ]}
            />
            <Input
              label="Avatar Image URL"
              placeholder="https://images.unsplash.com/photo-..."
              helperText="Auto-generates initial badge if blank"
              error={errors.avatar?.message}
              {...register('avatar')}
            />
          </div>
        </div>

        {/* Section 2: Direct Communication Channels */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-border/70 pb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Phone className="h-3.5 w-3.5 text-emerald-500" /> Multi-Channel Handles
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Phone Number (Call & SMS) *"
              type="tel"
              placeholder="+1 (415) 892-3401"
              helperText="Used for tel: voice calls and sms: messaging"
              error={errors.phone?.message}
              {...register('phone')}
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="sarah.jenkins@acmehealth.io"
              helperText="Used for mailto: dispatch"
              error={errors.email?.message}
              {...register('email')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="WhatsApp Phone Number"
              placeholder="+14158923401"
              helperText="Include country code (defaults to primary phone if empty)"
              error={errors.whatsapp?.message}
              {...register('whatsapp')}
            />
            <Input
              label="Instagram Handle"
              placeholder="username (without @)"
              helperText="Dedicated profile link on instagram.com"
              error={errors.instagram?.message}
              {...register('instagram')}
            />
          </div>
        </div>

        {/* Section 3: Classification & Tags */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-border/70 pb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Tag className="h-3.5 w-3.5 text-blue-500" /> Groups & Categorization
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-foreground/80 tracking-wide">
              Assign to Groups
            </label>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {groups.map((group) => {
                const isSelected = selectedGroupIds.includes(group.id);
                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary font-semibold shadow-xs'
                        : 'border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                    }`}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: group.color }}
                    />
                    {group.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Tags (Comma separated)"
              placeholder="Enterprise, Decision Maker, B2B"
              helperText="Press comma to separate tags"
              error={errors.tagsString?.message}
              {...register('tagsString')}
            />
            <Input
              label="Website URL"
              placeholder="acmehealth.io"
              error={errors.website?.message}
              {...register('website')}
            />
          </div>

          <Input
            label="Physical Office / Address"
            placeholder="500 Howard St, San Francisco, CA"
            error={errors.address?.message}
            {...register('address')}
          />
        </div>

        {/* Section 4: Notes & Context */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-border/70 pb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <FileText className="h-3.5 w-3.5 text-amber-500" /> Internal Notes & Context
          </div>

          <Textarea
            label="Relationship Context"
            placeholder="Key preferences, conversation highlights, budget details..."
            rows={3}
            error={errors.notes?.message}
            {...register('notes')}
          />

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="favorite-toggle"
              checked={isFavorite}
              onChange={(e) => setValue('favorite', e.target.checked, { shouldDirty: true })}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
            />
            <label
              htmlFor="favorite-toggle"
              className="text-xs font-medium text-foreground cursor-pointer select-none"
            >
              Pin to Favorites (Highlighted in Directory & Dashboard)
            </label>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" size="sm" isLoading={isLoading}>
            {initialContact ? 'Update' : 'Create Contact'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
