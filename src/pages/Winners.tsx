import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Crown, Zap, Calendar, Users, Trophy } from "lucide-react";
import { Scene3D } from "@/components/Scene3D";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { fetchEvents, fetchWinners } from "@/lib/api";
import type { Variants } from "framer-motion";

// Data structure for a winner
interface Winner {
  id: string;
  player_name: string;
  team_name: string | null;
  rank: number;
  image_url: string | null;
  team_members: string | null;
}

// Data structure for an event with its winners
interface EventWithWinners {
  id: string;
  title: string;
  date: string;
  winners: Winner[];
}

interface Event {
  id: string;
  title: string;
  date: string;
}

interface WinnerRecord {
    id: string;
    event_id: string;
    player_name: string;
    team_name: string | null;
    rank: number;
    image_url: string | null;
    team_members: string | null;
}

const getRankColor = (rank: number) => {
    if (rank === 1) return { border: "border-yellow-400", shadow: "shadow-[0_0_25px_rgba(250,204,21,0.7)]" };
    if (rank === 2) return { border: "border-gray-400", shadow: "shadow-[0_0_20px_rgba(156,163,175,0.6)]" };
    if (rank === 3) return { border: "border-amber-600", shadow: "shadow-[0_0_20px_rgba(217,119,6,0.6)]" };
    return { border: "border-blue-900/40", shadow: "" };
};

const WinnerCard = ({ winner, variants }: { winner: Winner, variants: Variants }) => {
    const { border, shadow } = getRankColor(winner.rank);
    return (
        <motion.div
            variants={variants}
            whileHover={{ y: -8, scale: 1.03, transition: { type: "spring", stiffness: 300, damping: 20 } }}
            className={`relative flex flex-col bg-[#121224]/70 backdrop-blur-md rounded-lg sm:rounded-xl overflow-hidden h-full border ${border} ${shadow}`}
        >
            {winner.rank === 1 && <div className="absolute top-0 left-0 w-full h-1 bg-yellow-400 animate-pulse" />}
            <div className="relative h-32 sm:h-40">
                <img src={winner.image_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${winner.player_name}`} alt={winner.player_name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#121224] to-transparent" />
                <motion.div
                    animate={winner.rank <= 3 ? { scale: [1, 1.05, 1] } : {}}
                    transition={winner.rank <= 3 ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : {}}
                    className={`absolute -bottom-4 sm:-bottom-6 left-4 sm:left-6 flex items-center justify-center w-10 sm:w-12 h-10 sm:h-12 bg-[#121224] rounded-full border-2 text-lg sm:text-xl font-bold font-mono text-white ${border}`}
                >
                    #{winner.rank}
                </motion.div>
            </div>
            <div className="p-4 sm:p-6 pt-8 sm:pt-10 flex-grow flex flex-col">
                <h3 className="text-lg sm:text-2xl font-sans font-bold text-white mb-2 line-clamp-2">{winner.team_name || winner.player_name}</h3>
                {winner.team_name && (
                  <div className="text-xs sm:text-sm text-gray-300 mb-2 sm:mb-3">
                    <p className="font-semibold text-blue-400 mb-1">Team Lead: {winner.player_name}</p>
                  </div>
                )}
                {winner.team_members && (
                  <div className="text-xs text-gray-300 mb-2 sm:mb-3 space-y-0.5 sm:space-y-1">
                    <p className="font-semibold text-green-400 mb-1 sm:mb-2">Team Members:</p>
                    <ul className="ml-3 sm:ml-4 space-y-0.5 sm:space-y-1">
                      {winner.team_members.split('\n').map((member, idx) => (
                        member.trim() && <li key={idx} className="text-gray-300 truncate">• {member.trim()}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="flex items-center space-x-2 text-green-400 mt-auto">
                    <Zap className="h-4 sm:h-5 w-4 sm:w-5 flex-shrink-0" />
                    <span className="text-base sm:text-lg font-mono font-bold">Rank #{winner.rank}</span>
                </div>
            </div>
        </motion.div>
    );
};

const EventWinnersSection = ({ event }: { event: EventWithWinners }) => {
    const topThree = event.winners.slice(0, 3).sort((a, b) => a.rank - b.rank);
    const otherWinners = event.winners.slice(3);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 },
    };

    return (
        <motion.section
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mb-16 sm:mb-20 md:mb-24"
        >
            <div className="bg-[#121224]/70 backdrop-blur-md rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 border border-blue-900/40 mb-8 sm:mb-10 md:mb-12">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    <div className="text-green-400 flex-shrink-0"><Crown size={28} className="sm:w-8 sm:h-8" /></div>
                    <div>
                        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-sans font-bold text-white">{event.title}</h2>
                        <div className="flex items-center text-gray-400 text-xs sm:text-sm mt-1">
                            <Calendar className="h-3 sm:h-4 w-3 sm:w-4 mr-2 flex-shrink-0" />
                            <span>{new Date(event.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                    </div>
                </div>
            </div>

            {topThree.length > 0 && (
                 <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="flex flex-col md:flex-row justify-center items-end gap-4 sm:gap-6 md:gap-8 mb-12 sm:mb-16"
                >
                    {topThree.find(w => w.rank === 2) && <motion.div variants={itemVariants} className="w-full md:w-1/3 order-2 md:order-1"><WinnerCard winner={topThree.find(w => w.rank === 2)!} variants={itemVariants} /></motion.div>}
                    {topThree.find(w => w.rank === 1) && <motion.div variants={itemVariants} className="w-full md:w-1/3 order-1 md:order-2 mb-0 md:mb-8"><WinnerCard winner={topThree.find(w => w.rank === 1)!} variants={itemVariants} /></motion.div>}
                    {topThree.find(w => w.rank === 3) && <motion.div variants={itemVariants} className="w-full md:w-1/3 order-3 md:order-3"><WinnerCard winner={topThree.find(w => w.rank === 3)!} variants={itemVariants} /></motion.div>}
                </motion.div>
            )}

            {otherWinners.length > 0 && (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.1 }}
                >
                    <h3 className="col-span-full text-xl sm:text-2xl md:text-3xl font-sans font-bold text-center text-white mb-6 sm:mb-8">Elite Competitors</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
                        {otherWinners.map((winner) => <WinnerCard key={winner.id} winner={winner} variants={itemVariants} />)}
                    </div>
                </motion.div>
            )}
        </motion.section>
    );
};

const Winners = () => {
    const [events, setEvents] = useState<EventWithWinners[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const loadWinners = useCallback(async () => {
        setIsLoading(true);
        try {
            const eventsData = await fetchEvents();
            const winnersData = await fetchWinners();

            // Group winners by event
            const eventsWithWinners: EventWithWinners[] = (eventsData || []).map(
                (event: Event) => ({
                    id: event.id,
                    title: event.title,
                    date: event.date,
                    winners: (winnersData || [])
                        .filter((winner: WinnerRecord) => winner.event_id === event.id)
                        .map((winner: WinnerRecord) => ({
                            id: winner.id,
                            player_name: winner.player_name,
                            team_name: winner.team_name || null,
                            rank: winner.rank,
                            image_url: winner.image_url || null,
                            team_members: winner.team_members || null,
                        })),
                })
            );

            setEvents(eventsWithWinners);
        } catch (error) {
            console.error("Error loading winners:", error);
            const message = error instanceof Error ? error.message : "Failed to load winners data";
            toast({
                title: "Error Loading Winners",
                description: message,
                variant: "destructive",
            });
            setEvents([]);
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        void loadWinners();
    }, [loadWinners]);

    return (
        <div className="relative min-h-screen py-8 sm:py-12 md:py-16 lg:py-20 text-gray-200">
            <div className="fixed inset-0 z-0"><Scene3D /></div>
            <div className="relative z-10 container mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
                <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10 sm:mb-14 md:mb-16">
                    <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-sans font-bold mb-3 sm:mb-4 md:mb-6 text-white" style={{ textShadow: '0 0 20px rgba(0, 255, 150, 0.5)' }}>
                        Hall of Fame
                    </h1>
                    <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-300 max-w-3xl mx-auto px-2">
                        Celebrating the elite hackers from each of our challenging cybersecurity competitions.
                    </p>
                </motion.div>
                
                {isLoading ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 sm:py-16 md:py-20">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="inline-block"
                        >
                            <Crown className="h-12 sm:h-16 w-12 sm:w-16 text-yellow-400" />
                        </motion.div>
                        <h3 className="text-lg sm:text-xl md:text-2xl font-mono text-green-400 mt-3 sm:mt-4">Loading Champions...</h3>
                    </motion.div>
                ) : events.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 sm:py-16 md:py-20">
                         <Crown className="h-12 sm:h-16 w-12 sm:w-16 text-yellow-400 mx-auto mb-3 sm:mb-4" />
                         <h3 className="text-xl sm:text-2xl md:text-3xl font-mono text-green-400">The Hall is Awaiting its First Champions</h3>
                    </motion.div>
                ) : (
                    <div className="space-y-12 sm:space-y-16 md:space-y-20">
                        {events.map((event) => <EventWinnersSection key={event.id} event={event} />)}
                    </div>
                )}
                
                <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-16 sm:mt-20 md:mt-28 text-center bg-[#121224]/70 backdrop-blur-md rounded-lg sm:rounded-2xl p-6 sm:p-8 md:p-12 border border-blue-900/40">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-sans font-bold mb-4 sm:mb-6 text-white">Want to Join the Elite?</h2>
                    <p className="text-sm sm:text-base md:text-lg text-gray-300 max-w-3xl mx-auto mb-6 sm:mb-8 px-2">
                      Think you have what it takes to crack advanced systems and solve complex challenges?
                    </p>
                    <Button asChild className="bg-green-500 text-black hover:bg-green-400 transition-all duration-300 transform hover:scale-105 rounded-lg px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-base group">
                      <Link to="/events">View Upcoming Events</Link>
                    </Button>
                </motion.div>
            </div>
        </div>
    );
};

export default Winners;