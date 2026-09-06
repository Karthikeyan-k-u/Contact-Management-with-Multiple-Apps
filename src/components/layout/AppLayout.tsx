import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { ContactFormModal } from '../contacts/ContactFormModal';
import { GlobalSearchModal } from '../common/GlobalSearchModal';
import { useCreateContact } from '../../hooks/useCRM';
import { useToast } from '../ui/Toast';

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [addContactModalOpen, setAddContactModalOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  const createContact = useCreateContact();
  const { success, error } = useToast();

  const handleCreateContact = async (data: any) => {
    try {
      await createContact.mutateAsync(data);
      success('Contact Created', `${data.firstName} ${data.lastName} was added to your contacts`);
      setAddContactModalOpen(false);
    } catch (err: any) {
      error('Failed to create contact', err.message || 'Unknown error');
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
      {/* Desktop & Tablet Sidebar */}
      <div className="hidden lg:block flex-shrink-0">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
          className="sticky top-0 h-screen"
        />
      </div>

      {/* Mobile Drawer Navigation */}
      <MobileNav isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        <Header
          onOpenMobileNav={() => setMobileNavOpen(true)}
          onOpenAddContact={() => setAddContactModalOpen(true)}
          onOpenSearch={() => setSearchModalOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          <Outlet />
        </main>
      </div>

      {/* Global Modals */}
      <ContactFormModal
        isOpen={addContactModalOpen}
        onClose={() => setAddContactModalOpen(false)}
        onSubmit={handleCreateContact}
        isLoading={createContact.isPending}
      />

      <GlobalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
      />
    </div>
  );
}
