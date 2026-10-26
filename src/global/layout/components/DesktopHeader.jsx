import { useNavigate } from "react-router-dom";
import {
  LayoutGrid, Search, Smartphone, Calendar, LogOut, User, Settings
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import NotificationBell from "@/features/notifications/components/NotificationBell";
import { extractUser } from "@/global/utils/user";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

function DesktopHeader({ user, logout, getInitials, getUserName, getAvatarStyle }) {
  const navigate = useNavigate();
  // Unwrap nested Redux shape (e.g. { data: { user: {...} } }) so direct
  // field accesses like .avatar and .email work correctly.
  const normalizedUser = extractUser(user);

  return (
    <header className="hidden md:flex items-center justify-between h-16 border-b border-border px-6 select-none bg-background shrink-0">
      {/* Left: View title */}
      <div className="flex items-center gap-2">
        <LayoutGrid className="size-[18px] text-muted-foreground" />
        <span className="font-semibold text-foreground text-sm">All spaces</span>
      </div>

      {/* Middle: Search bar */}
      <div className="relative w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search"
          className="w-full pl-9 pr-4 py-1.5 text-sm bg-muted text-foreground rounded-lg focus:outline-none focus:ring-1 focus:ring-ring/50 transition-all border border-transparent focus:border-border"
        />
      </div>

      {/* Right: Quick actions and user avatar */}
      <div className="flex items-center gap-3">
        <button className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer" title="Mobile App">
          <Smartphone className="size-5" />
        </button>
        <button
          onClick={() => navigate("/calendar")}
          className="text-muted-foreground hover:text-primary transition-colors cursor-pointer"
          title="Calendar"
        >
          <Calendar className="size-5" />
        </button>
        <NotificationBell />

        <DropdownMenu>
          <DropdownMenuTrigger className="focus:outline-none cursor-pointer group rounded-full">
            <Avatar className="size-8 ring-2 ring-transparent group-hover:ring-primary/20 transition-all duration-200">
              {normalizedUser?.avatar && <AvatarImage src={normalizedUser.avatar} alt={getUserName(user)} />}
              <AvatarFallback
                style={getAvatarStyle(user)}
                className="font-bold text-xs font-heading"
              >
                {getInitials(user)}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <div className="px-2.5 py-2 flex flex-col min-w-0">
              <span className="font-semibold text-sm text-foreground truncate">{getUserName(user)}</span>
              <span className="text-xs text-muted-foreground truncate">{normalizedUser?.email}</span>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer flex items-center gap-2">
              <User className="size-4" /> Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer flex items-center gap-2">
              <Settings className="size-4" /> Preferences
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={logout}
              variant="destructive"
              className="cursor-pointer flex items-center gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
            >
              <LogOut className="size-4" /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export default DesktopHeader;
