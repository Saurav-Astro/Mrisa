import { useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminLayout } from "@/components/AdminLayout";
import { WinnersManagement } from "@/components/WinnersManagement";

const WinnersPage = () => {
  const [showNewWinnerForm, setShowNewWinnerForm] = useState(false);

  const headerActions = (
    <Button
      onClick={() => setShowNewWinnerForm(!showNewWinnerForm)}
      className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-semibold flex items-center gap-2 h-9 px-4 text-sm"
    >
      <Plus className="h-4 w-4" />
      <span className="hidden sm:inline">Add Winner</span>
      <span className="sm:hidden">Add</span>
    </Button>
  );

  return (
    <AdminLayout
      title="Winners Management"
      subtitle="Manage event winners and rankings"
      headerActions={headerActions}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <WinnersManagement showForm={showNewWinnerForm} setShowForm={setShowNewWinnerForm} />
      </motion.div>
    </AdminLayout>
  );
};

export default WinnersPage;
