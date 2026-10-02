import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
      <h2 className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        <Sparkles className="size-3.5 text-primary" />
        <span>Quick Start Templates</span>
        {isCreating && <Loader2 className="size-3 animate-spin text-primary ml-1" />}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {TEMPLATES.map((tmpl, idx) => (
          <Card
            key={idx}
            onClick={() => handleSelect(tmpl)}
            className="group cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all"
          >
            <CardHeader>
              <span className="text-3xl block mb-2">{tmpl.icon}</span>
              <CardTitle className="group-hover:text-primary transition-colors">
                {tmpl.title}
              </CardTitle>
              <CardDescription className="line-clamp-2">
                {tmpl.desc}
              </CardDescription>
            </CardHeader>
            <div className="px-4 pb-3 flex items-center text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity gap-1">
              <span>Create page</span>
              <ArrowRight className="size-3" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
