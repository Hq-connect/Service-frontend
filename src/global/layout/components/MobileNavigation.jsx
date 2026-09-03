import React from "react";
import { Link } from "react-router-dom";
import { 
  Menu, User, Settings, LogOut 
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader, SheetDescription } from "@/components/ui/sheet";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { PRIMARY_NAV_ITEMS } from "./navigation";
import Logo from "@/components/ui/Logo";

function MobileNavigation({ 
  tenant, user, logout, secondaryNav, selectedSpaceIdx, setSelectedSpaceIdx, 
  currentPath, getInitials, getUserName, getAvatarStyle, mobileDrawerOpen, setMobileDrawerOpen 
}) {
  const renderSecondaryItems = () => {
    return (
      <div className="flex flex-col gap-0.5 p-2">
        {secondaryNav.items.map((item, idx) => {
          const Icon = item.icon;
          const isSelected = selectedSpaceIdx === idx;
          return (
            <button
              key={idx}
              onClick={() => {
                setSelectedSpaceIdx(idx);
                setMobileDrawerOpen(false);
              }}
              className={`flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-lg transition-all duration-150 group cursor-pointer ${
                isSelected 
                  ? "bg-accent/80 text-foreground" 
                  : "text-foreground/80 hover:bg-accent/40 hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-3">
                {typeof Icon === "string" ? (
                  <span 
                    className="flex items-center justify-center size-5 text-[10px] font-bold text-white rounded-md shadow-xs shrink-0 select-none"
                    style={{ backgroundColor: item.color || "#00c2ff" }}
                  >
                    {Icon}
                  </span>
                ) : (
                  <Icon className="size-[18px] shrink-0 text-muted-foreground group-hover:text-foreground" />
                )}
                <span>{item.label}</span>
              </div>
              {item.count !== undefined && (
                <span className="px-1.5 py-0.5 text-xs font-semibold rounded-md bg-muted text-muted-foreground group-hover:bg-accent-foreground/10 group-hover:text-accent-foreground">
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {/* Top Header Bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-background/85 backdrop-blur-md border-b border-border flex items-center justify-between px-4 z-40">
        {/* Hamburger Menu & Page Title */}
        <div className="flex items-center gap-3">
          <Sheet open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
            <SheetTrigger className="md:hidden cursor-pointer size-8 inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent hover:bg-muted hover:text-foreground outline-none select-none transition-all">
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 flex flex-col h-full bg-background">
              <SheetHeader className="p-4 border-b border-border">
                <SheetTitle className="text-left font-heading text-lg font-semibold flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {tenant?.logo ? <img src={tenant?.logo} alt="Logo" className="w-7 h-7" /> : <Logo iconOnly={true} className="w-2 h-2" />}
                    <span className="whitespace-nowrap">{tenant?.name || "Hq"}</span>
                  </div>
                </SheetTitle>
                <SheetDescription className="text-left text-xs">
                  Sub-navigation for the selected dashboard view.
                </SheetDescription>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto py-4">
                <div className="px-4 mb-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {secondaryNav.title} Options
                  </h3>
                </div>
                {renderSecondaryItems()}
              </div>
            </SheetContent>
          </Sheet>
          <span className="font-semibold text-base text-foreground font-heading capitalize">
            {secondaryNav.title}
          </span>
        </div>

        {/* User Dropdown on Mobile */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger className="focus:outline-hidden cursor-pointer rounded-full">
              <Avatar className="size-8">
                {user?.avatar && <AvatarImage src={user.avatar} alt={getUserName(user)} />}
                <AvatarFallback 
                  style={getAvatarStyle(user)} 
                  className="font-bold text-xs font-heading"
                >
                  {getInitials(user)}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-52" align="end">
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

      {/* Bottom Nav Bar (Mobile Primary Links) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#131517] border-t border-[#222528] flex items-center justify-around z-40 select-none">
        {PRIMARY_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex flex-col items-center justify-center flex-1 py-1 transition-all duration-150 ${
                isActive 
                  ? "text-white font-semibold" 
                  : "text-[#8e9297] hover:text-white"
              }`}
            >
              <Icon className="size-5 shrink-0" />
              <span className="text-[10px] mt-0.5 tracking-wide select-none">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

export default MobileNavigation;
