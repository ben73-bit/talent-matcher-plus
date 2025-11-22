import { Mail, Briefcase, Eye, Trash2, MoreVertical, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Candidate } from '@/hooks/useCandidates';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface CandidateCardProps {
  candidate: Candidate;
  emailService: string;
  onViewCandidate: (candidateId: string) => void;
  onEmailClick: (candidate: Candidate) => void;
  onDelete: (candidateId: string) => void;
  onUpdateStatus: (candidateId: string, status: Candidate['status']) => void;
  isDragEnabled?: boolean;
}

const getStatusBadge = (status: Candidate['status']) => {
  const statusMap = {
    new: { label: 'Nuovo', className: 'bg-secondary text-secondary-foreground' },
    contacted: { label: 'Contattato', className: 'bg-warning text-warning-foreground hover:bg-warning/80' },
    interviewed: { label: 'Colloquio', className: 'border border-primary text-primary bg-transparent hover:bg-primary/10' },
    hired: { label: 'Assunto', className: 'bg-success text-success-foreground hover:bg-success/80' },
    rejected: { label: 'Scartato', className: 'bg-destructive text-destructive-foreground hover:bg-destructive/80' }
  };

  const config = statusMap[status];
  return (
    <Badge className={`text-xs px-2 py-0.5 ${config.className}`}>
      {config.label}
    </Badge>
  );
};

export const CandidateCard = ({ 
  candidate, 
  emailService, 
  onViewCandidate, 
  onEmailClick, 
  onDelete,
  onUpdateStatus,
  isDragEnabled = false
}: CandidateCardProps) => {
  const initials = `${candidate.first_name[0]}${candidate.last_name[0]}`.toUpperCase();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: candidate.id,
    disabled: !isDragEnabled
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragEnabled ? 'grab' : 'default',
    zIndex: isDragging ? 999 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className={`shadow-soft hover:shadow-medium transition-shadow flex flex-col h-full ${isDragging ? 'ring-2 ring-primary' : ''}`}>
        <CardContent className="p-4 flex flex-col items-center text-center space-y-3 flex-1">
          <div className="relative w-full flex justify-center">
            <Avatar className="h-16 w-16 border-2 border-primary/20">
              <AvatarImage src={candidate.photo_url || undefined} alt={initials} />
              <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="absolute top-0 right-0">
              {getStatusBadge(candidate.status)}
            </div>
          </div>

          <div className="flex-1">
            <h4 className="font-semibold text-lg line-clamp-1">{candidate.first_name} {candidate.last_name}</h4>
            <p className="text-sm text-primary font-medium line-clamp-1">{candidate.position || 'Posizione non specificata'}</p>
            <p className="text-xs text-muted-foreground line-clamp-1">{candidate.company || candidate.email}</p>
          </div>

          <div className="flex flex-wrap justify-center gap-1 pt-2 w-full">
            {(candidate.skills || []).slice(0, 3).map((skill, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="text-xs px-2 py-0.5 max-w-[calc(50%-4px)] truncate"
              >
                {skill}
              </Badge>
            ))}
            {(candidate.skills || []).length > 3 && (
              <Badge variant="outline" className="text-xs px-2 py-0.5 shrink-0">
                +{(candidate.skills || []).length - 3}
              </Badge>
            )}
          </div>
        </CardContent>
        
        <div 
          className="p-3 border-t border-border/50 flex gap-2"
          onPointerDown={(e) => e.stopPropagation()} // Prevent drag when interacting with buttons
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <Button 
            variant="outline" 
            size="icon" 
            className="flex-1"
            onClick={() => onViewCandidate(candidate.id)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            className="flex-1"
            onClick={() => onEmailClick(candidate)}
          >
            <Mail className="h-4 w-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="flex-1">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewCandidate(candidate.id)}>
                <Eye className="mr-2 h-4 w-4" />
                Visualizza Dettagli
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEmailClick(candidate)}>
                <Mail className="mr-2 h-4 w-4" />
                Invia Email
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Aggiorna Stato</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onUpdateStatus(candidate.id, 'contacted')}>
                Segna come Contattato
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onUpdateStatus(candidate.id, 'interviewed')}>
                Segna come Intervistato
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onUpdateStatus(candidate.id, 'hired')}>
                Segna come Assunto
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onUpdateStatus(candidate.id, 'rejected')}>
                Segna come Scartato
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive"
                onClick={() => {
                  if (confirm('Sei sicuro di voler eliminare questo candidato?')) {
                    onDelete(candidate.id);
                  }
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Elimina
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Card>
    </div>
  );
};