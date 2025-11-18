import { useState } from "react";
import { 
  Upload, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase,
  FileText,
  Sparkles,
  ArrowLeft,
  AlertTriangle,
  Settings, // Aggiunto Settings per l'icona
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCandidates } from "@/hooks/useCandidates";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile"; // Importato useProfile
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom"; // Importato useNavigate per reindirizzare alle impostazioni

interface AddCandidateProps {
  onBack: () => void;
}

export const AddCandidate = ({ onBack }: AddCandidateProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile } = useProfile(); // Ottieni il profilo
  const { createCandidate, candidates } = useCandidates();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [uploadedPhoto, setUploadedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [uploadedCV, setUploadedCV] = useState<File | null>(null);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [tempPhotoSrc, setTempPhotoSrc] = useState<string>("");
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [duplicateCandidates, setDuplicateCandidates] = useState<any[]>([]);
  const [pendingSubmit, setPendingSubmit] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    position: "",
    company: "",
    experience: "",
    skills: [] as string[],
    notes: "",
    // databaseId: "" Rimosso
  });

  // Check if AI keys are configured
  const isAIConfigured = !!profile?.openai_api_key || !!profile?.google_ai_api_key;

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Errore",
        description: "Per favori carica solo file immagine (JPG, PNG, WEBP)",
        variant: "destructive",
      });
      return;
    }

    // Create preview for cropping
    const reader = new FileReader();
    reader.onloadend = () => {
      setTempPhotoSrc(reader.result as string);
      setCropDialogOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (croppedBlob: Blob) => {
    // Create a File from the Blob
    const croppedFile = new File([croppedBlob], "photo.jpg", { type: "image/jpeg" });
    setUploadedPhoto(croppedFile);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(croppedFile);

    toast({
      title: "Foto ritagliata",
      description: "La foto verrà salvata quando aggiungi il candidato",
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAIConfigured) {
      toast({
        title: "Configurazione AI mancante",
        description: "Per analizzare il CV, devi configurare le chiavi API nelle Impostazioni.",
        variant: "destructive",
      });
      return;
    }
    
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
      console.log('Starting CV analysis with file:', file.name);
      
      // Create FormData to send the file
      const formDataToSend = new FormData();
      formDataToSend.append('file', file);
      
      // Call the Supabase edge function
      const { data, error } = await supabase.functions.invoke('parse-cv', {
        body: formDataToSend,
      });
      
      if (error) {
        console.error('Supabase function error:', error);
        throw new Error('Errore nella chiamata al servizio di parsing');
      }
      
      console.log('Response from parse-cv:', data);
      
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

  const checkForDuplicates = () => {
    const duplicates = candidates.filter(
      candidate => 
        candidate.first_name.toLowerCase() === formData.firstName.toLowerCase() &&
        candidate.last_name.toLowerCase() === formData.lastName.toLowerCase()
    );
    return duplicates;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Errore",
        description: "Devi essere autenticato per aggiungere candidati",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicates before submitting
    if (!pendingSubmit) {
      const duplicates = checkForDuplicates();
      if (duplicates.length > 0) {
        setDuplicateCandidates(duplicates);
        setDuplicateDialogOpen(true);
        return;
      }
    }
    
    setIsSubmitting(true);
    
    try {
      let photoUrl = "";
      let cvUrl = "";

      // Upload photo if present
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

      // Upload CV if present
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
      
      const candidate = await createCandidate({
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        position: formData.position,
        company: formData.company,
        experience_years: experienceYears,
        skills: formData.skills,
        notes: formData.notes,
        status: 'new',
        photo_url: photoUrl || undefined,
        cv_url: cvUrl || undefined,
        // database_id: formData.databaseId || undefined, Rimosso
      });
      
      if (candidate) {
        // Reset form on success
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          position: "",
          company: "",
          experience: "",
          skills: [],
          notes: "",
          // databaseId: "" Rimosso
        });
        setExtractedData(null);
        setUploadedPhoto(null);
        setPhotoPreview("");
        setUploadedCV(null);
        setPendingSubmit(false);
        
        // Go back to candidate list
        onBack();
      }
    } catch (error) {
      console.error('Error adding candidate:', error);
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Errore nell'aggiunta del candidato",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setPendingSubmit(false);
    }
  };

  const handleConfirmDuplicate = () => {
    setPendingSubmit(true);
    setDuplicateDialogOpen(false);
    // Trigger the form submission again, but this time pendingSubmit is true
    const form = document.querySelector('form');
    if (form) {
      form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
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
          <h1 className="text-3xl font-bold text-foreground">Aggiungi Candidato</h1>
          <p className="text-muted-foreground">
            Carica un CV PDF o inserisci manualmente le informazioni
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CV Upload */}
        <Card className="lg:col-span-1 bg-gradient-card border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Sparkles className="mr-2 h-5 w-5 text-primary" />
              AI CV Parser
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isAIConfigured && (
              <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg space-y-3">
                <div className="flex items-center text-destructive text-sm font-medium">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Configurazione AI Obbligatoria
                </div>
                <p className="text-sm text-destructive/90">
                  Per utilizzare l'analisi automatica del CV, devi configurare almeno una chiave API (OpenAI o Google AI) nelle impostazioni.
                </p>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => navigate('/settings')}
                  className="w-full"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Vai alle Impostazioni
                </Button>
              </div>
            )}

            <div className="text-center">
              <div className={`border-2 border-dashed rounded-lg p-8 transition-fast ${
                isAIConfigured 
                  ? 'border-border hover:border-primary/50' 
                  : 'border-muted-foreground/30 bg-muted/20 cursor-not-allowed'
              }`}>
                <Upload className={`h-12 w-12 mx-auto mb-4 ${isAIConfigured ? 'text-muted-foreground' : 'text-muted-foreground/50'}`} />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Carica CV PDF</p>
                  <p className="text-xs text-muted-foreground">
                    L'AI estrarrà automaticamente le informazioni
                  </p>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="cv-upload"
                    disabled={isProcessing || !isAIConfigured}
                  />
                  <Button
                    asChild
                    variant="outline"
                    disabled={isProcessing || !isAIConfigured}
                    className="mt-2"
                  >
                    <label htmlFor="cv-upload" className={`cursor-pointer ${!isAIConfigured ? 'opacity-50 cursor-not-allowed' : ''}`}>
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
                        Carica Foto
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
                <div className="flex space-x-2">
                  <Input
                    placeholder="Aggiungi competenza"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSkill((e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
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
                <Label htmlFor="notes">Note Aggiuntive</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Inserisci note o osservazioni..."
                  rows={4}
                />
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <Button type="button" variant="outline" onClick={onBack}>
                  Annulla
                </Button>
                <Button type="submit" className="bg-gradient-primary hover:opacity-90" disabled={isSubmitting}>
                  <User className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Aggiungendo..." : "Aggiungi Candidato"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Image Crop Dialog */}
      <ImageCropDialog
        open={cropDialogOpen}
        onOpenChange={setCropDialogOpen}
        imageSrc={tempPhotoSrc}
        onCropComplete={handleCropComplete}
      />

      {/* Duplicate Warning Dialog */}
      <AlertDialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Possibile Candidato Duplicato
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                È stato trovato un candidato con lo stesso nome e cognome nel sistema:
              </p>
              <div className="space-y-2">
                {duplicateCandidates.map((candidate) => (
                  <Card key={candidate.id} className="p-3 bg-muted/50">
                    <div className="space-y-1">
                      <p className="font-medium">
                        {candidate.first_name} {candidate.last_name}
                      </p>
                      {candidate.email && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {candidate.email}
                        </p>
                      )}
                      {candidate.phone && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {candidate.phone}
                        </p>
                      )}
                      {candidate.position && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />
                          {candidate.position}
                        </p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
              <p className="text-sm">
                Vuoi continuare comunque con l'inserimento di questo nuovo candidato?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDuplicate}>
              Continua Comunque
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Features Info */}
      <Card className="bg-primary-light border-primary/20 shadow-soft">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3 text-primary">
            <Sparkles className="h-5 w-5" />
            <div>
              <p className="font-medium">Funzionalità AI Avanzate</p>
              <p className="text-sm text-primary/80">
                Il sistema estrarrà automaticamente nome, email, competenze, esperienza e altro dal CV PDF caricato
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};