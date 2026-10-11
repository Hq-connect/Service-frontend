import { Outlet } from "react-router-dom"
import {
  MessageSquare,
  Video,
  FolderOpen,
  FileText,
  CalendarDays,
  CheckSquare,
  Search,
  Sparkles,
  BarChart2,
  Users,
} from "lucide-react"
import { Separator } from "@/components/ui/separator"
import useTenant from "@/global/hooks/useTenant"
import Logo from "@/components/ui/Logo"

const WORKSPACE_FEATURES = [
  { icon: MessageSquare, label: "Messaging",         desc: "Channels, DMs & threads" },
  { icon: Video,         label: "Meetings",           desc: "Video & audio conferencing" },
  { icon: FolderOpen,   label: "File Storage",        desc: "Secure shared cloud storage" },
  { icon: FileText,     label: "Documents",           desc: "Real-time collaborative editing" },
  { icon: CalendarDays, label: "Calendar",            desc: "Shared scheduling & events" },
  { icon: CheckSquare,  label: "Tasks",               desc: "Projects, boards & workflows" },
  { icon: Search,       label: "Search",              desc: "Instant search across workspace" },
  { icon: Sparkles,     label: "AI Assistant",        desc: "Smart drafts & suggestions" },
  { icon: BarChart2,    label: "Analytics",           desc: "Team performance insights" },
  { icon: Users,        label: "People & Org",        desc: "Roles, teams & permissions" },
]

function AuthLayout() {
  const { tenant } = useTenant();
  const displayName = tenant?.name || "your workspace";

  return (
    <div className="min-h-[100dvh] flex bg-background">
      {/* Left branding panel */}
      <aside className="hidden lg:flex lg:w-[480px] xl:w-[520px] shrink-0 flex-col bg-foreground text-background relative overflow-hidden">
        {/* Subtle dot grid */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative z-10 flex flex-col h-full px-10 py-12">
          {/* HQ mark + label */}
          <div className="flex items-center gap-3 mb-2">
            <Logo isDark={true} className="h-8 w-auto" />
          </div>

          {/* Tenant identity */}
          <div className="mb-10 mt-8">
            <p className="text-xs font-semibold tracking-widest uppercase opacity-40 mb-2">Workspace</p>
            <h1 className="text-3xl font-bold tracking-tight leading-[1.1] mb-3 capitalize">
              {displayName}
            </h1>
            <p className="text-sm leading-relaxed opacity-50 max-w-[320px]">
              Sign in or request access to start collaborating with your team inside{" "}
              <span className="opacity-90 font-medium">{displayName}</span>.
            </p>
          </div>

          <Separator className="bg-background/10 mb-8" />

          {/* Capability list */}
          <p className="text-[10px] font-semibold tracking-widest uppercase opacity-35 mb-5">
            What's included
          </p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 flex-1">
            {WORKSPACE_FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-2.5">
                <Icon className="size-3.5 shrink-0 mt-0.5 opacity-60" strokeWidth={1.75} />
                <div>
                  <p className="text-xs font-semibold leading-none mb-0.5">{label}</p>
                  <p className="text-[11px] opacity-40 leading-snug">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-8 text-[11px] opacity-25 tracking-wide">
            Powered by HQ Connect
          </p>
        </div>
      </aside>

      {/* Right form panel */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 overflow-y-auto">
        {/* Mobile mark */}
        <div className="flex lg:hidden items-center gap-2 mb-10">
          <Logo iconOnly={true} className="size-6 text-foreground" />
          <span className="text-base font-bold tracking-tight">{displayName}</span>
        </div>

        <Outlet />
      </main>
    </div>
  )
}

export default AuthLayout
