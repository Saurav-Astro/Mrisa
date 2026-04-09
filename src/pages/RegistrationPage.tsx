import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { fetchEvents } from "@/lib/api";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Calendar, Users, ArrowRight, Activity, Clock } from "lucide-react";

export const RegistrationPage = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await fetchEvents();
        setEvents(data || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    void loadData();
  }, []);

  return (
    <AdminLayout title="Registrations" subtitle="Select an event to view and manage its registrations">
      {loading ? (
        <div className="flex animate-pulse flex-col gap-4">
          {[1, 2, 3].map(i => (
             <div key={i} className="h-24 bg-[#1a1a2e]/30 rounded-xl border border-blue-900/20"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {events.map((event: any, i: number) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              onClick={() => navigate(`/admin/submissions/${event.id}`)}
              className="bg-[#0b0b14]/80 backdrop-blur-md rounded-2xl p-5 border border-blue-900/40 hover:border-blue-500/60 transition-all cursor-pointer group hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] flex flex-col justify-between"
            >
              <div className="flex justify-between items-start mb-4">
                 <div>
                    <h3 className="font-bold text-white text-lg group-hover:text-blue-400 transition-colors">{event.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${event.status === 'active' ? 'bg-green-500/10 border-green-500/30 text-green-400' : event.status === 'upcoming' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-gray-500/10 border-gray-500/30 text-gray-400'}`}>
                         {event.status}
                      </span>
                      <span className="text-gray-500 text-xs flex items-center gap-1"><Calendar className="w-3 h-3"/> {event.date}</span>
                    </div>
                 </div>
                 <div className="w-10 h-10 rounded-full bg-blue-900/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                    <ArrowRight className="w-5 h-5" />
                 </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-blue-900/30">
                 <div>
                    <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">Total Registrations</p>
                    <p className="font-mono text-xl text-white">{event.attendees || 0}</p>
                 </div>
                 <div>
                    <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">Participation</p>
                    <p className="text-sm text-gray-300 capitalize flex items-center gap-1"><Users className="w-3 h-3"/> {event.participation_type || 'Solo'}</p>
                 </div>
              </div>
            </motion.div>
          ))}
          {events.length === 0 && (
             <div className="col-span-1 lg:col-span-2 py-12 text-center border border-dashed border-blue-900/40 rounded-2xl bg-[#0b0b14]/50">
               <Activity className="w-10 h-10 text-gray-600 mx-auto mb-3" />
               <p className="text-gray-400">No events found. Create an event to begin managing registrations.</p>
             </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
};

export default RegistrationPage;
