import React, { useState, useEffect } from 'react';
import { Group } from '../../types';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { groupSchema } from '../../validations';

export interface AddGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (group: Omit<Group, 'id' | 'contactCount'>) => void;
  initialGroup?: Group | null;
  isLoading?: boolean;
}

const PRESET_COLORS = [
  '#6366f1', // Indigo
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#f97316', // Orange
];

export function AddGroupModal({
  isOpen,
  onClose,
  onSubmit,
  initialGroup,
  isLoading = false,
}: AddGroupModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialGroup) {
        setName(initialGroup.name);
        setDescription(initialGroup.description || '');
        setColor(initialGroup.color || PRESET_COLORS[0]);
      } else {
        setName('');
        setDescription('');
        setColor(PRESET_COLORS[0]);
      }
      setError('');
    }
  }, [isOpen, initialGroup]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = groupSchema.safeParse({
      name: name.trim(),
      description: description.trim() || undefined,
      color,
    });

    if (!result.success) {
      setError(result.error.errors[0]?.message || 'Invalid group details');
      return;
    }

    onSubmit({
      name: result.data.name,
      description: result.data.description,
      color: result.data.color,
    });
  };

  const isEditing = Boolean(initialGroup);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      title={isEditing ? 'Edit Contact Group' : 'Create Contact Group'}
      description={
        isEditing
          ? 'Update name, description, or color badge for this segment'
          : 'Organize your contacts into segments, accounts, or pipelines'
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Group Name *"
          placeholder="e.g. VIP Enterprise or Strategic Partners"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError('');
          }}
          error={error}
        />

        <Textarea
          label="Description (Optional)"
          placeholder="What criteria or purpose defines this group?"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-foreground/80 tracking-wide">
            Badge Accent Color
          </label>
          <div className="flex flex-wrap gap-2 items-center">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`h-7 w-7 rounded-full transition-transform ${
                  color === c ? 'ring-2 ring-primary ring-offset-2 scale-110' : 'hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
                aria-label={`Select color ${c}`}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/70">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" size="sm" isLoading={isLoading}>
            {isEditing ? 'Update' : 'Create Group'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
