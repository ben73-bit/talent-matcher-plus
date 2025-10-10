import { useState, useEffect } from "react";
import { 
  Search, 
  Filter, 
  Download,
  MoreVertical,
  Mail,
  Phone,
  MapPin,
  Star,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCandidates, Candidate } from "@/hooks/useCandidates";
import { useAuth } from "@/hooks/useAuth";

// Status mapping for display
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


interface CandidateListProps {
  onViewCandidate?: (candidateId: string) => void;
}

export const CandidateList = ({ onViewCandidate }: CandidateListProps) => {
  const { user } = useAuth();
  const { candidates, loading, deleteCandidate, updateCandidate } = useCandidates();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");

  const filteredCandidates = candidates
    .filter(candidate => {
      const fullName = `${candidate.first_name} ${candidate.last_name}`.toLowerCase();
      const position = candidate.position?.toLowerCase() || '';
      const skills = candidate.skills || [];
      
      const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
                           position.includes(searchTerm.toLowerCase()) ||
                           skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === "all" || candidate.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
        case 'recent':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Candidati</h1>
          <p className="text-muted-foreground">
            Gestisci e visualizza tutti i candidati ({filteredCandidates.length})
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Esporta
          </Button>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filtri Avanzati
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 bg-card p-4 rounded-lg border shadow-soft">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca per nome, posizione o competenze..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtra per stato" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti gli stati</SelectItem>
            <SelectItem value="new">Nuovi</SelectItem>
            <SelectItem value="contacted">Contattati</SelectItem>
            <SelectItem value="interviewed">Intervistati</SelectItem>
            <SelectItem value="hired">Assunti</SelectItem>
            <SelectItem value="rejected">Scartati</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Ordina per" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Più recenti</SelectItem>
            <SelectItem value="name">Nome</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* No candidates message */}
      {!loading && candidates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nessun candidato trovato. Aggiungi il tuo primo candidato!</p>
        </div>
      )}

      {/* Candidates Grid */}
      <div className="grid gap-4">
        {filteredCandidates.map((candidate) => (
          <Card 
            key={candidate.id} 
            className="bg-gradient-card border-0 shadow-soft hover:shadow-medium transition-smooth cursor-pointer group"
            onClick={() => onViewCandidate?.(candidate.id)}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  {/* Avatar */}
                  <div className="h-12 w-12 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-medium text-lg">
                    {candidate.first_name[0]}{candidate.last_name[0]}
                  </div>
                  
                  {/* Main Info */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-fast">
                        {candidate.first_name} {candidate.last_name}
                      </h3>
                    </div>
                    
                    <p className="text-primary font-medium">{candidate.position || 'Posizione non specificata'}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Mail className="mr-1 h-3 w-3" />
                        {candidate.email}
                      </div>
                      {candidate.phone && (
                        <div className="flex items-center">
                          <Phone className="mr-1 h-3 w-3" />
                          {candidate.phone}
                        </div>
                      )}
                      {candidate.company && (
                        <div className="flex items-center">
                          <MapPin className="mr-1 h-3 w-3" />
                          {candidate.company}
                        </div>
                      )}
                    </div>
                    
                    {candidate.skills && candidate.skills.length > 0 && (
                      <div className="flex items-center space-x-2 mt-3">
                        <span className="text-sm text-muted-foreground">Competenze:</span>
                        <div className="flex flex-wrap gap-1">
                          {candidate.skills.slice(0, 4).map((skill, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {candidate.skills.length > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{candidate.skills.length - 4}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Right Side */}
                <div className="flex items-center space-x-4">
                  <div className="text-right space-y-2">
                    {getStatusBadge(candidate.status)}
                    <div className="text-xs text-muted-foreground">
                      {new Date(candidate.created_at).toLocaleDateString('it-IT')}
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewCandidate?.(candidate.id);
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Visualizza
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          const mailtoLink = document.createElement('a');
                          mailtoLink.href = `mailto:${candidate.email}`;
                          mailtoLink.click();
                        }}
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        Invia Email
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => updateCandidate(candidate.id, { status: 'contacted' })}>
                        Segna come Contattato
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateCandidate(candidate.id, { status: 'interviewed' })}>
                        Segna come Intervistato
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateCandidate(candidate.id, { status: 'hired' })}>
                        Segna come Assunto
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateCandidate(candidate.id, { status: 'rejected' })}>
                        Segna come Scartato
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => {
                          if (confirm('Sei sicuro di voler eliminare questo candidato?')) {
                            deleteCandidate(candidate.id);
                          }
                        }}
                      >
                        Elimina
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};