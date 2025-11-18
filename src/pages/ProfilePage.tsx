import { useState, useEffect } from 'react';
import { ArrowLeft, Camera, Save, Loader2, Sun, Moon, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { ImageCropDialog } from '@/components/ImageCropDialog';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from 'next-themes';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge'; // Aggiunto Badge

export const ProfilePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, loading, updateProfile, uploadAvatar } = useProfile();
  const { theme, setTheme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    company: profile?.company || '',
    role: profile?.role || '',
    phone: profile?.phone || '',
    bio: profile?.bio || '',
  });

  useEffect(() => {
    // Ensure theme is synchronized on load if profile has a preference
    if (profile?.theme && theme !== profile.theme) {
      setTheme(profile.theme);
    }
  }, [profile, setTheme]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setShowCropDialog(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCroppedImage = async (croppedImage: Blob) => {
    const file = new File([croppedImage], 'avatar.png', { type: 'image/png' });
    await uploadAvatar(file);
    setShowCropDialog(false);
    setSelectedImage(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await updateProfile({
      ...formData,
      theme: theme || 'light', // Save current theme preference
    });
    setIsSaving(false);
    setIsEditing(false);
  };

  // Rimosso handleThemeToggle

  const handleCancel = () => {
    setFormData({
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || '',
      company: profile?.company || '',
      role: profile?.role || '',
      phone: profile?.phone || '',
      bio: profile?.bio || '',
    });
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const initials = profile 
    ? `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase()
    : user?.email?.[0].toUpperCase() || 'U';

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Torna alla dashboard
        </Button>
        <h1 className="text-3xl font-bold text-foreground">Il Mio Profilo</h1>
        <p className="text-muted-foreground">Gestisci le tue informazioni personali</p>
      </div>

      <Card className="bg-gradient-card border-0 shadow-soft">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Informazioni Personali</CardTitle>
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)}>
                Modifica Profilo
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center space-x-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="text-2xl bg-gradient-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <label className="absolute bottom-0 right-0 h-8 w-8 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-fast">
                  <Camera className="h-4 w-4 text-primary-foreground" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                </label>
              )}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">
                {profile?.first_name} {profile?.last_name}
              </h3>
              <p className="text-muted-foreground">{profile?.email}</p>
              {profile?.role && (
                <p className="text-sm text-muted-foreground">{profile.role}</p>
              )}
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="first_name">Nome</Label>
              <Input
                id="first_name"
                value={isEditing ? formData.first_name : profile?.first_name || ''}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">Cognome</Label>
              <Input
                id="last_name"
                value={isEditing ? formData.last_name : profile?.last_name || ''}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={profile?.email || ''}
                disabled
                className="bg-secondary/50"
              />
              <p className="text-xs text-muted-foreground">
                L'email non può essere modificata
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefono</Label>
              <Input
                id="phone"
                value={isEditing ? formData.phone : profile?.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={!isEditing}
                placeholder="Es. +39 123 456 7890"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Azienda</Label>
              <Input
                id="company"
                value={isEditing ? formData.company : profile?.company || ''}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                disabled={!isEditing}
                placeholder="Nome dell'azienda"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Ruolo</Label>
              <Input
                id="role"
                value={isEditing ? formData.role : profile?.role || ''}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                disabled={!isEditing}
                placeholder="Es. HR Manager, Recruiter"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={isEditing ? formData.bio : profile?.bio || ''}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              disabled={!isEditing}
              placeholder="Scrivi qualcosa su di te..."
              rows={4}
            />
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex justify-end space-x-4 pt-4">
              <Button variant="outline" onClick={handleCancel}>
                Annulla
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvataggio...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salva Modifiche
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preferenze */}
      <Card className="bg-gradient-card border-0 shadow-soft mt-6">
        <CardHeader>
          <CardTitle>Preferenze</CardTitle>
          <CardDescription>Personalizza la tua esperienza</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Notifications (Always Active) */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                Notifiche Email
              </Label>
              <p className="text-sm text-muted-foreground">
                Ricevi notifiche via email per gli aggiornamenti (Sempre Attivo)
              </p>
            </div>
            <Badge variant="default" className="bg-success hover:bg-success">Attivo</Badge>
          </div>
        </CardContent>
      </Card>

      {selectedImage && (
        <ImageCropDialog
          open={showCropDialog}
          onOpenChange={setShowCropDialog}
          imageSrc={selectedImage}
          onCropComplete={handleCroppedImage}
        />
      )}
    </div>
  );
};

export default ProfilePage;