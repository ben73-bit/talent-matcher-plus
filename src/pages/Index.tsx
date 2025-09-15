import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Sidebar } from "@/components/Sidebar";
import { Dashboard } from "@/components/Dashboard";
import { CandidateList } from "@/components/CandidateList";
import { AddCandidate } from "@/components/AddCandidate";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "candidates":
        return <CandidateList onViewCandidate={(id) => console.log("View candidate", id)} />;
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
        return <Dashboard />;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <Navigation />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-1 overflow-auto p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Index;
