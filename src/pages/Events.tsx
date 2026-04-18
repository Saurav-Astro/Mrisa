import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { Calendar, Clock, Users, MapPin, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Scene3D } from "@/components/Scene3D";
import ReactMarkdown from 'react-markdown';
import { fetchEvents as fetchEventsApi, fetchRegistrationCount } from "@/lib/api";
import { slugify } from "@/lib/slugify";

interface CTFEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  status: "upcoming" | "active" | "past";
  image_url: string | null;
  attendees: number;
  registration_link?: string;
  participation_type?: "solo" | "team";
  registration_open?: boolean;
}

const filterOptions: Array<CTFEvent["status"] | "all"> = ["all", "upcoming", "active", "past"];

// 3D Interactive Event Card with live registration count
const EventCard = ({ event }: { event: CTFEvent }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [liveCount, setLiveCount] = useState<number | null>(null);

  const rotateX = useTransform(y, [-150, 150], [-10, 10]);
  const rotateY = useTransform(x, [-150, 150], [10, -10]);

  useEffect(() => {
    fetchRegistrationCount(event.id).then(setLiveCount);
  }, [event.id]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const statusStyles = {
    upcoming: { border: "border-green-500", badge: "bg-green-500/10 text-green-400", dot: "bg-green-400" },
    active:   { border: "border-blue-500",  badge: "bg-blue-500/10 text-blue-400",   dot: "bg-blue-400" },
    past:     { border: "border-gray-600",  badge: "bg-gray-500/10 text-gray-400",   dot: "bg-gray-400" },
  };
  const style = statusStyles[event.status] ?? statusStyles.past;

  const handleRegister = () => {
    if (event.registration_link) {
      window.open(event.registration_link, "_blank");
    } else {
      window.open(`/register/${slugify(event.title)}`, "_blank");
    }
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className={`relative bg-[#121224]/70 backdrop-blur-md rounded-xl border ${style.border} transition-shadow duration-300 hover:shadow-2xl hover:shadow-green-500/10 overflow-hidden flex flex-col`}
    >
      {/* Event Image */}
      <div className="relative h-32 sm:h-40 overflow-hidden bg-[#0a0a14] flex-shrink-0">
        <img
          src={event.image_url || "/default_image/meisa_default.jpeg"}
          alt={event.title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          onError={(e) => { (e.target as HTMLImageElement).src = "/default_image/meisa_default.jpeg"; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#121224] via-transparent to-transparent" />
        {/* Status badge overlaid on image */}
        <div className="absolute top-3 right-3">
          <span className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-full border border-white/10 backdrop-blur-sm ${style.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${style.dot} animate-pulse`} />
            {event.status}
          </span>
        </div>
      </div>

      <div style={{ transform: "translateZ(20px)" }} className="p-4 sm:p-5 flex-1 flex flex-col">
        {/* Title */}
        <h3 className="text-base sm:text-lg font-bold text-white line-clamp-2 mb-2 leading-tight">{event.title}</h3>
        {/* Description */}
        <div className="text-gray-400 text-xs sm:text-sm mb-4 line-clamp-2 flex-1 prose prose-invert prose-xs sm:prose-sm max-w-none"><ReactMarkdown>{event.description}</ReactMarkdown></div>

        {/* Meta info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Calendar className="h-3.5 w-3.5 flex-shrink-0 text-green-500/70" />
            <span>{event.date}</span>
            <Clock className="h-3.5 w-3.5 flex-shrink-0 text-blue-500/70 ml-1" />
            <span>{event.time}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-yellow-500/70" />
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`} target="_blank" rel="noopener noreferrer" className="truncate hover:text-blue-400 transition-colors">{event.location}</a>
          </div>
          {/* Live registration count */}
          <div className="flex items-center gap-2 text-xs">
            <Users className="h-3.5 w-3.5 flex-shrink-0 text-purple-400/70" />
            {liveCount === null ? (
              <span className="text-gray-600">Loading...</span>
            ) : (
              <span className="text-purple-300 font-semibold">
                {liveCount}{" "}
                <span className="text-gray-500 font-normal">
                  registered {event.participation_type === "team" ? "team" + (liveCount !== 1 ? "s" : "") : "solo"}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Action button */}
        <div style={{ transform: "translateZ(30px)" }}>
          {/* Registration Closed Cases */}
          {(event.registration_open === false) ? (
            <div className="w-full bg-gray-800/60 border border-gray-700/50 rounded-xl h-10 flex items-center justify-center gap-2 text-xs text-gray-500">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              Registration Closed
            </div>
          ) : event.status === "upcoming" ? (
            <Button onClick={handleRegister} className="w-full bg-green-500 text-black hover:bg-green-400 h-9 sm:h-10 text-xs sm:text-sm font-bold">
              Register Now
            </Button>
          ) : event.status === "past" ? (
            <Link to="/winners" className="block">
              <Button className="w-full bg-blue-500 text-white hover:bg-blue-400 h-9 sm:h-10 text-xs sm:text-sm">
                View Results
              </Button>
            </Link>
          ) : event.status === "active" ? (
            <Button onClick={handleRegister} className="w-full bg-blue-500 text-white hover:bg-blue-400 h-9 sm:h-10 text-xs sm:text-sm font-bold animate-pulse">
              Register Now
            </Button>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
};

// Main Events Page Component
const Events = () => {
  const [events, setEvents] = useState<CTFEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "upcoming" | "active" | "past">("all");

  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true);
      try {
        const data = await fetchEventsApi();
        setEvents(data || []);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };
    void loadEvents();
  }, []);

  const filteredEvents = Array.isArray(events) ? events.filter(e => filter === "all" || e.status === filter) : [];

  return (
    <div className="relative text-gray-200">
      <div className="fixed inset-0 z-0"><Scene3D /></div>
      <div className="relative z-10 min-h-screen py-8 sm:py-12 md:py-16 lg:py-20">
        <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8 sm:mb-10 md:mb-16">
            <h1
              className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-sans font-bold mb-3 sm:mb-4 md:mb-6 text-white"
              style={{ textShadow: '0 0 20px rgba(0, 255, 150, 0.5)' }}
            >
              Events
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-300 max-w-3xl mx-auto px-2">
              Test your skills in our cutting-edge cybersecurity competitions against a global community of hackers.
            </p>
          </motion.div>

          {/* Filter tabs */}
          <div className="flex justify-center mb-8 sm:mb-10 md:mb-12 px-2 sm:px-0 overflow-x-auto">
            <div className="flex gap-1 sm:gap-2 bg-[#121224]/70 backdrop-blur-md rounded-lg p-1 sm:p-2 border border-blue-900/40 whitespace-nowrap">
              {filterOptions.map(option => (
                <button
                  key={option}
                  onClick={() => setFilter(option)}
                  className="relative px-3 sm:px-6 py-2 rounded-md font-mono text-xs sm:text-sm transition-colors text-gray-300 hover:text-white"
                >
                  {filter === option && (
                    <motion.div layoutId="filter-active" className="absolute inset-0 bg-green-500/30 rounded-md" />
                  )}
                  <span className="relative z-10 capitalize">{option}</span>
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 sm:py-16 md:py-20">
              <Shield className="h-12 sm:h-16 w-12 sm:w-16 text-green-500 animate-pulse mx-auto mb-3 sm:mb-4" />
              <h3 className="text-lg sm:text-xl md:text-2xl font-mono text-white">Querying Event Matrix...</h3>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={filter}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8"
              >
                {filteredEvents.map((event) => <EventCard key={event.id} event={event} />)}
              </motion.div>
            </AnimatePresence>
          )}

          {!loading && filteredEvents.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 sm:py-16 md:py-20">
              <h3 className="text-lg sm:text-xl md:text-2xl font-mono text-green-400 mb-2 sm:mb-4">No Events Found</h3>
              <p className="text-sm sm:text-base text-gray-400">There are currently no {filter} events. Please check back later.</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Events;
