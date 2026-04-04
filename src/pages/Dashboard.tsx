import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Mail, Calendar, User, Settings, ArrowRight, Trophy, Activity, Users, Star
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AdminLayout } from "@/components/AdminLayout";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const userEmail = user?.email || "User";
  const userInitial = user?.email?.[0].toUpperCase() || "U";
  const createdAt = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Unknown";

  const quickActions = [
    {
      icon: Calendar,
      label: "Manage Events",
      description: "Create, edit and manage events",
      href: "/admin/events",
      gradient: "from-blue-500/20 to-cyan-500/20",
      border: "border-blue-500/30 hover:border-blue-400/60",
      iconColor: "from-blue-500 to-cyan-500",
      textColor: "text-blue-400",
    },
    {
      icon: Trophy,
      label: "Manage Winners",
      description: "Add and update event winners",
      href: "/admin/winners",
      gradient: "from-yellow-500/20 to-amber-500/20",
      border: "border-yellow-500/30 hover:border-yellow-400/60",
      iconColor: "from-yellow-500 to-amber-500",
      textColor: "text-yellow-400",
    },
    {
      icon: User,
      label: "Profile",
      description: "View and edit your profile",
      href: "#",
      gradient: "from-purple-500/20 to-pink-500/20",
      border: "border-purple-500/30 hover:border-purple-400/60",
      iconColor: "from-purple-500 to-pink-500",
      textColor: "text-purple-400",
    },
    {
      icon: Settings,
      label: "Settings",
      description: "Configure account settings",
      href: "#",
      gradient: "from-emerald-500/20 to-teal-500/20",
      border: "border-emerald-500/30 hover:border-emerald-400/60",
      iconColor: "from-emerald-500 to-teal-500",
      textColor: "text-emerald-400",
    },
  ];

  const stats = [
    { label: "Events Attended", value: "0", icon: Calendar, color: "from-blue-500 to-cyan-500", bg: "bg-blue-500/10" },
    { label: "Achievements", value: "0", icon: Star, color: "from-yellow-500 to-amber-500", bg: "bg-yellow-500/10" },
    { label: "Messages", value: "0", icon: Mail, color: "from-purple-500 to-pink-500", bg: "bg-purple-500/10" },
    { label: "Certifications", value: "0", icon: Activity, color: "from-emerald-500 to-teal-500", bg: "bg-emerald-500/10" },
  ];

  return (
    <AdminLayout title="Dashboard" subtitle="Welcome back to your MRISA admin panel">
      {/* User Profile + Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-[#0d0d1a]/80 backdrop-blur-md rounded-2xl p-6 border border-blue-900/40 flex flex-col items-center text-center"
        >
          <motion.div
            animate={{
              boxShadow: [
                "0 0 20px rgba(16, 185, 129, 0.25)",
                "0 0 40px rgba(16, 185, 129, 0.45)",
                "0 0 20px rgba(16, 185, 129, 0.25)",
              ],
            }}
            transition={{ duration: 3, repeat: Infinity }}
            className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center mb-4 text-3xl font-bold text-black"
          >
            {userInitial}
          </motion.div>
          <h2 className="text-xl font-bold text-white mb-1">{userEmail.split("@")[0]}</h2>
          <p className="text-xs text-gray-400 mb-4 break-all">{userEmail}</p>
          <div className="w-full bg-[#1a1a2e]/60 rounded-xl p-3 border border-blue-900/30">
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Member Since</p>
            <p className="text-white font-semibold text-sm">{createdAt}</p>
          </div>
          <div className="mt-3 w-full flex items-center gap-2 bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
            <span className="text-emerald-400 text-xs font-semibold">Active Admin</span>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-2 grid grid-cols-2 gap-3 sm:gap-4"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.15 + i * 0.07 }}
              className="bg-[#0d0d1a]/80 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-blue-900/40 hover:border-blue-700/60 transition-all duration-300 group"
            >
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className="h-5 w-5 text-white opacity-90" />
              </div>
              <p className="text-gray-400 text-xs mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          {quickActions.map((action, i) => (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25 + i * 0.08 }}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => action.href !== "#" && navigate(action.href)}
              className={`relative group text-left rounded-2xl border ${action.border} bg-gradient-to-br ${action.gradient} backdrop-blur-md p-5 transition-all duration-300 overflow-hidden`}
            >
              {/* Hover shine */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br from-white/5 to-transparent transition-opacity duration-300 pointer-events-none" />
              <div className={`inline-flex p-2.5 rounded-xl bg-gradient-to-br ${action.iconColor} mb-3 group-hover:scale-110 transition-transform duration-300`}>
                <action.icon className="h-5 w-5 text-white" />
              </div>
              <h4 className="text-base font-bold text-white mb-1">{action.label}</h4>
              <p className="text-gray-400 text-xs leading-relaxed">{action.description}</p>
              <ArrowRight className={`h-4 w-4 ${action.textColor} mt-3 group-hover:translate-x-1 transition-transform duration-300`} />
            </motion.button>
          ))}
        </div>
      </motion.div>
    </AdminLayout>
  );
};

export default Dashboard;
