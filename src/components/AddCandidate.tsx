import { useState } from "react";
import {
  Upload,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  FileText,
  ArrowLeft,
  AlertTriangle,
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
import { supabase } from "@/integrations/supabase/client";

interface AddCandidateProps {
  onBack: () => void;
}

export const AddCandidate = ({ onBack }: AddCandidateProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { createCandidate, candidates } = useCandidates();
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    company: "",
    experience: "",
    skills: [] as string[],
    notes: "",
  });

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

  const handleCVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: "Errore",
        description: "Per favori carica solo file PDF",
        variant: "destructive",
      });
      return;
    }

    setUploadedCV(file);
    toast({
      title: "CV Selezionato",
      description: "Il file verrà caricato al salvataggio del candidato",
    });
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
        // position removed
        company: formData.company,
        experience_years: experienceYears,
        skills: formData.skills,
        notes: formData.notes,
        status: 'new',
        photo_url: photoUrl || undefined,
        cv_url: cvUrl || undefined,
      });

      if (candidate) {
        // Reset form on success
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          company: "",
          experience: "",
          skills: [],
          notes: "",
        });

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

      <div className="max-w-4xl mx-auto">

        {/* Form */}
        <Card className="bg-gradient-card border-0 shadow-soft">
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

              <div className="space-y-2">
                <Label>Curriculum Vitae (PDF)</Label>
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleCVUpload}
                      className="hidden"
                      id="cv-upload-manual"
                    />
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        asChild
                      >
                        <label htmlFor="cv-upload-manual" className="cursor-pointer flex items-center">
                          <FileText className="mr-2 h-4 w-4" />
                          {uploadedCV ? "Cambia CV" : "Carica CV"}
                        </label>
                      </Button>
                      {uploadedCV && (
                        <span className="text-sm text-muted-foreground flex items-center">
                          {uploadedCV.name}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="ml-2 h-6 w-6 p-0 text-destructive"
                            onClick={() => setUploadedCV(null)}
                          >
                            ×
                          </Button>
                        </span>
                      )}
                    </div>
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
                  <Label htmlFor="experience">Esperienza</Label>
                  <Select
                    value={formData.experience}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, experience: value }))}
                  >
                    <SelectTrigger id="experience">
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
                <Label>Competenze Chiave</Label>
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
    </div>
  );
};