import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight, UserCheck } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useContacts } from '../../hooks/useCRM';
import { Avatar } from '../ui/Avatar';
import { StatusBadge } from '../ui/Badge';
import { CommunicationBar } from '../communication/CommunicationBar';

export interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { data: contacts = [] } = useContacts({ search: query });

  const handleSelectContact = (id: string) => {
    navigate(`/contacts/${id}`);
    onClose();
    setQuery('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" showCloseButton={false}>
      <div className="space-y-4">
        {/* Search Bar Input */}
        <div className="relative flex items-center border-b border-border/80 pb-3">
          <Search className="h-5 w-5 text-muted-foreground mr-3 flex-shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search contacts by name, email, company, or tag..."
            className="w-full bg-transparent text-base sm:text-lg text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
          />
          <kbd className="hidden sm:inline-block rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-[350px] overflow-y-auto space-y-1.5 pr-1">
          {contacts.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No contacts found matching &quot;{query}&quot;
            </div>
          ) : (
            contacts.slice(0, 8).map((contact) => (
              <div
                key={contact.id}
                onClick={() => handleSelectContact(contact.id)}
                className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/60 transition-colors cursor-pointer border border-transparent hover:border-border/60"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <Avatar
                    src={contact.avatar}
                    firstName={contact.firstName}
                    lastName={contact.lastName}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                        {contact.firstName} {contact.lastName}
                      </span>
                      <StatusBadge status={contact.status} />
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {contact.jobTitle ? `${contact.jobTitle} • ` : ''}
                      {contact.company || contact.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0">
                  <CommunicationBar contact={contact} size="sm" />
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <UserCheck className="h-3.5 w-3.5" /> Showing up to {Math.min(contacts.length, 8)} results
          </span>
          <span>Press ESC to exit</span>
        </div>
      </div>
    </Modal>
  );
}
