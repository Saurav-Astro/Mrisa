import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Trash2, Calendar, X, ExternalLink, Clock, MapPin, Users, Settings, CreditCard, UserPlus, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { deleteEvent, fetchEvents, saveEvent } from "@/lib/api";

interface FormField {
  id: string;
  label: string;
  type: string;
  enabled: boolean;
  required: boolean;
  category: "Common" | "Organization" | "University";
}

const DEFAULT_FORM_FIELDS: FormField[] = [
  { id: "name", label: "Name", type: "text", enabled: true, required: true, category: "Common" },
  { id: "email", label: "Email", type: "email", enabled: true, required: true, category: "Common" },
  { id: "dob", label: "Date of Birth", type: "date", enabled: false, required: false, category: "Common" },
  { id: "github", label: "GitHub Profile", type: "url", enabled: false, required: false, category: "Common" },
  { id: "org_name", label: "Organization Name", type: "text", enabled: false, required: false, category: "Organization" },
  { id: "aadhar", label: "Aadhar Number", type: "text", enabled: false, required: false, category: "Organization" },
  { id: "emp_title", label: "Employment Title", type: "text", enabled: false, required: false, category: "Organization" },
  { id: "uni_name", label: "University Name", type: "text", enabled: false, required: false, category: "University" },
  { id: "address", label: "Address", type: "textarea", enabled: false, required: false, category: "University" },
  { id: "roll_no", label: "Roll Number", type: "text", enabled: false, required: false, category: "University" },
  { id: "batch", label: "Batch", type: "text", enabled: false, required: false, category: "University" },
  { id: "semester", label: "Semester", type: "text", enabled: false, required: false, category: "University" },
];

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  status: "upcoming" | "active" | "past";
  attendees: number;
  image_url?: string;
  registration_link?: string;
  registration_type?: "paid" | "unpaid";
  payment_qr_url?: string;
  payment_instructions?: string;
  participation_type?: "solo" | "team";
  team_min_members?: number;
  team_max_members?: number;
  team_enforce_details?: boolean;
  form_fields?: FormField[];
  created_at: string;
  updated_at: string;
}

type TabType = "all" | "upcoming" | "active" | "past";


export const EventsManagement = ({ showForm: externalShowForm, setShowForm: externalSetShowForm }: { showForm?: boolean; setShowForm?: (val: boolean) => void } = {}) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [internalShowForm, setInternalShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const showForm = externalShowForm !== undefined ? externalShowForm : internalShowForm;
  const setShowForm = externalSetShowForm || setInternalShowForm;

  const [formData, setFormData] = useState<Partial<Event>>({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    status: "upcoming",
    attendees: 0,
    image_url: "",
    registration_link: "",
    registration_type: "unpaid",
    payment_qr_url: "",
    payment_instructions: "",
    participation_type: "solo",
    team_min_members: 1,
    team_max_members: 5,
    team_enforce_details: false,
    form_fields: JSON.parse(JSON.stringify(DEFAULT_FORM_FIELDS)),
  });

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchEvents();
      setEvents((data as Event[]) || []);
    } catch (error) {
      toast({ title: "Error", description: "Failed to load events", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { void loadEvents(); }, [loadEvents]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const eventData = { ...formData, attendees: Number(formData.attendees) };
      if (editingEvent) {
        await saveEvent(eventData as any, editingEvent.id);
        toast({ title: "Success", description: "Event updated successfully" });
      } else {
        await saveEvent(eventData as any);
        toast({ title: "Success", description: "Event created successfully" });
      }
      resetForm();
      await loadEvents();
    } catch (error) {
      toast({ title: "Error", description: "Failed to save event", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    setIsLoading(true);
    try {
      await deleteEvent(id);
      toast({ title: "Success", description: "Event deleted successfully" });
      await loadEvents();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete event", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      ...event,
      form_fields: event.form_fields && event.form_fields.length > 0 ? event.form_fields : JSON.parse(JSON.stringify(DEFAULT_FORM_FIELDS))
    });

    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      title: "", description: "", date: "", time: "", location: "", status: "upcoming", attendees: 0,
      image_url: "", registration_link: "", registration_type: "unpaid", payment_qr_url: "",
      payment_instructions: "", participation_type: "solo", team_min_members: 1, team_max_members: 5,
      team_enforce_details: false, form_fields: JSON.parse(JSON.stringify(DEFAULT_FORM_FIELDS)),
    });
    setEditingEvent(null);
    setShowForm(false);
  };

  const toggleField = (id: string, property: 'enabled' | 'required') => {
    setFormData(prev => ({
      ...prev,
      form_fields: prev.form_fields?.map(f => f.id === id ? { ...f, [property]: !f[property] } : f)
    }));
  };

  const filteredEvents = events.filter(e => activeTab === "all" || e.status === activeTab);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Tabs */}
      <motion.div className="flex flex-wrap gap-1 sm:gap-2 bg-[#1a1a2e]/50 p-2 rounded-xl border border-blue-900/40 overflow-x-auto">
        {(["all", "upcoming", "active", "past"] as TabType[]).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg font-semibold transition-all capitalize text-sm whitespace-nowrap ${activeTab === tab ? "bg-gradient-to-r from-green-500 to-emerald-500 text-black shadow-lg" : "text-gray-400 hover:text-white"}`}>
            {tab}
          </button>
        ))}
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div className="bg-[#121224]/95 border border-blue-900/40 rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex items-start justify-between mb-4 border-b border-blue-900/40 pb-4">
                <h3 className="text-xl font-bold text-white flex-1">{editingEvent ? "Edit Event" : "Create New Event"}</h3>
                <button onClick={() => !isLoading && resetForm()} className="text-gray-400 hover:text-white"><X className="h-6 w-6" /></button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-2 space-y-4">
                <div><Label className="text-gray-300">Title</Label><Input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="mt-2 bg-[#1a1a2e]/50 border-blue-900/40 text-white" /></div>
                <div><Label className="text-gray-300">Description</Label><Textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="mt-2 bg-[#1a1a2e]/50 border-blue-900/40 text-white" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label className="text-gray-300">Date</Label><Input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="mt-2 bg-[#1a1a2e]/50 border-blue-900/40 " /></div>
                  <div><Label className="text-gray-300">Time</Label><Input required type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="mt-2 bg-[#1a1a2e]/50 border-blue-900/40" /></div>
                </div>
                <div><Label className="text-gray-300">Location</Label><Input required value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="mt-2 bg-[#1a1a2e]/50 border-blue-900/40 text-white" /></div>
                <div><Label className="text-gray-300">Banner URL</Label><Input value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} className="mt-2 bg-[#1a1a2e]/50 border-blue-900/40 text-white" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label className="text-gray-300">Status</Label><select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="mt-2 w-full px-3 py-2 bg-[#1a1a2e] border border-blue-900/40 rounded-lg"><option value="upcoming">Upcoming</option><option value="active">Active</option><option value="past">Past</option></select></div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-blue-900/40 mt-4">
                  <Button type="submit" disabled={isLoading} className="flex-1 bg-green-500 hover:bg-green-400 text-black">
                    {isLoading ? "Saving..." : "Save Event Details"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Events List */}
      <motion.div className="grid gap-4">
        {filteredEvents.map((event) => (
          <motion.div key={event.id} className="bg-[#121224]/70 backdrop-blur-md rounded-2xl overflow-hidden border border-blue-900/40 flex p-4 items-center gap-4">
             <div className="h-16 w-16 bg-[#0a0a14] rounded-xl overflow-hidden hidden sm:block">
               <img src={event.image_url || "/default_image/meisa_default.jpeg"} onError={(e) => { (e.target as HTMLImageElement).src = "/default_image/meisa_default.jpeg"; }} className="w-full h-full object-cover" />
             </div>
             <div className="flex-1">
               <h4 className="font-bold text-white mb-1 flex items-center gap-2">{event.title} <span className="text-xs border px-2 rounded-full border-blue-500/30 text-blue-400">{event.status}</span></h4>
               <p className="text-xs text-gray-400 flex gap-4">
                 <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {event.date}</span>
                 <span className="flex items-center gap-1"><Users className="w-3 h-3"/> {event.attendees}</span>
               </p>
             </div>
             <div className="flex gap-2">
               <Button variant="outline" size="sm" onClick={() => window.open(`/admin/submissions/${event.id}`, '_blank')} className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"><ExternalLink className="w-4 h-4 mr-1"/> Submissions</Button>
               <Button onClick={() => handleEdit(event)} size="icon" className="bg-blue-500/20 text-blue-400"><Edit2 className="w-4 h-4"/></Button>
               <Button onClick={() => handleDelete(event.id)} size="icon" className="bg-red-500/20 text-red-400"><Trash2 className="w-4 h-4"/></Button>
             </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};
