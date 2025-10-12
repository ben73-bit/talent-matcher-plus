import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, Briefcase, Calendar, User, FileText, Download, Pencil } from "lucide-react";
import { Candidate } from "@/hooks/useCandidates";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CandidateDetailsDialogProps {
  candidate: Candidate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (candidateId: string) => void;
}

const getStatusBadge = (status: Candidate['status']) => {
  const statusMap = {
    new: { label: 'Nuovo', variant: 'secondary' as const },
    contacted: { label: 'Contattato', variant: 'default' as const },
    interviewed: { label: 'Colloquio', variant: 'outline' as const },
    hired: { label: 'Assunto', variant: 'default' as const },
    rejected: { label: 'Scartato', variant: 'destructive' as const }
  };
  
  const config = statusMap[status];
  return (
    <Badge variant={config.variant} className={
      status === 'hired' ? 'bg-success text-success-foreground' :
      status === 'contacted' ? 'bg-warning text-warning-foreground' : ''
    }>
      {config.label}
    </Badge>
  );
};

export const CandidateDetailsDialog = ({ candidate, open, onOpenChange, onEdit }: CandidateDetailsDialogProps) => {
  const { toast } = useToast();

  if (!candidate) return null;

  const handleDownloadCV = async () => {
    if (!candidate.cv_url) {
      toast({
        title: "CV non disponibile",
        description: "Nessun CV caricato per questo candidato",
        variant: "destructive",
      });
      return;
    }

    try {
      // Extract the file path from the full URL
      const urlParts = candidate.cv_url.split('/candidate-cvs/');
      if (urlParts.length < 2) {
        throw new Error('URL del CV non valido');
      }
      const filePath = urlParts[1];

      // Download the file from storage
      const { data, error } = await supabase.storage
        .from('candidate-cvs')
        .download(filePath);

      if (error) throw error;

      if (data) {
        // Create a blob URL and trigger download
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = `CV_${candidate.first_name}_${candidate.last_name}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Download completato",
          description: "Il CV è stato scaricato con successo",
        });
      }
    } catch (error) {
      console.error('Error downloading CV:', error);
      toast({
        title: "Errore",
        description: "Impossibile scaricare il CV",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              {candidate.photo_url ? (
                <img 
                  src={candidate.photo_url} 
                  alt={`${candidate.first_name} ${candidate.last_name}`}
                  className="h-16 w-16 rounded-full object-cover border-2 border-primary/20"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-medium text-2xl">
                  {candidate.first_name[0]}{candidate.last_name[0]}
                </div>
              )}
              <div>
                <DialogTitle className="text-2xl">
                  {candidate.first_name} {candidate.last_name}
                </DialogTitle>
                <p className="text-primary font-medium mt-1">{candidate.position || 'Posizione non specificata'}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              {getStatusBadge(candidate.status)}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Pulsanti Azioni */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleDownloadCV}
                className="gap-2"
                disabled={!candidate.cv_url}
              >
                <Download className="h-4 w-4" />
                {candidate.cv_url ? 'Scarica CV' : 'Nessun CV'}
              </Button>
              {onEdit && (
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => onEdit(candidate.id)}
                  className="gap-2"
                >
                  <Pencil className="h-4 w-4" />
                  Modifica
                </Button>
              )}
            </div>
            <Separator />
          </div>

          {/* Profilo Professionale */}
          {candidate.position && (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center">
                <Briefcase className="mr-2 h-5 w-5 text-primary" />
                Profilo Professionale
              </h3>
              <Separator />
              <p className="text-sm">{candidate.position}</p>
            </div>
          )}

          {/* Informazioni di Contatto */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center">
              <User className="mr-2 h-5 w-5 text-primary" />
              Informazioni di Contatto
            </h3>
            <Separator />
            <div className="grid gap-3">
              <div className="flex items-center space-x-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground min-w-[80px]">Email:</span>
                <a href={`mailto:${candidate.email}`} className="text-primary hover:underline">
                  {candidate.email}
                </a>
              </div>
              {candidate.phone && (
                <div className="flex items-center space-x-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground min-w-[80px]">Telefono:</span>
                  <a href={`tel:${candidate.phone}`} className="text-primary hover:underline">
                    {candidate.phone}
                  </a>
                </div>
              )}
              {candidate.company && (
                <div className="flex items-center space-x-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground min-w-[80px]">Azienda:</span>
                  <span>{candidate.company}</span>
                </div>
              )}
            </div>
          </div>

          {/* Esperienza Professionale */}
          {candidate.experience_years !== null && candidate.experience_years !== undefined && (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center">
                <Calendar className="mr-2 h-5 w-5 text-primary" />
                Esperienze Principali
              </h3>
              <Separator />
              <div className="bg-muted/30 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{candidate.experience_years} {candidate.experience_years === 1 ? 'anno' : 'anni'}</span>
                  <span className="text-sm text-muted-foreground">di esperienza professionale</span>
                </div>
              </div>
            </div>
          )}

          {/* Competenze Chiave */}
          {candidate.skills && candidate.skills.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center">
                <FileText className="mr-2 h-5 w-5 text-primary" />
                Competenze Chiave
              </h3>
              <Separator />
              <div className="flex flex-wrap gap-2">
                {candidate.skills.map((skill, index) => (
                  <Badge key={index} variant="secondary" className="text-sm px-3 py-1">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Note Aggiuntive */}
          {candidate.notes && (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center">
                <FileText className="mr-2 h-5 w-5 text-primary" />
                Note Aggiuntive
              </h3>
              <Separator />
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{candidate.notes}</p>
              </div>
            </div>
          )}

          {/* Data di Creazione */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center">
              <Calendar className="mr-2 h-5 w-5 text-primary" />
              Informazioni Sistema
            </h3>
            <Separator />
            <div className="text-sm space-y-2">
              <div>
                <span className="text-muted-foreground">Candidatura ricevuta:</span>
                <span className="ml-2 font-medium">
                  {new Date(candidate.created_at).toLocaleDateString('it-IT', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Ultimo aggiornamento:</span>
                <span className="ml-2 font-medium">
                  {new Date(candidate.updated_at).toLocaleDateString('it-IT', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
