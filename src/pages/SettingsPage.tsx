import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Sidebar } from '@/components/Sidebar';
import { Navigation } from '@/components/Navigation';
import { Eye, EyeOff, Key, Globe, Bell, Shield, ArrowLeft, Mail, FileDown } from 'lucide-react';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { profile, updateProfile } = useProfile();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [openaiKey, setOpenaiKey] = useState('');
  const [googleAiKey, setGoogleAiKey] = useState('');
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [showGoogleKey, setShowGoogleKey] = useState(false);
  const [language, setLanguage] = useState(profile?.language || 'it');
  const [emailNotifications, setEmailNotifications] = useState(profile?.email_notifications ?? true);
  const [emailService, setEmailService] = useState(profile?.email_service || 'outlook');
  const [exportFormat, setExportFormat] = useState(profile?.export_format || 'csv');
  const [exportIncludePhotos, setExportIncludePhotos] = useState(profile?.export_include_photos ?? true);
  const [exportIncludeCvs, setExportIncludeCvs] = useState(profile?.export_include_cvs ?? false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSaveApiKeys = async () => {
    setIsLoading(true);
    try {
      const updates: any = {};
      if (openaiKey.trim()) updates.openai_api_key = openaiKey;
      if (googleAiKey.trim()) updates.google_ai_api_key = googleAiKey;
      
      if (Object.keys(updates).length > 0) {
        await updateProfile(updates);
        setOpenaiKey('');
        setGoogleAiKey('');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    setIsLoading(true);
    try {
      await updateProfile({
        language,
        email_notifications: emailNotifications,
        email_service: emailService,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveExportPreferences = async () => {
    setIsLoading(true);
    try {
      await updateProfile({
        export_format: exportFormat,
        export_include_photos: exportIncludePhotos,
        export_include_cvs: exportIncludeCvs,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Errore',
        description: 'Le password non coincidono',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Errore',
        description: 'La password deve contenere almeno 6 caratteri',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: 'Password aggiornata',
        description: 'La tua password è stata cambiata con successo',
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({
        title: 'Errore',
        description: error.message || 'Impossibile aggiornare la password',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Sei sicuro di voler eliminare il tuo account? Questa azione è irreversibile.')) {
      return;
    }

    try {
      // First delete all user data
      await supabase.from('candidates').delete().eq('user_id', user!.id);
      await supabase.from('profiles').delete().eq('user_id', user!.id);
      
      toast({
        title: 'Account eliminato',
        description: 'Il tuo account è stato eliminato con successo',
      });
      
      await supabase.auth.signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile eliminare l\'account',
        variant: 'destructive',
      });
    }
  };

  const hasOpenaiKey = profile?.openai_api_key && profile.openai_api_key.length > 0;
  const hasGoogleKey = profile?.google_ai_api_key && profile.google_ai_api_key.length > 0;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeTab="settings" onTabChange={(tab) => {
        if (tab === 'dashboard') navigate('/');
        else if (tab === 'settings') navigate('/settings');
      }} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navigation />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold">Impostazioni</h1>
                <p className="text-muted-foreground">
                  Gestisci le tue preferenze e configurazioni
                </p>
              </div>
            </div>

            <Separator />

            {/* API Keys Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  <CardTitle>Chiavi API</CardTitle>
                </div>
                <CardDescription>
                  Configura le tue chiavi API personali per i servizi AI. Le chiavi sono crittografate e utilizzate solo per le tue richieste.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="openai-key">OpenAI API Key</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="openai-key"
                        type={showOpenaiKey ? 'text' : 'password'}
                        value={openaiKey}
                        onChange={(e) => setOpenaiKey(e.target.value)}
                        placeholder={hasOpenaiKey ? '••••••••••••••••' : 'sk-...'}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                      >
                        {showOpenaiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  {hasOpenaiKey && (
                    <p className="text-xs text-muted-foreground">
                      ✓ Chiave configurata
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="google-key">Google AI API Key</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="google-key"
                        type={showGoogleKey ? 'text' : 'password'}
                        value={googleAiKey}
                        onChange={(e) => setGoogleAiKey(e.target.value)}
                        placeholder={hasGoogleKey ? '••••••••••••••••' : 'AIza...'}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setShowGoogleKey(!showGoogleKey)}
                      >
                        {showGoogleKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  {hasGoogleKey && (
                    <p className="text-xs text-muted-foreground">
                      ✓ Chiave configurata
                    </p>
                  )}
                </div>

                <Button onClick={handleSaveApiKeys} disabled={isLoading}>
                  Salva Chiavi API
                </Button>
              </CardContent>
            </Card>

            {/* Email Service Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  <CardTitle>Servizio Email</CardTitle>
                </div>
                <CardDescription>
                  Scegli come inviare le email ai candidati
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-service">Metodo di Invio Email</Label>
                  <Select value={emailService} onValueChange={setEmailService}>
                    <SelectTrigger id="email-service">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="outlook">Outlook (mailto)</SelectItem>
                      <SelectItem value="browser">Browser (Composizione)</SelectItem>
                      <SelectItem value="gmail">Gmail (API)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-2">
                    {emailService === 'outlook' && 'Aprirà il tuo client Outlook di default'}
                    {emailService === 'browser' && 'Aprirà un form di composizione email nel browser'}
                    {emailService === 'gmail' && 'Invierà direttamente tramite Gmail (richiede configurazione)'}
                  </p>
                </div>

                <Button onClick={handleSavePreferences} disabled={isLoading}>
                  Salva Impostazioni Email
                </Button>
              </CardContent>
            </Card>

            {/* Preferences Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  <CardTitle>Preferenze Generali</CardTitle>
                </div>
                <CardDescription>
                  Personalizza l'esperienza dell'applicazione
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Lingua</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger id="language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="it">Italiano</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      <Label htmlFor="email-notifications">Notifiche Email</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Ricevi aggiornamenti via email
                    </p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>

                <Button onClick={handleSavePreferences} disabled={isLoading}>
                  Salva Preferenze
                </Button>
              </CardContent>
            </Card>

            {/* Export Preferences Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileDown className="h-5 w-5" />
                  <CardTitle>Preferenze di Esportazione</CardTitle>
                </div>
                <CardDescription>
                  Configura come esportare i dati dei candidati
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="export-format">Formato di Esportazione</Label>
                  <Select value={exportFormat} onValueChange={setExportFormat}>
                    <SelectTrigger id="export-format">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV (Excel)</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Scegli il formato predefinito per esportare i dati
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="export-photos">Includi Foto</Label>
                    <p className="text-sm text-muted-foreground">
                      Includi le foto dei candidati nell'esportazione
                    </p>
                  </div>
                  <Switch
                    id="export-photos"
                    checked={exportIncludePhotos}
                    onCheckedChange={setExportIncludePhotos}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="export-cvs">Includi CV</Label>
                    <p className="text-sm text-muted-foreground">
                      Includi i curriculum vitae nell'esportazione
                    </p>
                  </div>
                  <Switch
                    id="export-cvs"
                    checked={exportIncludeCvs}
                    onCheckedChange={setExportIncludeCvs}
                  />
                </div>

                <Button onClick={handleSaveExportPreferences} disabled={isLoading}>
                  Salva Preferenze di Esportazione
                </Button>
              </CardContent>
            </Card>

            {/* Security Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  <CardTitle>Sicurezza e Privacy</CardTitle>
                </div>
                <CardDescription>
                  Gestisci la sicurezza del tuo account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Email Account</Label>
                  <Input value={user?.email || ''} disabled />
                </div>

                <Separator />

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Cambia Password</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Aggiorna la tua password per mantenere il tuo account sicuro
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-password">Nuova Password</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Inserisci nuova password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Conferma Password</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Conferma nuova password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button 
                    onClick={handleChangePassword} 
                    disabled={isLoading || !newPassword || !confirmPassword}
                  >
                    Aggiorna Password
                  </Button>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-destructive">Zona Pericolosa</h4>
                  <p className="text-sm text-muted-foreground">
                    Eliminare il tuo account rimuoverà permanentemente tutti i tuoi dati.
                  </p>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                  >
                    Elimina Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}