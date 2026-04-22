import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut, LayoutDashboard, Calendar, Trophy, ChevronLeft, Menu, X, Home, Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Scene3D } from "@/components/Scene3D";

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, color: "text-emerald-400" },
  { href: "/admin/events", label: "Events", icon: Calendar, color: "text-blue-400" },
  { href: "/admin/winners", label: "Winners", icon: Trophy, color: "text-yellow-400" },
  { href: "/admin/registrations", label: "Registrations", icon: Users, color: "text-purple-400" },
];

export const AdminLayout = ({ children, title, subtitle = "", headerActions }: AdminLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const { error } = await logout();
    if (error) {
      toast({ title: "Logout Failed", description: error.message, variant: "destructive" });
      setIsLoggingOut(false);
    } else {
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      navigate("/");
    }
  };

  const userInitial = user?.email?.[0].toUpperCase() || "U";
  const userEmail = user?.email || "";

  return (
    <div className="relative text-gray-200 min-h-screen">
      {/* 3D Background */}
      <div className="fixed inset-0 z-0">
        <Scene3D />
      </div>

      {/* Sidebar overlay backdrop (mobile) */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: sidebarOpen ? 0 : "-100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 35 }}
        className="fixed top-0 left-0 h-full w-64 z-40 lg:hidden bg-[#0a0a12]/95 border-r border-blue-900/40 backdrop-blur-xl flex flex-col"
      >
        <div className="flex items-center justify-between p-4 border-b border-blue-900/30">
          <span className="text-white font-bold text-lg">Admin Panel</span>
          <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-white p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User info */}
        <div className="p-4 border-b border-blue-900/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center font-bold text-black flex-shrink-0">
              {userInitial}
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm truncate">{userEmail.split("@")[0]}</p>
              <p className="text-gray-400 text-xs truncate">{userEmail}</p>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <button
                key={item.href}
                onClick={() => { navigate(item.href); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-white/10 text-white border border-white/15"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <item.icon className={`h-4 w-4 ${isActive ? item.color : ""}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="p-3 border-t border-blue-900/30 space-y-1">
          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <Home className="h-4 w-4" />
            Back to Site
          </button>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="h-4 w-4" />
            {isLoggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      </motion.aside>

      {/* Desktop sidebar (always visible on lg+) */}
      <aside className="hidden lg:flex fixed top-0 left-0 h-full w-64 z-30 bg-[#080810]/90 border-r border-blue-900/30 backdrop-blur-xl flex-col">
        <div className="p-5 border-b border-blue-900/30">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-xs font-mono uppercase tracking-widest">Admin Panel</span>
          </div>
          <p className="text-white font-bold text-lg">MRISA Dashboard</p>
        </div>

        {/* User info */}
        <div className="p-4 border-b border-blue-900/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center font-bold text-black text-lg flex-shrink-0">
              {userInitial}
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm truncate">{userEmail.split("@")[0]}</p>
              <p className="text-gray-400 text-xs truncate">{userEmail}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <button
                key={item.href}
                onClick={() => navigate(item.href)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                  isActive
                    ? "bg-white/10 text-white border border-white/15"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <item.icon className={`h-4 w-4 transition-colors ${isActive ? item.color : "group-hover:text-gray-200"}`} />
                {item.label}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400"
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-blue-900/30 space-y-1">
          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <Home className="h-4 w-4" />
            Back to Site
          </button>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="h-4 w-4" />
            {isLoggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="relative z-10 lg:ml-64 min-h-screen">
        {/* Top header bar */}
        <header className="sticky top-0 z-20 bg-[#070710]/80 backdrop-blur-xl border-b border-blue-900/30">
          <div className="flex items-center gap-3 px-4 sm:px-6 h-14 sm:h-16">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-all"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Breadcrumb / Title */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="text-gray-500 text-sm hidden sm:inline truncate">{subtitle}</span>
            </div>

            {/* Header actions */}
            {headerActions && (
              <div className="flex items-center gap-2 flex-shrink-0">
                {headerActions}
              </div>
            )}

            {/* Logout button (desktop) */}
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 hover:text-red-300 text-sm font-medium transition-all border border-red-500/20 hover:border-red-500/40"
            >
              <LogOut className="h-3.5 w-3.5" />
              {isLoggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Page header */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 sm:mb-8"
          >
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">{title}</h1>
            <p className="text-gray-400 text-sm mt-1">{subtitle}</p>
          </motion.div>

          {/* Slot for page-specific content */}
          {children}
        </main>
      </div>
    </div>
  );
};
