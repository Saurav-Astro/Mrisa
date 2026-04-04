import { useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminLayout } from "@/components/AdminLayout";
import { EventsManagement } from "@/components/EventsManagement";

const EventsPage = () => {
  const [showNewEventForm, setShowNewEventForm] = useState(false);

  const headerActions = (
    <Button
      onClick={() => setShowNewEventForm(!showNewEventForm)}
      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-black font-semibold flex items-center gap-2 h-9 px-4 text-sm"
    >
      <Plus className="h-4 w-4" />
      <span className="hidden sm:inline">New Event</span>
      <span className="sm:hidden">New</span>
    </Button>
  );

  return (
    <AdminLayout
      title="Events Management"
      subtitle="Create and manage all MRISA events"
      headerActions={headerActions}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <EventsManagement showForm={showNewEventForm} setShowForm={setShowNewEventForm} />
      </motion.div>
    </AdminLayout>
  );
};

export default EventsPage;
