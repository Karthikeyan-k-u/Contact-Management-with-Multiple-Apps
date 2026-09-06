import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext';
import { UserProfileProvider } from './context/UserProfileContext';
import { ToastProvider } from './components/ui/Toast';
import { AppLayout } from './components/layout/AppLayout';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { ContactsPage } from './pages/ContactsPage';
import { ContactDetailPage } from './pages/ContactDetailPage';
import { GroupsPage } from './pages/GroupsPage';
import { InteractionsPage } from './pages/InteractionsPage';
import { ChannelLogPage } from './pages/ChannelLogPage';
import { FollowUpsPage } from './pages/FollowUpsPage';
import { SettingsPage } from './pages/SettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <UserProfileProvider>
            <BrowserRouter>
              <ErrorBoundary>
                <Routes>
                  <Route path="/" element={<AppLayout />}>
                    <Route index element={<DashboardPage />} />
                    <Route path="contacts" element={<ContactsPage />} />
                    <Route path="contacts/:id" element={<ContactDetailPage />} />
                    <Route path="groups" element={<GroupsPage />} />
                    <Route path="messages" element={<InteractionsPage />} />
                    <Route path="calls" element={<ChannelLogPage channel="call" />} />
                    <Route path="emails" element={<ChannelLogPage channel="email" />} />
                    <Route path="sms" element={<ChannelLogPage channel="sms" />} />
                    <Route path="whatsapp" element={<ChannelLogPage channel="whatsapp" />} />
                    <Route path="instagram" element={<ChannelLogPage channel="instagram" />} />
                    <Route path="follow-ups" element={<FollowUpsPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Route>
                </Routes>
              </ErrorBoundary>
            </BrowserRouter>
          </UserProfileProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
