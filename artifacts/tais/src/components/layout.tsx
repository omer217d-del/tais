import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Terminal, Zap, Puzzle, BrainCircuit, Activity, Settings, MessageSquareCode } from "lucide-react";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { icon: MessageSquareCode, label: "Chat", path: "/" },
  { icon: Zap, label: "Otomasyonlar", path: "/automations" },
  { icon: Puzzle, label: "Eklentiler", path: "/plugins" },
  { icon: BrainCircuit, label: "Modeller", path: "/models" },
  { icon: Activity, label: "Günlükler", path: "/logs" },
  { icon: Settings, label: "Ayarlar", path: "/settings" },
];

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();

  return (
    <div className="flex h-[100dvh] w-full bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-60 flex-col border-r border-border/60 bg-sidebar z-20 relative shrink-0">
        {/* Logo */}
        <div className="flex h-14 items-center gap-2.5 px-4 border-b border-border/60">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center border border-primary/25 text-primary shrink-0">
            <Terminal size={16} />
          </div>
          <span className="font-mono font-bold tracking-widest text-primary text-sm uppercase select-none">
            TAIS
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {navItems.map((item) => {
            const active = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 group text-sm font-medium",
                    active
                      ? "bg-primary/12 text-primary border border-primary/20"
                      : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground border border-transparent"
                  )}
                >
                  <item.icon
                    size={17}
                    className={cn(
                      "shrink-0 transition-colors",
                      active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                  <span className="font-mono tracking-wide text-xs uppercase">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Version tag */}
        <div className="px-4 py-3 border-t border-border/60">
          <p className="text-[10px] font-mono text-muted-foreground/50 tracking-widest">v0.1.0 · TAIS</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden flex h-14 items-center gap-2.5 px-4 border-b border-border/60 bg-sidebar/80 backdrop-blur-sm z-20 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center border border-primary/25 text-primary shrink-0">
            <Terminal size={16} />
          </div>
          <span className="font-mono font-bold tracking-widest text-primary text-sm uppercase">TAIS</span>
        </header>

        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            {children}
          </div>
        </div>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden flex h-16 border-t border-border/60 bg-sidebar/95 backdrop-blur-md justify-around items-center px-1 z-20 shrink-0">
          {navItems.map((item) => {
            const active = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <div
                  className={cn(
                    "flex flex-col items-center justify-center w-12 h-12 rounded-xl cursor-pointer transition-colors",
                    active ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <item.icon size={19} className="mb-0.5 shrink-0" />
                  <span className="text-[9px] font-mono uppercase leading-none tracking-wider">
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>
      </main>
    </div>
  );
}
