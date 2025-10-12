import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Sidebar } from "@/components/Sidebar";
import { Dashboard } from "@/components/Dashboard";
import { CandidateList } from "@/components/CandidateList";
import { AddCandidate } from "@/components/AddCandidate";
import { CandidateDetailsDialog } from "@/components/CandidateDetailsDialog";
import { useAuth } from "@/hooks/useAuth";
import { useCandidates } from "@/hooks/useCandidates";
import { Button } from "@/components/ui/button";
import { Building2, LogIn } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { getCandidateById, candidates } = useCandidates();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleViewCandidate = (candidateId: string) => {
    console.log('Viewing candidate:', candidateId);
    console.log('Available candidates:', candidates.map(c => c.id));
    setSelectedCandidateId(candidateId);
    setDialogOpen(true);
  };

  const selectedCandidate = selectedCandidateId ? getCandidateById(selectedCandidateId) : null;
  
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

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard onNavigate={setActiveTab} />;
      case "candidates":
        return <CandidateList onViewCandidate={handleViewCandidate} />;
      case "add-candidate":
        return <AddCandidate onBack={() => setActiveTab("candidates")} />;
      case "positions":
        return (
          <div className="flex items-center justify-center h-96">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-foreground">Posizioni</h2>
              <p className="text-muted-foreground">Funzionalità in arrivo...</p>
            </div>
          </div>
        );
      case "interviews":
        return (
          <div className="flex items-center justify-center h-96">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-foreground">Colloqui</h2>
              <p className="text-muted-foreground">Funzionalità in arrivo...</p>
            </div>
          </div>
        );
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
      case "settings":
        return (
          <div className="flex items-center justify-center h-96">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-foreground">Impostazioni</h2>
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
      <Navigation />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          candidatesCount={candidates.length}
        />
        <main className="flex-1 overflow-auto p-6">
          {renderContent()}
        </main>
      </div>
      <CandidateDetailsDialog 
        candidate={selectedCandidate}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
};

export default Index;
