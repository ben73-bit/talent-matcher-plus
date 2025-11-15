import { useState, useEffect } from "react";
import { 
  Upload, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase,
  FileText,
  Sparkles,
  ArrowLeft
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ImageCropDialog } from "@/components/ImageCropDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCandidates, Candidate } from "@/hooks/useCandidates";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface EditCandidateProps {
  candidate: Candidate;
  onBack: () => void;
  onSave: () => void;
}

export const EditCandidate = ({ candidate, onBack, onSave }: EditCandidateProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { updateCandidate } = useCandidates();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [uploadedPhoto, setUploadedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>(candidate.photo_url || "");
  const [uploadedCV, setUploadedCV] = useState<File | null>(null);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [tempPhotoSrc, setTempPhotoSrc] = useState<string>("");
  const [formData, setFormData] = useState({
    firstName: candidate.first_name,
    lastName: candidate.last_name,
    email: candidate.email,
    phone: candidate.phone || "",
    position: candidate.position || "",
    company: candidate.company || "",
    experience: candidate.experience_years ? `${candidate.experience_years}+ anni` : "",
    skills: candidate.skills || [],
    notes: candidate.notes || "",
    // databaseId: candidate.database_id || "" Rimosso
  });

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Errore",
        description: "Per favore carica solo file immagine (JPG, PNG, WEBP)",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setTempPhotoSrc(reader.result as string);
      setCropDialogOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (croppedBlob: Blob) => {
    const croppedFile = new File([croppedBlob], "photo.jpg", { type: "image/jpeg" });
    setUploadedPhoto(croppedFile);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(croppedFile);

    toast({
      title: "Foto ritagliata",
      description: "La foto verrà salvata quando salvi le modifiche",
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: "Errore",
        description: "Per favore carica solo file PDF",
        variant: "destructive",
      });
      return;
    }

    setUploadedCV(file);
    setIsProcessing(true);
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('file', file);
      
      const { data, error } = await supabase.functions.invoke('parse-cv', {
        body: formDataToSend,
      });
      
      if (error) {
        throw new Error('Errore nella chiamata al servizio di parsing');
      }
      
      if (!data.success) {
        throw new Error(data.error || 'Errore nell\'analisi del CV');
      }
      
      const extractedData = data.data;
      setExtractedData(extractedData);
      setFormData(prev => ({ ...prev, ...extractedData }));
      
      toast({
        title: "CV Analizzato",
        description: "Le informazioni sono state estratte automaticamente dal CV",
      });
      
    } catch (error) {
      console.error('Error parsing CV:', error);
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Errore nell'analisi del CV",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Errore",
        description: "Devi essere autenticato per modificare candidati",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      let photoUrl = candidate.photo_url || "";
      let cvUrl = candidate.cv_url || "";

      // Upload new photo if changed
      if (uploadedPhoto) {
        const photoFileName = `${user.id}/${Date.now()}_${uploadedPhoto.name}`;
        const { data: photoData, error: photoError } = await supabase.storage
          .from('candidate-photos')
          .upload(photoFileName, uploadedPhoto);

        if (photoError) throw photoError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('candidate-photos')
          .getPublicUrl(photoFileName);
        
        photoUrl = publicUrl;
      }

      // Upload new CV if changed
      if (uploadedCV) {
        const cvFileName = `${user.id}/${Date.now()}_${uploadedCV.name}`;
        const { data: cvData, error: cvError } = await supabase.storage
          .from('candidate-cvs')
          .upload(cvFileName, uploadedCV);

        if (cvError) throw cvError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('candidate-cvs')
          .getPublicUrl(cvFileName);
        
        cvUrl = publicUrl;
      }

      // Convert experience to years number
      const experienceYears = formData.experience ? 
        parseInt(formData.experience.split(' ')[0]) || 0 : 0;
      
      await updateCandidate(candidate.id, {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        position: formData.position,
        company: formData.company,
        experience_years: experienceYears,
        skills: formData.skills,
        notes: formData.notes,
        photo_url: photoUrl || undefined,
        cv_url: cvUrl || undefined,
        // database_id: null, // Rimosso l'assegnazione esplicita
      });
      
      toast({
        title: "Candidato aggiornato",
        description: "Le modifiche sono state salvate con successo",
      });

      onSave();
    } catch (error) {
      console.error('Error updating candidate:', error);
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Errore nell'aggiornamento del candidato",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addSkill = (skill: string) => {
    if (skill && !formData.skills.includes(skill)) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }));
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Modifica Candidato</h1>
          <p className="text-muted-foreground">
            Aggiorna le informazioni del candidato
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CV Upload */}
        <Card className="lg:col-span-1 bg-gradient-card border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Sparkles className="mr-2 h-5 w-5 text-primary" />
              Aggiorna CV
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="border-2 border-dashed border-border rounded-lg p-8 hover:border-primary/50 transition-fast">
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Carica Nuovo CV PDF</p>
                  <p className="text-xs text-muted-foreground">
                    L'AI estrarrà automaticamente le informazioni
                  </p>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="cv-upload"
                    disabled={isProcessing}
                  />
                  <Button
                    asChild
                    variant="outline"
                    disabled={isProcessing}
                    className="mt-2"
                  >
                    <label htmlFor="cv-upload" className="cursor-pointer">
                      {isProcessing ? "Elaborazione..." : "Seleziona File"}
                    </label>
                  </Button>
                </div>
              </div>
            </div>

            {isProcessing && (
              <div className="text-center space-y-3">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-sm text-muted-foreground">
                  Analizzando il CV con AI...
                </p>
              </div>
            )}

            {extractedData && (
              <div className="space-y-3 p-4 bg-success-light/50 rounded-lg border border-success/20">
                <div className="flex items-center text-success text-sm font-medium">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Dati estratti automaticamente
                </div>
                <div className="text-xs text-muted-foreground">
                  Verifica e modifica i dati se necessario nel form accanto
                </div>
              </div>
            )}

            {candidate.cv_url && !uploadedCV && (
              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  CV attuale: <span className="text-foreground font-medium">Già caricato</span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Form */}
        <Card className="lg:col-span-2 bg-gradient-card border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5 text-primary" />
              Informazioni Candidato
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Photo Upload */}
              <div className="space-y-2">
                <Label>Foto Candidato</Label>
                <div className="flex items-center space-x-4">
                  {photoPreview ? (
                    <img 
                      src={photoPreview} 
                      alt="Anteprima foto"
                      className="h-20 w-20 rounded-full object-cover border-2 border-primary/20"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center">
                      <User className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="photo-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      asChild
                    >
                      <label htmlFor="photo-upload" className="cursor-pointer">
                        {photoPreview ? "Cambia Foto" : "Carica Foto"}
                      </label>
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, PNG o WEBP (max 5MB)
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nome</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Cognome</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefono</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Azienda</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                    placeholder="Nome azienda"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="position">Posizione Ricercata</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="experience">Esperienza</Label>
                  <Select 
                    value={formData.experience}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, experience: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona esperienza" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-1 anni">0-1 anni</SelectItem>
                      <SelectItem value="1-3 anni">1-3 anni</SelectItem>
                      <SelectItem value="3-5 anni">3-5 anni</SelectItem>
                      <SelectItem value="5+ anni">5+ anni</SelectItem>
                      <SelectItem value="10+ anni">10+ anni</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Competenze</Label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.skills.map((skill, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => removeSkill(skill)}
                    >
                      {skill} ×
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Aggiungi competenza"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSkill(e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      addSkill(input.value);
                      input.value = '';
                    }}
                  >
                    Aggiungi
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Note</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Note aggiuntive sul candidato..."
                  rows={4}
                />
              </div>

              {/* Rimosso: Database Selection */}
              {/* <div className="space-y-2">
                <Label htmlFor="database">Database (Opzionale)</Label>
                <Select 
                  value={formData.databaseId || "none"}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, databaseId: value === "none" ? "" : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona un database" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nessun database</SelectItem>
                    {ownDatabases.map((db) => (
                      <SelectItem key={db.id} value={db.id}>
                        {db.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Assegna il candidato a un database per condividerlo con i collaboratori
                </p>
              </div> */}

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? "Salvataggio..." : "Salva Modifiche"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  disabled={isSubmitting}
                >
                  Annulla
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <ImageCropDialog
        open={cropDialogOpen}
        onOpenChange={setCropDialogOpen}
        imageSrc={tempPhotoSrc}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
};