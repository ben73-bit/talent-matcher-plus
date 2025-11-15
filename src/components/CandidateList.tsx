import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Download,
  MoreVertical,
  Mail,
  Eye,
  List,
  LayoutGrid,
  Upload,
  Trash2, // <-- Aggiunto Trash2
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useCandidates, Candidate } from "@/hooks/useCandidates";
import { useProfile } from "@/hooks/useProfile";
import { EmailModal } from "./EmailModal";
import { ImportCandidatesDialog } from "./ImportCandidatesDialog";
import { CandidateCard } from "./CandidateCard"; // Import the new card component
import { cn } from "@/lib/utils";

type ViewMode = 'table' | 'grid';

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

interface CandidateItemProps {
  candidate: Candidate;
  onViewCandidate: (candidateId: string) => void;
  deleteCandidate: (id: string) => void;
  updateCandidate: (id: string, updates: any) => void;
  emailService: string;
  onEmailClick: (candidate: Candidate) => void;
}

const CandidateItem = ({ candidate, onViewCandidate, deleteCandidate, updateCandidate, emailService, onEmailClick }: CandidateItemProps) => {
  const initials = `${candidate.first_name[0]}${candidate.last_name[0]}`.toUpperCase();

  const handleUpdateStatus = (status: Candidate['status']) => {
    updateCandidate(candidate.id, { status });
  };

  return (
    <TableRow
      key={candidate.id}
      className="cursor-pointer hover:bg-secondary/50 transition-colors"
    >
      <TableCell className="font-medium w-1/4" onClick={() => onViewCandidate(candidate.id)}>
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={candidate.photo_url || undefined} alt={initials} />
            <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{candidate.first_name} {candidate.last_name}</p>
            <p className="text-xs text-muted-foreground">{candidate.email}</p>
          </div>
        </div >
      </TableCell>
      <TableCell className="w-1/5 hidden sm:table-cell" onClick={() => onViewCandidate(candidate.id)}>
        <div className="text-sm">{candidate.position || 'N/D'}</div>
        <div className="text-xs text-muted-foreground">{candidate.company || 'N/D'}</div>
      </TableCell>
      <TableCell className="w-1/5 hidden lg:table-cell" onClick={() => onViewCandidate(candidate.id)}>
        <div className="flex flex-wrap gap-1">
          {(candidate.skills || []).slice(0, 3).map((skill, index) => (
            <Badge key={index} variant="secondary" className="text-xs px-2 py-0.5">
              {skill}
            </Badge>
          ))}
          {(candidate.skills || []).length > 3 && (
            <Badge variant="outline" className="text-xs px-2 py-0.5">
              +{(candidate.skills || []).length - 3}
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="w-1/6" onClick={() => onViewCandidate(candidate.id)}>
        {getStatusBadge(candidate.status)}
      </TableCell>
      <TableCell className="w-1/12 text-right">
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
                onViewCandidate(candidate.id);
              }}
            >
              <Eye className="mr-2 h-4 w-4" />
              Visualizza Dettagli
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onEmailClick(candidate);
              }}
            >
              <Mail className="mr-2 h-4 w-4" />
              Invia Email
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Aggiorna Stato</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleUpdateStatus('contacted')}>
              Segna come Contattato
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleUpdateStatus('interviewed')}>
              Segna come Intervistato
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleUpdateStatus('hired')}>
              Segna come Assunto
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleUpdateStatus('rejected')}>
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
              <Trash2 className="mr-2 h-4 w-4" />
              Elimina
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};

interface CandidateListProps {
  onViewCandidate: (candidateId: string) => void;
}

export const CandidateList = ({ onViewCandidate }: CandidateListProps) => {
  const { candidates, loading, deleteCandidate, updateCandidate, fetchByDatabase } = useCandidates();
  const { profile } = useProfile();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");
  const [viewMode, setViewMode] = useState<ViewMode>("grid"); // Default to grid view
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);

  useEffect(() => {
    fetchByDatabase();
  }, []);

  const handleExport = () => {
    const csvContent = [
      ['first_name', 'last_name', 'email', 'phone', 'position', 'company', 'experience_years', 'skills', 'notes', 'status', 'created_at'],
      ...candidates.map(c => [
        c.first_name,
        c.last_name,
        c.email,
        c.phone || '',
        c.position || '',
        c.company || '',
        c.experience_years || '',
        (c.skills || []).join(';'),
        c.notes || '',
        c.status,
        new Date(c.created_at).toISOString()
      ])
    ].map(row => row.map(item => `"${item}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `candidati_esportazione_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Esportazione completata',
      description: 'Il file CSV è stato scaricato',
    });
  };

  const handleEmailClick = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setShowEmailModal(true);
  };

  const handleUpdateStatus = (id: string, status: Candidate['status']) => {
    updateCandidate(id, { status });
  };

  const sortedAndFilteredCandidates = candidates
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
          const nameA = `${a.last_name} ${a.first_name}`;
          const nameB = `${b.last_name} ${b.first_name}`;
          return nameA.localeCompare(nameB);
        case 'recent':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="flex items-center justify-between"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Candidati</h1>
          <p className="text-muted-foreground">
            Gestisci e visualizza tutti i candidati ({sortedAndFilteredCandidates.length})
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => setShowImportDialog(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Importa CSV
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Esporta
          </Button>
          <Button variant="outline" onClick={() => setShowAdvancedFilters(true)}>
            <Filter className="mr-2 h-4 w-4" />
            Filtri Avanzati
          </Button>
        </div>
      </motion.div>

      <motion.div
        className="flex items-center space-x-4 bg-card p-4 rounded-lg border shadow-soft"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
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
            <SelectItem value="name">Alfabetico (A-Z)</SelectItem>
          </SelectContent>
        </Select>
        
        <ToggleGroup 
          type="single" 
          value={viewMode} 
          onValueChange={(value: ViewMode) => value && setViewMode(value)}
          className="shrink-0"
        >
          <ToggleGroupItem value="grid" aria-label="Visualizzazione Griglia" className="h-10 w-10 p-2">
            <LayoutGrid className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="table" aria-label="Visualizzazione Tabella" className="h-10 w-10 p-2">
            <List className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </motion.div>

      {loading && (
        <motion.div
          className="flex justify-center items-center py-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </motion.div>
      )}

      {!loading && candidates.length === 0 && (
        <motion.div
          className="text-center py-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-muted-foreground">Nessun candidato trovato. Aggiungi il tuo primo candidato!</p>
        </motion.div>
      )}

      {!loading && sortedAndFilteredCandidates.length > 0 && (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedAndFilteredCandidates.map((candidate) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                emailService={profile?.email_service || 'outlook'}
                onViewCandidate={onViewCandidate}
                onEmailClick={handleEmailClick}
                onDelete={deleteCandidate}
                onUpdateStatus={handleUpdateStatus}
              />
            ))}
          </div>
        ) : (
          <Card className="shadow-soft border-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                  <TableHead className="w-1/4">Candidato</TableHead>
                  <TableHead className="w-1/5 hidden sm:table-cell">Posizione/Azienda</TableHead>
                  <TableHead className="w-1/5 hidden lg:table-cell">Competenze</TableHead>
                  <TableHead className="w-1/6">Stato</TableHead>
                  <TableHead className="w-1/12 text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAndFilteredCandidates.map((candidate) => (
                  <CandidateItem
                    key={candidate.id}
                    candidate={candidate}
                    onViewCandidate={onViewCandidate}
                    deleteCandidate={deleteCandidate}
                    updateCandidate={updateCandidate}
                    emailService={profile?.email_service || 'outlook'}
                    onEmailClick={handleEmailClick}
                  />
                ))}
              </TableBody>
            </Table>
          </Card>
        )
      )}

      <Dialog open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filtri Avanzati</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">Nuovo</SelectItem>
                  <SelectItem value="contacted">Contattato</SelectItem>
                  <SelectItem value="interviewed">Intervistato</SelectItem>
                  <SelectItem value="hired">Assunto</SelectItem>
                  <SelectItem value="rejected">Rifiutato</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Posizione</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona posizione" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(new Set(candidates.map(c => c.position))).map(pos => (
                    <SelectItem key={pos} value={pos || ''}>{pos}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={() => {
              toast({ title: 'Filtri applicati', description: 'I filtri avanzati sono stati applicati' });
              setShowAdvancedFilters(false);
            }}>
              Applica Filtri
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <EmailModal
        open={showEmailModal}
        onOpenChange={setShowEmailModal}
        candidate={selectedCandidate}
        emailService={profile?.email_service || 'outlook'}
      />

      <ImportCandidatesDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
      />
    </motion.div>
  );
};