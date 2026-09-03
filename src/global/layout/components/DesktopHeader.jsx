import React from "react";
import { Link } from "react-router-dom";
import { 
  LayoutGrid, Search, Smartphone, Calendar, Bell, User, Settings, LogOut 
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

function DesktopHeader({ user, logout, getInitials, getUserName, getAvatarStyle }) {
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
          className="w-full pl-9 pr-4 py-1.5 text-sm bg-muted text-foreground placeholder:text-muted-foreground rounded-lg focus:outline-hidden focus:ring-1 focus:ring-primary/40 transition-all border-none"
        />
      </div>

      {/* Right: Quick actions and user avatar */}
      <div className="flex items-center gap-4">
        <button className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
          <Smartphone className="size-5" />
        </button>
        <button className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
          <Calendar className="size-5" />
        </button>
        <div className="relative">
          <button className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
            <Bell className="size-5" />
          </button>
          <span className="absolute -top-1 -right-1 min-w-3.5 h-3.5 rounded-full bg-[#f23c3c] text-white text-[7px] font-bold flex items-center justify-center ring-2 ring-background">
            23
          </span>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger className="focus:outline-hidden cursor-pointer group rounded-full">
            <Avatar className="size-8 ring-2 ring-transparent group-hover:ring-primary/40 transition-all duration-200">
              {user?.avatar && <AvatarImage src={user.avatar} alt={getUserName(user)} />}
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
              <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/preferences" className="cursor-pointer flex items-center gap-2 w-full">
                <User className="size-4" /> Profile Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/preferences" className="cursor-pointer flex items-center gap-2 w-full">
                <Settings className="size-4" /> Preferences
              </Link>
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
