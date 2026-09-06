import React, { useState, useEffect } from 'react';
import {
  Sun,
  Moon,
  Laptop,
  Download,
  Upload,
  RotateCcw,
  ShieldAlert,
  Check,
  User,
  Sliders,
  Database,
  Radio,
  Bell,
  Save,
  FileSpreadsheet,
  FileCode,
  FileText,
  CheckCircle2,
  Phone,
  Mail,
  MessageSquare,
  MessageCircle,
  Instagram,
  Settings as SettingsIcon,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useUserProfile } from '../context/UserProfileContext';
import { useResetData, useImportContacts } from '../hooks/useCRM';
import { crmStorage } from '../services/crmStorage';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Avatar } from '../components/ui/Avatar';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useToast } from '../components/ui/Toast';
import { Contact, CommunicationChannel } from '../types';

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { profile, updateProfile } = useUserProfile();
  const resetData = useResetData();
  const importContactsMutation = useImportContacts();
  const { success, error, info } = useToast();

  const [activeTab, setActiveTab] = useState<
    'profile' | 'appearance' | 'preferences' | 'communication' | 'data'
  >('profile');

  // Profile state
  const [profileName, setProfileName] = useState(profile.name);
  const [profileEmail, setProfileEmail] = useState(profile.email);
  const [profileRole, setProfileRole] = useState(profile.role);
  const [profileAvatar, setProfileAvatar] = useState(profile.avatar);

  // Preferences state
  const [defaultView, setDefaultView] = useState<'list' | 'grid'>('list');
  const [defaultSort, setDefaultSort] = useState('recent');
  const [notifyOverdue, setNotifyOverdue] = useState(true);
  const [notifyDailyDigest, setNotifyDailyDigest] = useState(true);
  const [soundEffects, setSoundEffects] = useState(false);

  // Communication defaults
  const [phoneFormat, setPhoneFormat] = useState('US');
  const [preferredChannel, setPreferredChannel] = useState<CommunicationChannel>('phone');

  // Dialogs & import states
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [importStats, setImportStats] = useState<{ count: number } | null>(null);

  // Load saved preferences on mount
  useEffect(() => {
    try {
      setProfileName(profile.name);
      setProfileEmail(profile.email);
      setProfileRole(profile.role);
      setProfileAvatar(profile.avatar);

      const savedPrefs = localStorage.getItem('nexus_crm_user_preferences');
      if (savedPrefs) {
        const pr = JSON.parse(savedPrefs);
        if (pr.defaultView) setDefaultView(pr.defaultView);
        if (pr.defaultSort) setDefaultSort(pr.defaultSort);
        if (typeof pr.notifyOverdue === 'boolean') setNotifyOverdue(pr.notifyOverdue);
        if (typeof pr.notifyDailyDigest === 'boolean') setNotifyDailyDigest(pr.notifyDailyDigest);
        if (typeof pr.soundEffects === 'boolean') setSoundEffects(pr.soundEffects);
      }

      const savedComm = localStorage.getItem('nexus_crm_comm_defaults');
      if (savedComm) {
        const cm = JSON.parse(savedComm);
        if (cm.phoneFormat) setPhoneFormat(cm.phoneFormat);
        if (cm.preferredChannel) setPreferredChannel(cm.preferredChannel);
      }
    } catch {
      // Ignored
    }
  }, [profile]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      updateProfile({
        name: profileName,
        email: profileEmail,
        role: profileRole,
        avatar: profileAvatar,
      });
      success('Profile updated', 'Your user information has been updated');
    } catch {
      error('Failed to update profile');
    }
  };

  const handleSavePreferences = () => {
    try {
      localStorage.setItem(
        'nexus_crm_user_preferences',
        JSON.stringify({
          defaultView,
          defaultSort,
          notifyOverdue,
          notifyDailyDigest,
          soundEffects,
        })
      );
      success('Preferences updated', 'Display and notification settings updated');
    } catch {
      error('Failed to save preferences');
    }
  };

  const handleSaveCommDefaults = () => {
    try {
      localStorage.setItem(
        'nexus_crm_comm_defaults',
        JSON.stringify({
          phoneFormat,
          preferredChannel,
        })
      );
      success('Communication defaults updated', 'Outreach preferences updated');
    } catch {
      error('Failed to save communication defaults');
    }
  };

  const handleExportJson = () => {
    try {
      const dataStr = crmStorage.exportData();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `nexus-crm-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      success('JSON backup exported', 'Complete database exported to JSON');
    } catch {
      error('Failed to export backup');
    }
  };

  const handleExportCsv = () => {
    try {
      const csvContent = crmStorage.exportContactsAsCsv();
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `nexus-contacts-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      success('Contacts CSV exported', 'Spreadsheet-ready CSV file downloaded');
    } catch {
      error('Failed to export contacts CSV');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      try {
        if (file.name.endsWith('.json')) {
          // Parse JSON
          const parsed = JSON.parse(content);
          const contactArray: Partial<Contact>[] = Array.isArray(parsed)
            ? parsed
            : parsed.contacts || [];

          if (contactArray.length === 0) {
            error('Invalid JSON file', 'No contact records found');
            return;
          }

          const result = await importContactsMutation.mutateAsync(contactArray);
          success('Contacts imported', `Added ${result.added} contacts`);
          setImportStats({ count: result.added });
        } else if (file.name.endsWith('.csv') || file.type.includes('csv')) {
          // Parse simple CSV
          const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);
          if (lines.length <= 1) {
            error('Empty CSV file', 'File has no data rows');
            return;
          }

          const parsedContacts: Partial<Contact>[] = [];
          for (let i = 1; i < lines.length; i++) {
            // Split respecting quotes
            const parts = lines[i].split(',').map((p) => p.replace(/^"|"$/g, '').trim());
            if (parts[0]) {
              parsedContacts.push({
                firstName: parts[0],
                lastName: parts[1] || '',
                email: parts[2] || `${parts[0].toLowerCase()}@example.com`,
                phone: parts[3] || '',
                company: parts[6] || '',
                jobTitle: parts[7] || '',
                status: 'Lead',
                tags: parts[10] ? parts[10].split(';').map((t) => t.trim()) : ['Imported'],
                groupIds: [],
              });
            }
          }

          const result = await importContactsMutation.mutateAsync(parsedContacts);
          success('CSV contacts imported', `Successfully imported ${result.added} contacts`);
          setImportStats({ count: result.added });
        } else {
          error('Unsupported file format', 'Please upload a valid .csv or .json file');
        }
      } catch (err: any) {
        error('Import failed', err?.message || 'Could not parse contact file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleReset = async () => {
    try {
      await resetData.mutateAsync();
      success('Data cleared', 'All contacts, groups, and logs have been removed');
      setIsResetDialogOpen(false);
    } catch {
      error('Failed to reset data');
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
          Configure profile, appearance, preferences, communication channels, and manage local data
        </p>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex border-b border-border overflow-x-auto text-xs sm:text-sm font-medium">
        {[
          { id: 'profile', label: 'User Profile', icon: User },
          { id: 'appearance', label: 'Appearance', icon: Sliders },
          { id: 'preferences', label: 'Preferences', icon: Bell },
          { id: 'communication', label: 'Communication Defaults', icon: Radio },
          { id: 'data', label: 'Data Management', icon: Database },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-3 px-4 border-b-2 whitespace-nowrap transition-all ${
                isActive
                  ? 'border-primary text-primary font-semibold'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SECTION 1: PROFILE */}
      {activeTab === 'profile' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-primary" /> Executive Profile
            </CardTitle>
            <CardDescription>
              Personalize your identity and details displayed across activity feeds and logs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-5 max-w-xl">
              <div className="flex items-center gap-4">
                <Avatar src={profileAvatar} firstName={profileName} size="xl" className="ring-2 ring-primary/20" />
                <div>
                  <h4 className="text-sm font-semibold text-foreground">{profileName}</h4>
                  <p className="text-xs text-muted-foreground">{profileRole}</p>
                </div>
              </div>

              <Input
                label="Full Name *"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="e.g. Alex Morgan"
                required
              />

              <Input
                label="Email Address *"
                type="email"
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                placeholder="alex.morgan@company.com"
                required
              />

              <Input
                label="Job Title / Role"
                value={profileRole}
                onChange={(e) => setProfileRole(e.target.value)}
                placeholder="e.g. VP of Sales & Growth"
              />

              <Input
                label="Avatar Image URL (Optional)"
                value={profileAvatar}
                onChange={(e) => setProfileAvatar(e.target.value)}
                placeholder="https://..."
              />

              <div className="pt-2">
                <Button type="submit" size="sm" className="gap-1.5">
                  <Save className="h-4 w-4" /> Update Profile
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* SECTION 2: APPEARANCE */}
      {activeTab === 'appearance' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sliders className="h-4 w-4 text-primary" /> Appearance & Theme
            </CardTitle>
            <CardDescription>
              Choose how ComHub renders on your device. Select light mode, dark mode, or system automatic
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Light */}
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex flex-col items-center justify-between p-5 rounded-2xl border text-center transition-all ${
                  theme === 'light'
                    ? 'border-primary ring-2 ring-primary/20 bg-primary/5 text-primary shadow-xs'
                    : 'border-border bg-card hover:bg-muted/40 text-foreground'
                }`}
              >
                <div className="p-3 rounded-full bg-amber-500/10 text-amber-500 mb-2">
                  <Sun className="h-6 w-6" />
                </div>
                <span className="text-sm font-semibold">Light Mode</span>
                <span className="text-xs text-muted-foreground mt-0.5">
                  Crisp, high-contrast, clean SaaS aesthetic
                </span>
                {theme === 'light' && (
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                    <Check className="h-3.5 w-3.5" /> Active
                  </span>
                )}
              </button>

              {/* Dark */}
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex flex-col items-center justify-between p-5 rounded-2xl border text-center transition-all ${
                  theme === 'dark'
                    ? 'border-primary ring-2 ring-primary/20 bg-primary/5 text-primary shadow-xs'
                    : 'border-border bg-card hover:bg-muted/40 text-foreground'
                }`}
              >
                <div className="p-3 rounded-full bg-indigo-500/10 text-indigo-400 mb-2">
                  <Moon className="h-6 w-6" />
                </div>
                <span className="text-sm font-semibold">Dark Mode</span>
                <span className="text-xs text-muted-foreground mt-0.5">
                  Sleek dark slate design for low-light focus
                </span>
                {theme === 'dark' && (
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                    <Check className="h-3.5 w-3.5" /> Active
                  </span>
                )}
              </button>

              {/* System */}
              <button
                type="button"
                onClick={() => setTheme('system')}
                className={`flex flex-col items-center justify-between p-5 rounded-2xl border text-center transition-all ${
                  theme === 'system'
                    ? 'border-primary ring-2 ring-primary/20 bg-primary/5 text-primary shadow-xs'
                    : 'border-border bg-card hover:bg-muted/40 text-foreground'
                }`}
              >
                <div className="p-3 rounded-full bg-zinc-500/10 text-zinc-500 mb-2">
                  <Laptop className="h-6 w-6" />
                </div>
                <span className="text-sm font-semibold">System Default</span>
                <span className="text-xs text-muted-foreground mt-0.5">
                  Automatically sync with your operating system
                </span>
                {theme === 'system' && (
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                    <Check className="h-3.5 w-3.5" /> Active
                  </span>
                )}
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SECTION 3: PREFERENCES */}
      {activeTab === 'preferences' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" /> Application Preferences
            </CardTitle>
            <CardDescription>
              Configure default directory display layouts, sorting, and reminder notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 max-w-xl">
            {/* Default Contact View */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Default Contacts View
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDefaultView('list')}
                  className={`p-3 rounded-xl border text-left text-xs font-medium transition-all ${
                    defaultView === 'list'
                      ? 'border-primary bg-primary/10 text-primary font-semibold'
                      : 'border-border bg-card text-muted-foreground hover:text-foreground'
                  }`}
                >
                  List (Dense Table)
                </button>
                <button
                  type="button"
                  onClick={() => setDefaultView('grid')}
                  className={`p-3 rounded-xl border text-left text-xs font-medium transition-all ${
                    defaultView === 'grid'
                      ? 'border-primary bg-primary/10 text-primary font-semibold'
                      : 'border-border bg-card text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Grid (Cards)
                </button>
              </div>
            </div>

            {/* Default Sorting */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Default Contact Sorting
              </label>
              <Select
                value={defaultSort}
                onChange={(e) => setDefaultSort(e.target.value)}
                options={[
                  { value: 'recent', label: 'Recently Added' },
                  { value: 'name', label: 'Name (A to Z)' },
                  { value: 'company', label: 'Company (A to Z)' },
                  { value: 'lastContacted', label: 'Last Contacted' },
                  { value: 'status', label: 'Lifecycle Status' },
                ]}
              />
            </div>

            {/* Notification Toggles */}
            <div className="space-y-3 pt-3 border-t border-border/60">
              <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Notification Alerts
              </span>

              <div className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/20">
                <div>
                  <p className="text-xs font-semibold text-foreground">Overdue Task Alerts</p>
                  <p className="text-[11px] text-muted-foreground">Highlight urgent overdue reminders in red</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyOverdue}
                  onChange={(e) => setNotifyOverdue(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/20">
                <div>
                  <p className="text-xs font-semibold text-foreground">Daily Follow-up Digest</p>
                  <p className="text-[11px] text-muted-foreground">Show Due Today summary on dashboard</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyDailyDigest}
                  onChange={(e) => setNotifyDailyDigest(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/20">
                <div>
                  <p className="text-xs font-semibold text-foreground">Interaction Sound Feedback</p>
                  <p className="text-[11px] text-muted-foreground">Play subtle click feedback on actions</p>
                </div>
                <input
                  type="checkbox"
                  checked={soundEffects}
                  onChange={(e) => setSoundEffects(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                />
              </div>
            </div>

            <Button type="button" size="sm" onClick={handleSavePreferences} className="gap-1.5">
              <Save className="h-4 w-4" /> Update Preferences
            </Button>
          </CardContent>
        </Card>
      )}

      {/* SECTION 4: COMMUNICATION DEFAULTS */}
      {activeTab === 'communication' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Radio className="h-4 w-4 text-emerald-500" /> Communication Defaults
            </CardTitle>
            <CardDescription>
              Configure default dialing country formats and preferred primary outreach channels
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 max-w-xl">
            {/* Phone Formatting Preference */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Default Phone / Dialing Format
              </label>
              <Select
                value={phoneFormat}
                onChange={(e) => setPhoneFormat(e.target.value)}
                options={[
                  { value: 'US', label: 'North America / US (+1) — (XXX) XXX-XXXX' },
                  { value: 'UK', label: 'United Kingdom (+44) — +44 XXXX XXXXXX' },
                  { value: 'EU', label: 'European Union (+33, +49) — +XX X XX XX XX XX' },
                  { value: 'RAW', label: 'International / Raw E.164 without spacing' },
                ]}
              />
            </div>

            {/* Preferred Primary Channel */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Preferred Primary Outreach Channel
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { id: 'phone', label: 'Phone Call', icon: Phone, color: 'text-emerald-500' },
                  { id: 'email', label: 'Email', icon: Mail, color: 'text-blue-500' },
                  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'text-green-500' },
                  { id: 'sms', label: 'SMS', icon: MessageSquare, color: 'text-purple-500' },
                  { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-500' },
                ].map((ch) => {
                  const Icon = ch.icon;
                  const isSelected = preferredChannel === ch.id;
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => setPreferredChannel(ch.id as any)}
                      className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-medium transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary font-semibold shadow-xs'
                          : 'border-border bg-card text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${ch.color}`} />
                      <span>{ch.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <Button type="button" size="sm" onClick={handleSaveCommDefaults} className="gap-1.5">
              <Save className="h-4 w-4" /> Update Communication Defaults
            </Button>
          </CardContent>
        </Card>
      )}

      {/* SECTION 5: DATA MANAGEMENT */}
      {activeTab === 'data' && (
        <div className="space-y-6">
          {/* Real Export Cards */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Download className="h-4 w-4 text-primary" /> Export Data
              </CardTitle>
              <CardDescription>
                Download your complete database or spreadsheet-ready contact CSV for offline analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* CSV Export */}
                <div className="p-4 rounded-xl border border-border/70 bg-muted/20 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      <h4 className="text-sm font-semibold text-foreground">Export Contacts (CSV)</h4>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Spreadsheet file containing first/last names, emails, phones, social handles, companies, roles, and status tags.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Download className="h-4 w-4" />}
                    onClick={handleExportCsv}
                    className="w-full justify-center"
                  >
                    Download .CSV
                  </Button>
                </div>

                {/* JSON Export */}
                <div className="p-4 rounded-xl border border-border/70 bg-muted/20 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <FileCode className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      <h4 className="text-sm font-semibold text-foreground">Full Database (JSON)</h4>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Complete raw database snapshot including contacts, groups, interaction logs, and scheduled follow-ups.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Download className="h-4 w-4" />}
                    onClick={handleExportJson}
                    className="w-full justify-center"
                  >
                    Download .JSON
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Real Import UI */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Upload className="h-4 w-4 text-blue-500" /> Import Contacts
              </CardTitle>
              <CardDescription>
                Upload a CSV or JSON file to import new contacts into your local storage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-6 rounded-xl border-2 border-dashed border-border text-center space-y-3 hover:border-primary/50 transition-colors">
                <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                <div>
                  <label
                    htmlFor="contactFileInput"
                    className="text-xs sm:text-sm font-semibold text-primary hover:underline cursor-pointer"
                  >
                    Click to select CSV or JSON file
                  </label>
                  <input
                    type="file"
                    id="contactFileInput"
                    accept=".csv,.json,text/csv,application/json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Supports .csv (First Name, Last Name, Email, Phone...) and .json arrays
                  </p>
                </div>

                {importStats && (
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold inline-flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    Last import successful: {importStats.count} contacts added
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Reset Demo Data */}
          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-base text-destructive flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" /> Factory Reset Demo Data
              </CardTitle>
              <CardDescription>
                Revert all contacts, communication history, groups, and tasks back to the default factory demo dataset
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-destructive/20 bg-destructive/5">
                <div>
                  <h4 className="text-sm font-semibold text-destructive">Clear All Data</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    This will permanently erase all contacts, communication logs, groups, and tasks from this device.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  leftIcon={<RotateCcw className="h-4 w-4" />}
                  onClick={() => setIsResetDialogOpen(true)}
                  className="shrink-0"
                >
                  Reset All Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isResetDialogOpen}
        onClose={() => setIsResetDialogOpen(false)}
        onConfirm={handleReset}
        title="Reset All Data?"
        description="This will permanently erase all contacts, communication logs, groups, and tasks. Any custom records you created will be removed."
        confirmText="Clear All Data"
        variant="destructive"
        isLoading={resetData.isPending}
      />
    </div>
  );
}
