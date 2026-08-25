import React from "react";
import { useLocation } from "react-router-dom";
import { Construction, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

function UnderConstruction() {
  const location = useLocation();
  const pageName = location.pathname.substring(1) || "Dashboard";
  const formattedName = pageName.charAt(0).toUpperCase() + pageName.slice(1);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center bg-background/50 backdrop-blur-xs rounded-xl border border-border/80 shadow-xs max-w-2xl mx-auto my-12 animate-fade-in">
      <div className="relative flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-accent/50 text-primary border border-border/50 animate-pulse">
        <Construction className="w-10 h-10" />
      </div>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-3 font-heading">
        {formattedName} Page
      </h1>
      <p className="text-muted-foreground text-base max-w-md mb-8 leading-relaxed">
        This section is currently under active construction. We are polishing and crafting this experience for you. Please check back soon!
      </p>
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Button 
          variant="outline" 
          onClick={() => window.history.back()}
          className="flex items-center gap-2 cursor-pointer hover:bg-accent/80 transition-colors duration-200"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </Button>
        <Button 
          variant="default"
          onClick={() => window.location.href = "/"}
          className="cursor-pointer transition-colors duration-200"
        >
          Return Home
        </Button>
      </div>
    </div>
  );
}

export default UnderConstruction;
