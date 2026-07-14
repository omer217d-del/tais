import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Terminal, Zap, Puzzle, BrainCircuit, Activity, Settings, MessageSquareCode } from "lucide-react";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { icon: MessageSquareCode, label: "Chat", path: "/" },
  { icon: Zap, label: "Automations", path: "/automations" },
  { icon: Puzzle, label: "Plugins", path: "/plugins" },
  { icon: BrainCircuit, label: "Models", path: "/models" },
  { icon: Activity, label: "Logs", path: "/logs" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();

  return (
    <div className="flex h-[100dvh] w-full bg-background overflow-hidden selection:bg-primary/30">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-sidebar z-20 relative">
        <div className="flex h-14 items-center gap-2 px-4 border-b border-border">
          <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center border border-primary/50 text-primary">
            <Terminal size={18} />
          </div>
          <span className="font-mono font-bold tracking-wider text-primary uppercase">TAIS</span>
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {navItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-all duration-200 group font-mono text-sm",
                  location === item.path
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground border border-transparent"
                )}
              >
                <item.icon size={18} className={cn(
                  "transition-colors",
                  location === item.path ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )} />
                {item.label}
              </div>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Header */}
        <header className="md:hidden flex h-14 items-center gap-2 px-4 border-b border-border bg-sidebar/80 backdrop-blur-sm z-20 flex-shrink-0">
          <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center border border-primary/50 text-primary">
            <Terminal size={18} />
          </div>
          <span className="font-mono font-bold tracking-wider text-primary uppercase">TAIS</span>
        </header>

        <div className="flex-1 overflow-hidden relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none" />
          <div className="h-full overflow-y-auto">
            {children}
          </div>
        </div>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden flex h-16 border-t border-border bg-sidebar/95 backdrop-blur-md justify-around items-center px-2 z-20 flex-shrink-0">
          {navItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <div className={cn(
                "flex flex-col items-center justify-center w-14 h-12 rounded-lg cursor-pointer transition-colors",
                location === item.path ? "text-primary" : "text-muted-foreground"
              )}>
                <item.icon size={20} className={cn(
                  "mb-1",
                  location === item.path && "drop-shadow-[0_0_8px_rgba(0,255,255,0.5)]"
                )} />
                <span className="text-[10px] font-mono leading-none">{item.label}</span>
              </div>
            </Link>
          ))}
        </nav>
      </main>
    </div>
  );
}
