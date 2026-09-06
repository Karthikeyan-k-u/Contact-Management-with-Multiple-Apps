import React, { useState } from 'react';
import {
  X,
  Trash2,
  Tag,
  FolderPlus,
  CheckCircle2,
  ChevronDown,
  Layers,
} from 'lucide-react';
import { ContactStatus, Group } from '../../types';
import { Button } from '../ui/Button';

export interface BulkActionToolbarProps {
  selectedCount: number;
  groups: Group[];
  onDeselectAll: () => void;
  onSetStatus: (status: ContactStatus) => void;
  onAssignGroup: (groupId: string) => void;
  onAddTag: (tag: string) => void;
  onDelete: () => void;
}

export function BulkActionToolbar({
  selectedCount,
  groups,
  onDeselectAll,
  onSetStatus,
  onAssignGroup,
  onAddTag,
  onDelete,
}: BulkActionToolbarProps) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showGroupMenu, setShowGroupMenu] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTag, setNewTag] = useState('');

  if (selectedCount === 0) return null;

  const statuses: ContactStatus[] = ['Lead', 'Customer', 'Prospect', 'VIP', 'Inactive'];

  const handleAddTagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTag.trim()) {
      onAddTag(newTag.trim());
      setNewTag('');
      setShowTagInput(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-2xl animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-card/95 px-4 py-3 shadow-2xl backdrop-blur-lg text-foreground">
        {/* Count and selection badge */}
        <div className="flex items-center space-x-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground shadow-xs">
            {selectedCount}
          </span>
          <span className="text-xs sm:text-sm font-semibold text-foreground">
            {selectedCount === 1 ? '1 contact' : `${selectedCount} contacts`} selected
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Status Dropdown */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowStatusMenu((prev) => !prev);
                setShowGroupMenu(false);
                setShowTagInput(false);
              }}
              rightIcon={<ChevronDown className="h-3.5 w-3.5" />}
              className="text-xs"
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-primary" />
              Set Status
            </Button>

            {showStatusMenu && (
              <div className="absolute bottom-full mb-2 left-0 w-36 rounded-xl border border-border bg-popover p-1 shadow-elevation text-xs z-50 animate-scale-in">
                {statuses.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      onSetStatus(s);
                      setShowStatusMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg font-medium hover:bg-accent text-foreground transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Group Assign Dropdown */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowGroupMenu((prev) => !prev);
                setShowStatusMenu(false);
                setShowTagInput(false);
              }}
              rightIcon={<ChevronDown className="h-3.5 w-3.5" />}
              className="text-xs"
            >
              <FolderPlus className="h-3.5 w-3.5 mr-1 text-primary" />
              Assign Group
            </Button>

            {showGroupMenu && (
              <div className="absolute bottom-full mb-2 left-0 w-48 rounded-xl border border-border bg-popover p-1 shadow-elevation text-xs z-50 animate-scale-in">
                {groups.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => {
                      onAssignGroup(g.id);
                      setShowGroupMenu(false);
                    }}
                    className="flex items-center gap-2 w-full text-left px-2.5 py-1.5 rounded-lg font-medium hover:bg-accent text-foreground transition-colors"
                  >
                    <span
                      className="h-2 w-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: g.color }}
                    />
                    <span className="truncate">{g.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Add Tag */}
          <div className="relative">
            {showTagInput ? (
              <form
                onSubmit={handleAddTagSubmit}
                className="flex items-center gap-1 bg-background border border-primary rounded-lg px-2 py-0.5"
              >
                <input
                  type="text"
                  autoFocus
                  placeholder="New tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  className="bg-transparent text-xs text-foreground focus:outline-none w-24 py-1"
                />
                <Button type="submit" size="sm" className="h-6 px-2 text-[11px]">
                  Add
                </Button>
                <button
                  type="button"
                  onClick={() => setShowTagInput(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </form>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowTagInput(true);
                  setShowStatusMenu(false);
                  setShowGroupMenu(false);
                }}
                className="text-xs"
              >
                <Tag className="h-3.5 w-3.5 mr-1 text-primary" />
                Add Tag
              </Button>
            )}
          </div>

          {/* Delete Action */}
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
            leftIcon={<Trash2 className="h-3.5 w-3.5" />}
            className="text-xs"
          >
            Delete
          </Button>

          {/* Deselect All */}
          <button
            type="button"
            onClick={onDeselectAll}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors ml-1"
            title="Deselect all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
