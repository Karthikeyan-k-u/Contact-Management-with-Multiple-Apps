import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  Plus,
  Users,
  Search,
  Edit2,
  Trash2,
  UserPlus,
  UserMinus,
  ExternalLink,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Check,
} from 'lucide-react';
import {
  useGroups,
  useContacts,
  useCreateGroup,
  useUpdateGroup,
  useDeleteGroup,
  useAssignContactToGroup,
  useRemoveContactFromGroup,
} from '../hooks/useCRM';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { StatusBadge } from '../components/ui/Badge';
import { SearchInput } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { CommunicationBar } from '../components/communication/CommunicationBar';
import { AddGroupModal } from '../components/groups/AddGroupModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { useToast } from '../components/ui/Toast';
import { Group, Contact } from '../types';

export function GroupsPage() {
  const navigate = useNavigate();
  const { data: groups = [] } = useGroups();
  const { data: contacts = [] } = useContacts();

  const createGroupMutation = useCreateGroup();
  const updateGroupMutation = useUpdateGroup();
  const deleteGroupMutation = useDeleteGroup();
  const assignContactMutation = useAssignContactToGroup();
  const removeContactMutation = useRemoveContactFromGroup();
  const { success, error } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<Group | null>(null);

  // Member assignment state
  const [contactToAssignId, setContactToAssignId] = useState<string>('');

  // Selected Group details
  const activeGroup = groups.find((g) => g.id === selectedGroupId) || groups[0] || null;

  // Filter groups
  const filteredGroups = groups.filter((g) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return g.name.toLowerCase().includes(q) || (g.description || '').toLowerCase().includes(q);
  });

  const getContactsForGroup = (groupId: string): Contact[] => {
    return contacts.filter((c) => c.groupIds.includes(groupId));
  };

  const activeGroupContacts = activeGroup ? getContactsForGroup(activeGroup.id) : [];

  // Available contacts that are NOT in active group
  const nonMemberContacts = activeGroup
    ? contacts.filter((c) => !c.groupIds.includes(activeGroup.id))
    : [];

  const handleCreateOrUpdateGroup = async (groupData: Omit<Group, 'id' | 'contactCount'>) => {
    try {
      if (editingGroup) {
        await updateGroupMutation.mutateAsync({
          id: editingGroup.id,
          updates: groupData,
        });
        success('Group updated', `${groupData.name} details updated`);
        setEditingGroup(null);
      } else {
        const created = await createGroupMutation.mutateAsync(groupData);
        success('Group created', `${groupData.name} added to segments`);
        setSelectedGroupId(created.id);
        setIsAddModalOpen(false);
      }
    } catch {
      error('Failed to save group');
    }
  };

  const handleDeleteGroup = async () => {
    if (!deletingGroup) return;
    try {
      await deleteGroupMutation.mutateAsync(deletingGroup.id);
      success('Group deleted', `${deletingGroup.name} was removed`);
      if (selectedGroupId === deletingGroup.id) {
        setSelectedGroupId(null);
      }
      setDeletingGroup(null);
    } catch {
      error('Failed to delete group');
    }
  };

  const handleAssignContact = async () => {
    if (!activeGroup || !contactToAssignId) return;
    try {
      await assignContactMutation.mutateAsync({
        contactId: contactToAssignId,
        groupId: activeGroup.id,
      });
      const c = contacts.find((item) => item.id === contactToAssignId);
      success('Member added', `${c?.firstName || 'Contact'} assigned to ${activeGroup.name}`);
      setContactToAssignId('');
    } catch {
      error('Failed to add contact to group');
    }
  };

  const handleRemoveContact = async (contactId: string, contactName: string) => {
    if (!activeGroup) return;
    try {
      await removeContactMutation.mutateAsync({
        contactId,
        groupId: activeGroup.id,
      });
      success('Member removed', `${contactName} removed from ${activeGroup.name}`);
    } catch {
      error('Failed to remove contact from group');
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Contact Groups & Segments
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Segment customers, enterprise accounts, VIPs, and partners for targeted workflows
          </p>
        </div>

        <Button
          size="sm"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => {
            setEditingGroup(null);
            setIsAddModalOpen(true);
          }}
          className="shadow-xs"
        >
          Create Group
        </Button>
      </div>

      {/* Search Bar & Summary Stats */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="w-full sm:max-w-md">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search groups by name or description..."
          />
        </div>

        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <span>{groups.length} total groups</span>
          <span>•</span>
          <span>
            {contacts.reduce((acc, c) => acc + (c.groupIds.length > 0 ? 1 : 0), 0)} categorized contacts
          </span>
        </div>
      </div>

      {/* Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols): Groups List Cards */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              All Groups ({filteredGroups.length})
            </span>
          </div>

          {filteredGroups.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-xs text-muted-foreground space-y-3">
                <FolderKanban className="h-8 w-8 text-muted-foreground mx-auto" />
                <p>No groups match your search.</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSearchQuery('')}
                >
                  Clear Search
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3 max-h-[750px] overflow-y-auto pr-1">
              {filteredGroups.map((group) => {
                const groupContacts = getContactsForGroup(group.id);
                const isSelected = activeGroup?.id === group.id;

                return (
                  <Card
                    key={group.id}
                    hoverEffect
                    onClick={() => setSelectedGroupId(group.id)}
                    className={`cursor-pointer transition-all border ${
                      isSelected
                        ? 'border-primary ring-1 ring-primary/20 bg-primary/5 shadow-xs'
                        : 'border-border bg-card hover:bg-muted/30'
                    }`}
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <span
                            className="h-3.5 w-3.5 rounded-full shrink-0 ring-2 ring-background"
                            style={{ backgroundColor: group.color }}
                          />
                          <h3 className="font-semibold text-sm sm:text-base text-foreground truncate">
                            {group.name}
                          </h3>
                        </div>

                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-muted text-[11px] font-semibold text-foreground shrink-0">
                          <Users className="h-3 w-3 mr-1 text-muted-foreground" />
                          {groupContacts.length}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {group.description || 'No description provided.'}
                      </p>

                      {/* Footer: Avatars preview & quick actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-border/60">
                        {/* Member avatars */}
                        <div className="flex items-center -space-x-1.5 overflow-hidden py-0.5">
                          {groupContacts.slice(0, 4).map((c) => (
                            <Avatar
                              key={c.id}
                              src={c.avatar}
                              firstName={c.firstName}
                              lastName={c.lastName}
                              size="xs"
                              className="ring-2 ring-card"
                            />
                          ))}
                          {groupContacts.length > 4 && (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[9px] font-semibold text-muted-foreground ring-2 ring-card">
                              +{groupContacts.length - 4}
                            </div>
                          )}
                          {groupContacts.length === 0 && (
                            <span className="text-[11px] text-muted-foreground italic">
                              0 members
                            </span>
                          )}
                        </div>

                        {/* Card Actions */}
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingGroup(group);
                            }}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                            title="Edit group"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingGroup(group);
                            }}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            title="Delete group"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column (7 Cols): Selected Group Detail & Member Contacts Table */}
        <div className="lg:col-span-7">
          {activeGroup ? (
            <Card className="border border-border/80 shadow-xs">
              {/* Group Header Banner */}
              <CardHeader className="border-b border-border/70 p-5 bg-muted/20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span
                      className="h-5 w-5 rounded-full shrink-0 mt-0.5 ring-2 ring-background shadow-xs"
                      style={{ backgroundColor: activeGroup.color }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg sm:text-xl">{activeGroup.name}</CardTitle>
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-muted text-muted-foreground">
                          {activeGroupContacts.length} contacts
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {activeGroup.description || 'No description set.'}
                      </p>
                    </div>
                  </div>

                  {/* Actions Header */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingGroup(activeGroup)}
                      className="h-8 text-xs"
                    >
                      <Edit2 className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingGroup(activeGroup)}
                      className="h-8 text-xs text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>

                {/* Add Contact To Group Bar */}
                <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 border-t border-border/60 mt-3">
                  <div className="flex-1">
                    <Select
                      value={contactToAssignId}
                      onChange={(e) => setContactToAssignId(e.target.value)}
                      options={[
                        { value: '', label: '-- Add a contact to this group --' },
                        ...nonMemberContacts.map((c) => ({
                          value: c.id,
                          label: `${c.firstName} ${c.lastName || ''} · ${c.company || c.email}`,
                        })),
                      ]}
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={handleAssignContact}
                    disabled={!contactToAssignId || assignContactMutation.isPending}
                    isLoading={assignContactMutation.isPending}
                    className="h-9 px-3 text-xs shrink-0"
                  >
                    <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                    Assign Member
                  </Button>
                </div>
              </CardHeader>

              {/* Members Table */}
              <CardContent className="p-0">
                {activeGroupContacts.length === 0 ? (
                  <div className="py-16 text-center space-y-3 px-4">
                    <Users className="h-10 w-10 text-muted-foreground/40 mx-auto" />
                    <h4 className="text-sm font-semibold text-foreground">No contacts in this group</h4>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      Use the contact selector above to assign members to the {activeGroup.name} segment.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/60">
                    {activeGroupContacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
                      >
                        {/* Member Identity */}
                        <div
                          className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                          onClick={() => navigate(`/contacts/${contact.id}`)}
                        >
                          <Avatar
                            src={contact.avatar}
                            firstName={contact.firstName}
                            lastName={contact.lastName}
                            size="md"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-semibold text-foreground hover:text-primary transition-colors truncate">
                                {contact.firstName} {contact.lastName}
                              </h4>
                              <StatusBadge status={contact.status} />
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {contact.jobTitle ? `${contact.jobTitle} · ` : ''}
                              <span className="text-foreground/80 font-medium">
                                {contact.company || contact.email}
                              </span>
                            </p>
                          </div>
                        </div>

                        {/* Communication Bar & Actions */}
                        <div className="flex items-center justify-between sm:justify-end gap-2 pl-11 sm:pl-0">
                          <CommunicationBar contact={contact} size="sm" />

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleRemoveContact(
                                contact.id,
                                `${contact.firstName} ${contact.lastName || ''}`
                              )
                            }
                            className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            title="Remove from this group"
                          >
                            <UserMinus className="h-3.5 w-3.5 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center text-xs text-muted-foreground">
                Select a group to view and manage its member contacts.
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Add / Edit Group Modal */}
      <AddGroupModal
        isOpen={isAddModalOpen || Boolean(editingGroup)}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingGroup(null);
        }}
        initialGroup={editingGroup}
        onSubmit={handleCreateOrUpdateGroup}
        isLoading={createGroupMutation.isPending || updateGroupMutation.isPending}
      />

      {/* Delete Group Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingGroup)}
        onClose={() => setDeletingGroup(null)}
        title="Delete Contact Group"
        description={`Are you sure you want to delete "${deletingGroup?.name}"? Contacts assigned to this group will remain in your contacts; only their group tag will be cleared.`}
        confirmText="Delete Group"
        variant="destructive"
        onConfirm={handleDeleteGroup}
        isLoading={deleteGroupMutation.isPending}
      />
    </div>
  );
}
