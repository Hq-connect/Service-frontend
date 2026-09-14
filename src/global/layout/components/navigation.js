import { 
  Home, CheckSquare, FileText, Folder, Video, Sparkles, MessageSquare, Phone,
  LayoutGrid, Inbox, UserCheck, ClipboardList, CheckCircle, Archive,
  Clock, FileSignature, Users, Layers, Share2, UploadCloud, Trash,
  Calendar, PlayCircle, RefreshCw, Cpu, AlignLeft, BookOpen, MessageCircle, Hash, BellOff
} from "lucide-react";

export const PRIMARY_NAV_ITEMS = [
  { label: "Home", path: "/home", icon: Home },
  { label: "Tasks", path: "/tasks", icon: CheckSquare },
  { label: "Docs", path: "/docs", icon: FileText },
  { label: "Files", path: "/files", icon: Folder },
  { label: "Meets", path: "/meets", icon: Video },
  { label: "Ask AI", path: "/ask-ai", icon: Sparkles },
  { label: "Chats", path: "/chats", icon: MessageSquare }
];

export const EXTRA_NAV_ITEMS = [
  { label: "Video", icon: Video, badge: 20 },
  { label: "Calls", icon: Phone, badge: 9 }
];

export const SECONDARY_NAV_DATA = {
  "/home": {
    title: "Home",
    items: [
      { label: "All Spaces", icon: LayoutGrid },
      { label: "Marketing Team", icon: "M", color: "#00c2ff" },
      { label: "Sales Pipeline", icon: "S", color: "#cc5aed" },
      { label: "Product Launch", icon: "P", color: "#3b82f6" },
      { label: "Personal Space", icon: "P", color: "#10b981" }
    ]
  },
  "/tasks": {
    title: "Tasks",
    items: [
      { label: "Inbox", icon: Inbox, count: 4 },
      { label: "Assigned to me", icon: UserCheck, count: 7 },
      { label: "Created by me", icon: ClipboardList, count: 2 },
      { label: "Completed", icon: CheckCircle },
      { label: "Archived", icon: Archive }
    ]
  },
  "/docs": {
    title: "Docs",
    items: [
      { label: "Recent Documents", icon: Clock },
      { label: "My Drafts", icon: FileSignature, count: 3 },
      { label: "Shared with me", icon: Users },
      { label: "Templates", icon: Layers }
    ]
  },
  "/files": {
    title: "Files",
    items: [
      { label: "All Files", icon: Folder },
      { label: "Recent uploads", icon: UploadCloud },
      { label: "Shared", icon: Share2 },
      { label: "Trash", icon: Trash }
    ]
  },
  "/meets": {
    title: "Meets",
    items: [
      { label: "All Meetings", icon: Video, path: "/meets" },
      { label: "Schedule Meet", icon: Calendar, path: "/meets?action=schedule" },
      { label: "Instant Meeting", icon: Video, path: "/meets?action=instant" },
      { label: "Recorded Sessions", icon: PlayCircle, path: "/meets/recordings" },
      { label: "Calendar Sync", icon: RefreshCw }
    ]
  },
  "/ask-ai": {
    title: "Ask AI",
    items: [
      { label: "AI Assistant", icon: Sparkles },
      { label: "Prompts Library", icon: BookOpen },
      { label: "Summarizer", icon: AlignLeft },
      { label: "AI Integrations", icon: Cpu }
    ]
  },
  "/chats": {
    title: "Chats",
    items: [
      { label: "Direct Messages", icon: MessageCircle, count: 5, path: "/chats/dm" },
      { label: "Channels",        icon: Hash,          count: 3, path: "/chats/channel" },
      { label: "Group Chats",     icon: Users,          count: 2, path: "/chats/group" },
      { label: "Muted",           icon: BellOff,                  path: "/chats/muted" },
    ]
  }
};
