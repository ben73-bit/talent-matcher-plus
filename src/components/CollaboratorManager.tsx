import { useState, useEffect } from 'react';
import { UserPlus, Mail, Trash2, Users, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useDatabases, DatabaseCollaborator, DatabaseInvitation } from '@/hooks/useDatabases';

interface CollaboratorManagerProps {
  databaseId: string;
  isOpen: boolean;
  onClose: () => void;
  onCollaboratorChange?: () => void; // Questo viene ora chiamato quando un collaboratore viene rimosso
  refetchTrigger: number; // Nuova prop per attivare il refetch
}

export function CollaboratorManager({ databaseId, isOpen, onClose, onCollaboratorChange, refetchTrigger }: CollaboratorManagerProps) {
  const { inviteCollaborator, getCollaborators, removeCollaborator, getPendingInvitations } = useDatabases();
  const [collaborators, setCollaborators] = useState<DatabaseCollaborator[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<DatabaseInvitation[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log(`[CollaboratorManager] useEffect triggered. isOpen: ${isOpen}, databaseId: ${databaseId}, refetchTrigger: ${refetchTrigger}`);
    if (isOpen && databaseId) {
      loadData();
    } else if (!isOpen) {
      // Clear data when dialog closes
      setCollaborators([]);
      setPendingInvitations([]);
    }
  }, [isOpen, databaseId, refetchTrigger]); // Aggiungi refetchTrigger alle dipendenze

  const loadData = async () => {
    console.log(`[CollaboratorManager] Loading data for databaseId: ${databaseId}`);
    setLoading(true);
    const [collabs, invites] = await Promise.all([
      getCollaborators(databaseId),
      getPendingInvitations(databaseId)
    ]);
    console.log('[CollaboratorManager] Fetched collaborators:', collabs);
    console.log('[CollaboratorManager] Fetched pending invitations:', invites);
    setCollaborators(collabs);
    setPendingInvitations(invites);
    setLoading(false);
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;

    console.log(`[CollaboratorManager] Inviting ${inviteEmail} to database ${databaseId}`);
    const result = await inviteCollaborator(databaseId, inviteEmail);
    if (result) {
      setInviteEmail('');
      loadData(); // Ricarica i dati dopo l'invito
      console.log('[CollaboratorManager] Invitation sent, reloading data.');
    }
  };

  const handleRemoveCollaborator = async (collaboratorId: string) => {
    if (confirm('Sei sicuro di voler rimuovere questo collaboratore?')) {
      console.log(`[CollaboratorManager] Removing collaborator ${collaboratorId} from database ${databaseId}`);
      const success = await removeCollaborator(collaboratorId);
      if (success) {
        loadData(); // Ricarica i dati dopo la rimozione
        onCollaboratorChange?.(); // Notifica il genitore (DatabaseManager) di ricaricare le sue liste
        console.log('[CollaboratorManager] Collaborator removed, reloading data and notifying parent.');
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gestione Collaboratori
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Invite Section */}
          <div className="space-y-3">
            <Label htmlFor="invite-email">Invita Collaboratore</Label>
            <div className="flex gap-2">
              <Input
                id="invite-email"
                type="email"
                placeholder="username@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleInvite()}
              />
              <Button onClick={handleInvite} disabled={!inviteEmail.trim()}>
                <UserPlus className="h-4 w-4 mr-2" />
                Invita
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              L'utente riceverà una notifica in-app e potrà visualizzare i candidati (sola lettura)
            </p>
          </div>

          <Separator />

          {/* Current Collaborators */}
          <div className="space-y-3">
            <h3 className="font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Collaboratori Attivi ({collaborators.length})
            </h3>
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : collaborators.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Nessun collaboratore attivo
              </p>
            ) : (
              <div className="space-y-2">
                {collaborators.map((collaborator) => (
                  <div
                    key={collaborator.id}
                    className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {collaborator.profile?.first_name?.[0] || 
                           collaborator.profile?.email?.[0]?.toUpperCase() || 
                           'U'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {collaborator.profile?.first_name && collaborator.profile?.last_name
                            ? `${collaborator.profile.first_name} ${collaborator.profile.last_name}`
                            : collaborator.profile?.email || 'Utente'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {collaborator.profile?.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {collaborator.role === 'viewer' ? 'Visualizzatore' : collaborator.role}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveCollaborator(collaborator.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Invitations */}
          {pendingInvitations.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Inviti in Attesa ({pendingInvitations.length})
                </h3>
                <div className="space-y-2">
                  {pendingInvitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg border border-dashed"
                    >
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{invitation.invited_username}</p>
                          <p className="text-xs text-muted-foreground">
                            Inviato {new Date(invitation.created_at).toLocaleDateString('it-IT')}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        In attesa
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}