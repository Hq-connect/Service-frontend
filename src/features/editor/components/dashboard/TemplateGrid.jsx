import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TEMPLATES } from "../../constants/templates";

export default function TemplateGrid({ createDocument, onSelectTemplate }) {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);

  const handleSelect = async (tmpl) => {
    if (isCreating) return;

    if (onSelectTemplate) {
      onSelectTemplate(tmpl);
      return;
    }

    if (createDocument) {
      try {
        setIsCreating(true);
        const newDoc = await createDocument({
          title: tmpl.title === "Blank Document" ? "Untitled" : tmpl.title,
          icon: tmpl.icon,
          content: tmpl.content,
        });
        if (newDoc?._id) {
          navigate(`/docs/${newDoc._id}`);
        }
      } catch (err) {
        console.error("Failed to create document from template:", err);
      } finally {
        setIsCreating(false);
      }
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="size-3.5 text-foreground" />
          <span>Quick Start Blueprints</span>
          {isCreating && <Loader2 className="size-3 animate-spin text-primary ml-1" />}
        </h2>
        <span className="text-[11px] text-muted-foreground">
          Click any blueprint to initialize a pre-structured document
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {TEMPLATES.map((tmpl, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSelect(tmpl)}
            className="group text-left flex flex-col justify-between rounded-xl border border-border bg-card text-card-foreground shadow-(--shadow-card) hover:border-foreground/25 hover:-translate-y-0.5 transition-all duration-150 overflow-hidden cursor-pointer"
          >
            <div className="p-4 space-y-2.5 w-full">
              <div className="flex items-center justify-between gap-2">
                <div className="size-9 rounded-lg bg-muted/70 border border-border flex items-center justify-center text-lg shadow-2xs">
                  {tmpl.icon}
                </div>
                <Badge variant="outline" className="text-[10px] font-mono h-4 px-1.5 text-muted-foreground">
                  Template
                </Badge>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors tracking-tight">
                  {tmpl.title}
                </h3>
                <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                  {tmpl.desc}
                </p>
              </div>
            </div>

            <div className="w-full px-4 py-2.5 border-t border-border bg-muted/35 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Use blueprint</span>
              <ArrowRight className="size-3 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
