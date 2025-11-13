import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Sidebar } from "@/components/Sidebar";
import { Dashboard } from "@/components/Dashboard";
import { CandidateList } from "@/components/CandidateList";
import { AddCandidate } from "@/components/AddCandidate";
import { EditCandidate } from "@/components/EditCandidate";
import { CandidateDetailsDialog } from "@/components/CandidateDetailsDialog";
import { ScheduleInterview } from "@/components/ScheduleInterview";
import { PositionManager } from "@/components/PositionManager"; // Import PositionManager
import { useAuth } from "@/hooks/useAuth";
import { useCandidates } from "@/hooks/useCandidates";
import { useJobPositions } from "@/hooks/useJobPositions";
import { Button } from "@/components/ui/button";
import { Building2, LogIn } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { getCandidateById, candidates } = useCandidates();
  const { positions } = useJobPositions();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCandidateId, setEditingCandidateId] = useState<string | null>(null);
  // const [selectedDatabaseId, setSelectedDatabaseId] = useState<string | null>(null); // Rimosso

  const handleViewCandidate = (candidateId: string) => {
    console.log('Viewing candidate:', candidateId);
    console.log('Available candidates:', candidates.map(c => c.id));
    setSelectedCandidateId(candidateId);
    setDialogOpen(true);
  };

  const handleEditCandidate = (candidateId: string) => {
    setEditingCandidateId(candidateId);
    setActiveTab("edit-candidate");
    setDialogOpen(false);
  };

  const handleSaveEdit = () => {
    setEditingCandidateId(null);
    setActiveTab("candidates");
  };

  const selectedCandidate = selectedCandidateId ? getCandidateById(selectedCandidateId) : null;
  const editingCandidate = editingCandidateId ? getCandidateById(editingCandidateId) : null;
  
  console.log('Selected candidate ID:', selectedCandidateId);
  console.log('Selected candidate:', selectedCandidate);

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <div className="bg-gradient-primary p-3 rounded-lg">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">TalentHub</h1>
          </div>
          <p className="text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="bg-gradient-primary p-3 rounded-lg">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">TalentHub</h1>
            </div>
            <p className="text-muted-foreground">
              Accedi per gestire i tuoi candidati e posizioni lavorative
            </p>
          </div>
          <Button 
            onClick={() => navigate('/auth')}
            className="w-full"
            size="lg"
          >
            <LogIn className="mr-2 h-5 w-5" />
            Accedi
          </Button>
        </div>
      </div>
    );
  }

  const handleTabChange = (tab: string) => {
    if (tab === 'settings') {
      navigate('/settings');
    } else if (tab === 'profile') {
      navigate('/profile');
    } else {
      setActiveTab(tab);
    }
  };

  // const handleViewDatabaseCandidates = (databaseId: string) => { // Rimosso
  //   setSelectedDatabaseId(databaseId);
  //   setActiveTab("candidates");
  // };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard onNavigate={setActiveTab} />;
      // case "databases": // Rimosso
      //   return <DatabaseManager onViewCandidates={handleViewDatabaseCandidates} />;
      case "candidates":
        return (
          <CandidateList 
            onViewCandidate={handleViewCandidate} 
            // filterDatabaseId={selectedDatabaseId} // Rimosso
            // onClearFilter={() => setSelectedDatabaseId(null)} // Rimosso
          />
        );
      case "add-candidate":
        return <AddCandidate onBack={() => setActiveTab("candidates")} />;
      case "edit-candidate":
        return editingCandidate ? (
          <EditCandidate 
            candidate={editingCandidate} 
            onBack={() => setActiveTab("candidates")} 
            onSave={handleSaveEdit}
          />
        ) : null;
      case "positions":
        return <PositionManager />; // Render the new component
      case "interviews":
        return <ScheduleInterview onBack={() => setActiveTab("dashboard")} />;
      case "reports":
        return (
          <div className="flex items-center justify-center h-96">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-foreground">Report</h2>
              <p className="text-muted-foreground">Funzionalità in arrivo...</p>
            </div>
          </div>
        );
      case "templates":
        return (
          <div className="flex items-center justify-center h-96">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-foreground">Template</h2>
              <p className="text-muted-foreground">Funzionalità in arrivo...</p>
            </div>
          </div>
        );
      default:
        return <Dashboard onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <Navigation onProfileClick={() => navigate('/profile')} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          activeTab={activeTab} 
          onTabChange={handleTabChange}
          candidatesCount={candidates.length}
          positionsCount={positions.length}
        />
        <main className="flex-1 overflow-auto p-6">
          {renderContent()}
        </main>
      </div>
      <CandidateDetailsDialog 
        candidate={selectedCandidate}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onEdit={handleEditCandidate}
      />
    </div>
  );
};

export default Index;