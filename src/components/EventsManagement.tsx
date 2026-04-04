import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Trash2, Calendar, X, ExternalLink, Clock, MapPin, Users, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { deleteEvent, fetchEvents, saveEvent } from "@/lib/api";

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

  // Use external state if provided, otherwise use internal state
  const showForm = externalShowForm !== undefined ? externalShowForm : internalShowForm;
  const setShowForm = externalSetShowForm || setInternalShowForm;

  type FormData = {
    title: string;
    description: string;
    date: string;
    time: string;
    location: string;
    status: "upcoming" | "active" | "past";
    attendees: string;
    image_url: string;
    registration_link: string;
  };

  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    status: "upcoming",
    attendees: "0",
    image_url: "",
    registration_link: "",
  });

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchEvents();
      setEvents((data as Event[]) || []);
    } catch (error) {
      toast({
        title: "Error Loading Events",
        description: "Failed to load events from database",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const eventData = {
        title: formData.title,
        description: formData.description,
        date: formData.date,
        time: formData.time,
        location: formData.location,
        status: formData.status,
        attendees: parseInt(formData.attendees),
        image_url: formData.image_url || null,
        registration_link: formData.registration_link || null,
      };

      if (editingEvent) {
        await saveEvent(eventData, editingEvent.id);
        toast({
          title: "Success",
          description: "Event updated successfully",
        });
      } else {
        await saveEvent(eventData);
        toast({
          title: "Success",
          description: "Event created successfully",
        });
      }

      resetForm();
      await loadEvents();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save event",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    setIsLoading(true);
    try {
      await deleteEvent(id);
      toast({
        title: "Success",
        description: "Event deleted successfully",
      });
      await loadEvents();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      location: event.location,
      status: event.status as "upcoming" | "active" | "past",
      attendees: event.attendees.toString(),
      image_url: event.image_url || "",
      registration_link: event.registration_link || "",
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      date: "",
      time: "",
      location: "",
      status: "upcoming",
      attendees: "0",
      image_url: "",
      registration_link: "",
    });
    setEditingEvent(null);
    setShowForm(false);
  };

  const filteredEvents = events.filter((event) => {
    if (activeTab === "all") return true;
    return event.status === activeTab;
  });

  const tabCounts = {
    all: events.length,
    upcoming: events.filter((e) => e.status === "upcoming").length,
    active: events.filter((e) => e.status === "active").length,
    past: events.filter((e) => e.status === "past").length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "from-blue-500 to-cyan-500";
      case "active":
        return "from-green-500 to-emerald-500";
      case "past":
        return "from-gray-500 to-gray-600";
      default:
        return "from-blue-500 to-cyan-500";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "active":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "past":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      default:
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="flex flex-wrap gap-1 sm:gap-2 bg-[#1a1a2e]/50 p-2 rounded-xl border border-blue-900/40 overflow-x-auto"
      >
        {(["all", "upcoming", "active", "past"] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 sm:px-4 py-2 rounded-lg font-semibold transition-all duration-300 capitalize flex items-center gap-1 sm:gap-2 text-sm sm:text-base whitespace-nowrap ${
              activeTab === tab
                ? "bg-gradient-to-r from-green-500 to-emerald-500 text-black shadow-lg"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {tab}
            <span className="text-xs bg-black/30 px-2 py-0.5 sm:py-1 rounded-full">
              {tabCounts[tab]}
            </span>
          </button>
        ))}
      </motion.div>

      {/* Create/Edit Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-4"
            onClick={() => !isLoading && resetForm()}
          >
            <motion.div
              initial={{ scale: 0.95, y: "100%", opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: "100%", opacity: 0 }}
              className="bg-[#121224]/95 border border-blue-900/40 rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 md:p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4 sm:mb-6 gap-3">
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white flex-1 line-clamp-2">
                  {editingEvent ? "Edit Event" : "Create New Event"}
                </h3>
                <button
                  onClick={() => !isLoading && resetForm()}
                  className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 md:space-y-6">
                {/* Title */}
                <div>
                  <Label className="text-gray-300">Event Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Enter event title"
                    disabled={isLoading}
                    required
                    className="mt-2 bg-[#1a1a2e]/50 border-blue-900/40 text-white"
                  />
                </div>

                {/* Description */}
                <div>
                  <Label className="text-gray-300">Description *</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Enter event description"
                    disabled={isLoading}
                    required
                    rows={4}
                    className="mt-2 bg-[#1a1a2e]/50 border-blue-900/40 text-white"
                  />
                </div>

                {/* Image URL */}
                <div>
                  <Label className="text-gray-300">Event Image URL</Label>
                  <Input
                    value={formData.image_url}
                    onChange={(e) =>
                      setFormData({ ...formData, image_url: e.target.value })
                    }
                    placeholder="https://example.com/image.jpg"
                    disabled={isLoading}
                    className="mt-2 bg-[#1a1a2e]/50 border-blue-900/40 text-white"
                  />
                  {formData.image_url && (
                    <div className="mt-3 rounded-lg overflow-hidden border border-blue-900/40">
                      <img
                        src={formData.image_url}
                        alt="Event preview"
                        className="w-full h-32 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300">Date *</Label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                      disabled={isLoading}
                      required
                      className="mt-2 bg-[#1a1a2e]/50 border-blue-900/40 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Time *</Label>
                    <Input
                      type="time"
                      value={formData.time}
                      onChange={(e) =>
                        setFormData({ ...formData, time: e.target.value })
                      }
                      disabled={isLoading}
                      required
                      className="mt-2 bg-[#1a1a2e]/50 border-blue-900/40 text-white"
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <Label className="text-gray-300">Location *</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    placeholder="Enter event location"
                    disabled={isLoading}
                    required
                    className="mt-2 bg-[#1a1a2e]/50 border-blue-900/40 text-white"
                  />
                </div>

                {/* Status and Attendees */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300">Status *</Label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value as "upcoming" | "active" | "past",
                        })
                      }
                      disabled={isLoading}
                      className="mt-2 w-full px-3 py-2 bg-[#1a1a2e]/80 border border-blue-900/40 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                    >
                      <option value="upcoming">Upcoming</option>
                      <option value="active">Active</option>
                      <option value="past">Past</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-gray-300">Expected Attendees</Label>
                    <Input
                      type="number"
                      value={formData.attendees}
                      onChange={(e) =>
                        setFormData({ ...formData, attendees: e.target.value })
                      }
                      min="0"
                      disabled={isLoading}
                      className="mt-2 bg-[#1a1a2e]/50 border-blue-900/40 text-white"
                    />
                  </div>
                </div>

                {/* Registration Link */}
                <div>
                  <Label className="text-gray-300">Registration Link</Label>
                  <Input
                    value={formData.registration_link}
                    onChange={(e) =>
                      setFormData({ ...formData, registration_link: e.target.value })
                    }
                    placeholder="https://example.com/register"
                    disabled={isLoading}
                    className="mt-2 bg-[#1a1a2e]/50 border-blue-900/40 text-white"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-4 pt-4">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-black font-semibold"
                  >
                    {isLoading ? "Saving..." : editingEvent ? "Update Event" : "Create Event"}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => !isLoading && resetForm()}
                    disabled={isLoading}
                    variant="outline"
                    className="flex-1 border-gray-600 text-gray-300"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Events List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="grid gap-4"
      >
        <AnimatePresence>
          {filteredEvents.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-16 bg-[#0d0d1a]/80 rounded-2xl border border-blue-900/40"
            >
              <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-blue-400" />
              </div>
              <p className="text-white font-semibold text-lg mb-1">No events found</p>
              <p className="text-gray-400 text-sm">
                {activeTab === "all" ? "Create your first event to get started!" : `No ${activeTab} events yet.`}
              </p>
            </motion.div>
          ) : (
            filteredEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className="bg-[#121224]/70 backdrop-blur-md rounded-2xl overflow-hidden border border-blue-900/40 hover:border-blue-900/60 transition-all duration-300 group"
              >
                {/* Event Image */}
                {event.image_url && (
                  <div className="relative h-24 sm:h-32 md:h-40 overflow-hidden bg-[#0a0a14]">
                    <img
                      src={event.image_url}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}

                <div className="p-4 sm:p-5 md:p-6">
                  <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-2 flex-wrap">
                        <h4 className="text-base sm:text-lg md:text-xl font-bold text-white line-clamp-2">{event.title}</h4>
                        <span
                          className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold border capitalize whitespace-nowrap flex-shrink-0 ${getStatusBadge(
                            event.status
                          )}`}
                        >
                          {event.status}
                        </span>
                      </div>
                      <p className="text-gray-400 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2">{event.description}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleEdit(event)}
                        disabled={isLoading}
                        className="p-1.5 sm:p-2 bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 rounded-lg transition-colors"
                      >
                        <Edit2 className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(event.id)}
                        disabled={isLoading}
                        className="p-1.5 sm:p-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-blue-900/40">
                    <div className="flex items-start gap-1.5 sm:gap-2">
                      <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">Date</p>
                        <p className="text-xs sm:text-sm font-semibold text-white truncate">{event.date}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-1.5 sm:gap-2">
                      <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">Time</p>
                        <p className="text-xs sm:text-sm font-semibold text-white truncate">{event.time}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-1.5 sm:gap-2">
                      <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">Location</p>
                        <p className="text-xs sm:text-sm font-semibold text-white truncate">{event.location}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-1.5 sm:gap-2">
                      <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">Attendees</p>
                        <p className="text-xs sm:text-sm font-semibold text-white">{event.attendees}</p>
                      </div>
                    </div>
                  </div>
                  {event.registration_link && (
                    <div className="mt-4 pt-4 border-t border-blue-900/40">
                      <a
                        href={event.registration_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span className="font-semibold">Register here</span>
                      </a>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
