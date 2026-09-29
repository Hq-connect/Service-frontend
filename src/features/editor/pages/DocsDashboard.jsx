import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FilePlus,
  FolderPlus,
  Clock,
  Sparkles,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import { useDocumentTree } from "../hooks/useDocumentTree";
import CreateFolderModal from "../components/sidebar/CreateFolderModal";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const TEMPLATES = [
  {
    title: "Blank Document",
    desc: "Start from scratch with a clean Notion-style canvas",
    icon: "📄",
    content: "<h1></h1><p></p>",
  },
  {
    title: "Engineering Spec",
    desc: "System architecture, API contracts, and requirements",
    icon: "⚡",
    content:
      "<h1>Engineering Spec</h1><h2>1. Problem Statement</h2><p>Describe the core problem here...</p><h2>2. Architecture & Design</h2><p>Document the components and data flows...</p><h2>3. Milestones & Checklist</h2><ul data-type=\"taskList\"><li data-type=\"taskItem\" data-checked=\"false\"><label><input type=\"checkbox\"><span></span></label><div><p>Backend API & DB Schemas</p></div></li><li data-type=\"taskItem\" data-checked=\"false\"><label><input type=\"checkbox\"><span></span></label><div><p>Frontend Views & Navigation</p></div></li></ul>",
  },
  {
    title: "Meeting Notes",
    desc: "Agenda, discussion points, action items, and attendees",
    icon: "📝",
    content:
      "<h1>Meeting Notes</h1><p><strong>Date:</strong> " +
      new Date().toLocaleDateString() +
      "</p><h2>Agenda</h2><ul><li>Weekly progress review</li><li>Blockers & next steps</li></ul><h2>Action Items</h2><ul data-type=\"taskList\"><li data-type=\"taskItem\" data-checked=\"false\"><label><input type=\"checkbox\"><span></span></label><div><p>Follow up with engineering</p></div></li></ul>",
  },
  {
    title: "Project Roadmap",
    desc: "Q1 - Q4 strategic milestones and deliverables",
    icon: "🚀",
    content:
      "<h1>Project Roadmap</h1><h2>Q1 Goals</h2><ul><li>Core feature release</li><li>Telemetry and monitoring</li></ul><h2>Q2 Goals</h2><ul><li>Scale real-time services</li></ul>",
  },
];

export default function DocsDashboard() {
  const navigate = useNavigate();
  const { folders, rootDocuments, createDocument, createFolder } = useDocumentTree();
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Flatten all documents across root and folders for "Recent" listing
  const allDocuments = useMemo(() => {
    const list = [...rootDocuments];
    const extractFromFolder = (f) => {
      if (f.documents) list.push(...f.documents);
      if (f.subfolders) f.subfolders.forEach(extractFromFolder);
    };
    folders.forEach(extractFromFolder);
    return list.sort(
      (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
    );
  }, [folders, rootDocuments]);

  const handleCreateFromTemplate = async (template) => {
    try {
      setIsCreating(true);
      const newDoc = await createDocument({
        title: template.title === "Blank Document" ? "Untitled" : template.title,
        icon: template.icon,
        content: template.content,
      });
      if (newDoc?._id) {
        navigate(`/docs/${newDoc._id}`);
      }
    } catch (err) {
      console.error("Failed to create document from template:", err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-background p-6 sm:p-10 custom-scrollbar">
      <div className="max-w-6xl w-full mx-auto space-y-10">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground tracking-tight">
              Docs & Knowledge Hub
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Create, organize, and collaborate in real-time across your workspace.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsFolderModalOpen(true)}
              className="gap-1.5"
            >
              <FolderPlus className="size-4 text-muted-foreground" />
              <span>New Folder</span>
            </Button>
            <Button
              type="button"
              disabled={isCreating}
              onClick={() => handleCreateFromTemplate(TEMPLATES[0])}
              className="gap-1.5"
            >
              <FilePlus className="size-4" />
              <span>New Document</span>
            </Button>
          </div>
        </div>

        {/* Templates Quick Start Grid */}
        <div className="space-y-3">
          <h2 className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-primary" />
            <span>Quick Start Templates</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {TEMPLATES.map((tmpl, idx) => (
              <Card
                key={idx}
                onClick={() => handleCreateFromTemplate(tmpl)}
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

        {/* Recent Documents Table / List */}
        <div className="space-y-3">
          <h2 className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="size-3.5 text-muted-foreground" />
            <span>Recent Documents</span>
          </h2>

          {allDocuments.length === 0 ? (
            <div className="py-16 text-center rounded-xl border border-dashed border-border bg-card text-card-foreground">
              <BookOpen className="size-8 mx-auto text-muted-foreground/60 mb-2" />
              <p className="text-sm font-semibold text-foreground">
                No documents found
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Start by creating a blank document or using a template above.
              </p>
            </div>
          ) : (
            <Card className="overflow-hidden p-0">
              <div className="divide-y divide-border">
                {allDocuments.slice(0, 15).map((doc) => (
                  <div
                    key={doc._id}
                    onClick={() => navigate(`/docs/${doc._id}`)}
                    className="flex items-center justify-between p-3.5 hover:bg-muted/50 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3 truncate min-w-0">
                      <span className="text-xl shrink-0">{doc.icon || "📄"}</span>
                      <div className="truncate">
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                          {doc.title || "Untitled"}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {doc.folderId ? "In Folder" : "Workspace Root"} • Last edited{" "}
                          {doc.updatedAt
                            ? new Date(doc.updatedAt).toLocaleDateString()
                            : "recently"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="secondary" className="capitalize text-[10px]">
                        {doc.generalAccess ? doc.generalAccess.replace("_", " ") : "restricted"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      <CreateFolderModal
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        onCreate={createFolder}
      />
    </div>
  );
}
