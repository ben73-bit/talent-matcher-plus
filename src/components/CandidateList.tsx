import { useState } from "react";
import {
  Search,
  Filter,
  Download,
  MoreVertical,
  Mail,
  Phone,
  MapPin,
  Eye,
  GripVertical,
  X
} from "lucide-react";
import { motion } from 'framer-motion';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
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
  const { candidates, loading, deleteCandidate, updateCandidate, updateCandidateOrder } = useCandidates();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [positionFilter, setPositionFilter] = useState<string>("all");
  const [experienceFilter, setExperienceFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("order");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const handleExport = () => {
    const csvContent = [
      ['Nome', 'Email', 'Telefono', 'Posizione', 'Status', 'Data'],
      ...filteredCandidates.map(c => [
        `${c.first_name} ${c.last_name}`,
        c.email,
        c.phone || '',
        c.position || '',
        c.status,
        new Date(c.created_at).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `candidati_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Esportazione completata',
      description: 'Il file CSV è stato scaricato',
    });
  };

  const filteredCandidates = candidates
    .filter(candidate => {
      const fullName = `${candidate.first_name} ${candidate.last_name}`.toLowerCase();
      const position = candidate.position?.toLowerCase() || '';
      const skills = candidate.skills || [];

      const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
                           position.includes(searchTerm.toLowerCase()) ||
                           candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === "all" || candidate.status === statusFilter;
      const matchesPosition = positionFilter === "all" || candidate.position === positionFilter;
      const matchesExperience = experienceFilter === "all" ||
        (experienceFilter === "junior" && (candidate.experience_years || 0) < 3) ||
        (experienceFilter === "mid" && (candidate.experience_years || 0) >= 3 && (candidate.experience_years || 0) < 7) ||
        (experienceFilter === "senior" && (candidate.experience_years || 0) >= 7);

      return matchesSearch && matchesStatus && matchesPosition && matchesExperience;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
        case 'recent':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'order':
        default:
          return (a.order_index || 0) - (b.order_index || 0);
      }
    });

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(filteredCandidates);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    items.forEach((item, index) => {
      updateCandidateOrder(item.id, index);
    });

    toast({
      title: 'Ordine aggiornato',
      description: 'L\'ordine dei candidati è stato salvato',
    });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setPositionFilter("all");
    setExperienceFilter("all");
    setSortBy("order");
  };

  const uniquePositions = Array.from(new Set(candidates.map(c => c.position).filter(Boolean)));

  const activeFiltersCount = [
    searchTerm,
    statusFilter !== "all" ? statusFilter : null,
    positionFilter !== "all" ? positionFilter : null,
    experienceFilter !== "all" ? experienceFilter : null
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Candidati</h1>
          <p className="text-muted-foreground">
            Gestisci e visualizza tutti i candidati ({filteredCandidates.length})
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Esporta
          </Button>
          <Button variant="outline" onClick={() => setShowAdvancedFilters(true)}>
            <Filter className="mr-2 h-4 w-4" />
            Filtri Avanzati
            {activeFiltersCount > 0 && (
              <Badge variant="destructive" className="ml-2">{activeFiltersCount}</Badge>
            )}
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-4 bg-card p-4 rounded-lg border shadow-soft flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca per nome, email, posizione o competenze..."
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
            <SelectItem value="order">Ordine personalizzato</SelectItem>
            <SelectItem value="recent">Più recenti</SelectItem>
            <SelectItem value="name">Nome</SelectItem>
          </SelectContent>
        </Select>

        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-2 h-4 w-4" />
            Cancella filtri
          </Button>
        )}
      </div>

      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {!loading && candidates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nessun candidato trovato. Aggiungi il tuo primo candidato!</p>
        </div>
      )}

      {!loading && filteredCandidates.length === 0 && candidates.length > 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nessun candidato corrisponde ai filtri selezionati.</p>
          <Button variant="outline" className="mt-4" onClick={clearFilters}>
            Cancella filtri
          </Button>
        </div>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="candidates">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="grid gap-4"
            >
              {filteredCandidates.map((candidate, index) => (
                <Draggable key={candidate.id} draggableId={candidate.id} index={index}>
                  {(provided, snapshot) => (
                    <motion.div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card
                        className={`bg-gradient-card border-0 shadow-soft hover:shadow-medium transition-smooth ${
                          snapshot.isDragging ? 'shadow-xl scale-105' : ''
                        }`}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-4 flex-1">
                              <div
                                {...provided.dragHandleProps}
                                className="mt-2 cursor-grab active:cursor-grabbing"
                              >
                                <GripVertical className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                              </div>

                              {candidate.photo_url ? (
                                <img
                                  src={candidate.photo_url}
                                  alt={`${candidate.first_name} ${candidate.last_name}`}
                                  className="h-12 w-12 rounded-full object-cover border-2 border-primary/20"
                                />
                              ) : (
                                <div className="h-12 w-12 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-medium text-lg">
                                  {candidate.first_name[0]}{candidate.last_name[0]}
                                </div>
                              )}

                              <div className="flex-1 space-y-1">
                                <div className="flex items-center space-x-3">
                                  <h3
                                    className="text-lg font-semibold text-foreground hover:text-primary transition-fast cursor-pointer"
                                    onClick={() => onViewCandidate?.(candidate.id)}
                                  >
                                    {candidate.first_name} {candidate.last_name}
                                  </h3>
                                </div>

                                <p className="text-primary font-medium">{candidate.position || 'Posizione non specificata'}</p>

                                <div className="flex items-center space-x-4 text-sm text-muted-foreground flex-wrap gap-2">
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
                                  {candidate.experience_years !== undefined && (
                                    <div className="flex items-center">
                                      <span className="font-medium">{candidate.experience_years} anni exp.</span>
                                    </div>
                                  )}
                                </div>

                                {candidate.skills && candidate.skills.length > 0 && (
                                  <div className="flex items-center space-x-2 mt-3">
                                    <span className="text-sm text-muted-foreground">Competenze:</span>
                                    <div className="flex flex-wrap gap-1">
                                      {candidate.skills.slice(0, 5).map((skill, idx) => (
                                        <Badge key={idx} variant="secondary" className="text-xs">
                                          {skill}
                                        </Badge>
                                      ))}
                                      {candidate.skills.length > 5 && (
                                        <Badge variant="outline" className="text-xs">
                                          +{candidate.skills.length - 5}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

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
                                      window.open(`mailto:${candidate.email}`, '_blank');
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
                    </motion.div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <Dialog open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filtri Avanzati</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Posizione</Label>
              <Select value={positionFilter} onValueChange={setPositionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona posizione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte le posizioni</SelectItem>
                  {uniquePositions.map(pos => (
                    <SelectItem key={pos} value={pos || ''}>{pos}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Esperienza</Label>
              <Select value={experienceFilter} onValueChange={setExperienceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona livello" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti i livelli</SelectItem>
                  <SelectItem value="junior">Junior (0-2 anni)</SelectItem>
                  <SelectItem value="mid">Mid (3-6 anni)</SelectItem>
                  <SelectItem value="senior">Senior (7+ anni)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex space-x-2">
              <Button className="flex-1" onClick={() => setShowAdvancedFilters(false)}>
                Applica Filtri
              </Button>
              <Button variant="outline" onClick={clearFilters}>
                Cancella
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
