import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileText, FolderOpen, History, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import allInsuranceLogo from "@/assets/all-insurance-logo.png";

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: "/dashboard", label: "Upload", icon: Upload },
    { path: "/documents", label: "Documents", icon: FolderOpen },
    { path: "/requirements", label: "Requirements", icon: FileText },
    { path: "/audit", label: "Audit Log", icon: History },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center">
            <img 
              src={allInsuranceLogo} 
              alt="All Insurance LTD." 
              className="h-10 w-auto"
            />
          </div>
          
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Button
                  key={item.path}
                  variant="ghost"
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "gap-2",
                    isActive && "bg-secondary"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              );
            })}
          </nav>
          
          <div className="w-10" />
        </div>
      </header>

      {/* Mobile Navigation */}
      <nav className="md:hidden border-b bg-card">
        <div className="container flex overflow-x-auto px-2 py-2 gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Button
                key={item.path}
                variant={isActive ? "secondary" : "ghost"}
                size="sm"
                onClick={() => navigate(item.path)}
                className="gap-2 whitespace-nowrap"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Button>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 container py-6 px-4">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t bg-card py-4">
        <div className="container px-4 text-center text-sm text-muted-foreground">
          © 2025 InsureCert Portal. Secure compliance management platform.
        </div>
      </footer>
    </div>
  );
};

export default Layout;