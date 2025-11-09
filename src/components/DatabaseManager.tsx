import { useState, useEffect } from 'react';
import { Plus, Database as DatabaseIcon, Users, Settings, Trash2, Share2, FileUser } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useDatabases } from '@/hooks/useDatabases';
import { CollaboratorManager } from './CollaboratorManager';

interface DatabaseManagerProps {
  onViewCandidates?: (databaseId: string) => void;
}

export function DatabaseManager({ onViewCandidates }: DatabaseManagerProps) {
  const { ownDatabases, sharedDatabases, loading, createDatabase, deleteDatabase, getCandidateCount, refetch } = useDatabases();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedDatabase, setSelectedDatabase] = useState<string | null>(null);
  const [newDatabaseName, setNewDatabaseName] = useState('');
  const [newDatabaseDescription, setNewDatabaseDescription] = useState('');
  const [candidateCounts, setCandidateCounts] = useState<Record<string, number>>({});
  const [collaboratorManagerKey, setCollaboratorManagerKey] = useState(0); // Nuovo stato per forzare il remount

  const handleCreateDatabase = async () => {
    if (!newDatabaseName.trim()) return;

    await createDatabase(newDatabaseName, newDatabaseDescription);
    setNewDatabaseName('');
    setNewDatabaseDescription('');
    setShowCreateDialog(false);
  };

  const handleDeleteDatabase = async (id: string) => {
    if (confirm('Sei sicuro di voler eliminare questo database? Tutti i candidati associati verranno eliminati.')) {
      await deleteDatabase(id);
    }
  };

  useEffect(() => {
    const loadCandidateCounts = async () => {
      const allDatabases = [...ownDatabases, ...sharedDatabases];
      const counts: Record<string, number> = {};
      
      await Promise.all(
        allDatabases.map(async (db) => {
          const count = await getCandidateCount(db.id);
          counts[db.id] = count;
        })
      );
      
      setCandidateCounts(counts);
    };

    if (!loading) {
      loadCandidateCounts();
    }
  }, [ownDatabases, sharedDatabases, loading]);

  // Incrementa la chiave quando ownDatabases cambia per forzare il remount di CollaboratorManager
  useEffect(() => {
    setCollaboratorManagerKey(prev => prev + 1);
  }, [ownDatabases]);

  // Funzione per gestire il cambiamento dei collaboratori e attivare il refetch
  const handleCollaboratorChange = () => {
    refetch(); // Chiama il refetch principale da useDatabases
    setCollaboratorManagerKey(prev => prev + 1); // Incrementa per attivare il remount di CollaboratorManager
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">I miei Database</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Organizza i tuoi candidati in database separati
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nuovo Database
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crea Nuovo Database</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Database *</Label>
                <Input
                  id="name"
                  placeholder="es. Sviluppatori Senior"
                  value={newDatabaseName}
                  onChange={(e) => setNewDatabaseName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrizione</Label>
                <Textarea
                  id="description"
                  placeholder="Breve descrizione del database..."
                  value={newDatabaseDescription}
                  onChange={(e) => setNewDatabaseDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Annulla
                </Button>
                <Button onClick={handleCreateDatabase} disabled={!newDatabaseName.trim()}>
                  Crea Database
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Own Databases */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ownDatabases.map((database) => (
          <Card key={database.id} className="hover:shadow-md transition-all">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <DatabaseIcon className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{database.name}</CardTitle>
                </div>
                <Badge variant="secondary" className="text-xs">
                  Proprietario
                </Badge>
              </div>
              {database.description && (
                <CardDescription className="text-sm line-clamp-2">
                  {database.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <FileUser className="h-4 w-4" />
                <span>{candidateCounts[database.id] || 0} candidati</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setSelectedDatabase(database.id)}
                >
                  <Share2 className="h-3 w-3 mr-1" />
                  Gestisci
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteDatabase(database.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {ownDatabases.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DatabaseIcon className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground text-center mb-4">
              Non hai ancora creato nessun database
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crea il tuo primo database
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Shared Databases */}
      {sharedDatabases.length > 0 && (
        <>
          <div className="pt-6">
            <h3 className="text-xl font-semibold text-foreground mb-4">
              Database Condivisi con Me
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sharedDatabases.map((database) => (
                <Card key={database.id} className="hover:shadow-md transition-all bg-secondary/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">{database.name}</CardTitle>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {database.role === 'viewer' ? 'Visualizzatore' : database.role}
                      </Badge>
                    </div>
                    {database.description && (
                      <CardDescription className="text-sm line-clamp-2">
                        {database.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileUser className="h-4 w-4" />
                      <span>{candidateCounts[database.id] || 0} candidati</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => onViewCandidates?.(database.id)}
                    >
                      Visualizza Candidati
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Collaborator Manager Dialog */}
      {selectedDatabase && (
        <CollaboratorManager
          key={collaboratorManagerKey} {/* Usa la chiave per forzare il remount */}
          databaseId={selectedDatabase}
          isOpen={!!selectedDatabase}
          onClose={() => setSelectedDatabase(null)}
          onCollaboratorChange={handleCollaboratorChange}
          // refetchTrigger={collaboratorRefetchTrigger} // Non più necessario con la chiave
        />
      )}
    </div>
  );
}