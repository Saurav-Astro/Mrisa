import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Trash2, X, Trophy, Users, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { deleteWinner, fetchEvents, fetchWinners, saveWinner } from "@/lib/api";
import { sanitizeText, validateUrl, validateFormData } from "@/lib/security";

interface Event {
  id: string;
  title: string;
  date: string;
}

interface Winner {
  id: string;
  event_id: string;
  player_name: string;
  team_name: string | null;
  rank: number;
  image_url: string | null;
  team_members: string | null;
  created_at: string;
}

interface FormData {
  event_id: string;
  player_name: string;
  team_name: string;
  rank: string;
  image_url: string;
  team_members: string;
}

export const WinnersManagement = ({ showForm: externalShowForm, setShowForm: externalSetShowForm }: { showForm?: boolean; setShowForm?: (val: boolean) => void } = {}) => {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [internalShowForm, setInternalShowForm] = useState(false);
  const [editingWinner, setEditingWinner] = useState<Winner | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Use external state if provided, otherwise use internal state
  const showForm = externalShowForm !== undefined ? externalShowForm : internalShowForm;
  const setShowForm = externalSetShowForm || setInternalShowForm;

  const [formData, setFormData] = useState<FormData>({
    event_id: "",
    player_name: "",
    team_name: "",
    rank: "1",
    image_url: "",
    team_members: "",
  });

  const loadEvents = useCallback(async () => {
    try {
      const data = await fetchEvents();
      setEvents((data as Event[]) || []);
    } catch (error) {
      toast({
        title: "Error Loading Events",
        description: "Failed to load events",
        variant: "destructive",
      });
    }
  }, [toast]);

  const loadWinners = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchWinners();
      setWinners((data as Winner[]) || []);
    } catch (error) {
      toast({
        title: "Error Loading Winners",
        description: "Failed to load winners",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadEvents();
    void loadWinners();
  }, [loadEvents, loadWinners]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate required fields
      if (!formData.event_id) {
        toast({
          title: "Validation Error",
          description: "Please select an event",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (!formData.player_name.trim()) {
        toast({
          title: "Validation Error",
          description: "Please enter player name",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (!formData.rank) {
        toast({
          title: "Validation Error",
          description: "Please enter rank",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Validate rank is a positive number
      const rankNum = parseInt(formData.rank);
      if (isNaN(rankNum) || rankNum < 1 || rankNum > 1000) {
        toast({
          title: "Validation Error",
          description: "Rank must be a number between 1 and 1000",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Validate image URL if provided
      if (formData.image_url && !validateUrl(formData.image_url)) {
        toast({
          title: "Validation Error",
          description: "Invalid image URL format",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Sanitize text inputs to prevent XSS
      const sanitizedPlayerName = sanitizeText(formData.player_name.trim());
      const sanitizedTeamName = formData.team_name ? sanitizeText(formData.team_name.trim()) : null;
      const sanitizedTeamMembers = formData.team_members ? sanitizeText(formData.team_members.trim()) : null;

      if (!sanitizedPlayerName) {
        toast({
          title: "Validation Error",
          description: "Player name contains invalid characters",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const winnerData = {
        event_id: formData.event_id,
        player_name: sanitizedPlayerName,
        team_name: sanitizedTeamName,
        rank: rankNum,
        image_url: formData.image_url ? formData.image_url.trim() : null,
        team_members: sanitizedTeamMembers,
      };

      if (editingWinner) {
        await saveWinner(winnerData, editingWinner.id);
        toast({
          title: "Success",
          description: "Winner updated successfully",
        });
      } else {
        await saveWinner(winnerData);
        toast({
          title: "Success",
          description: "Winner added successfully",
        });
      }

      resetForm();
      await loadWinners();
    } catch (error) {
      console.error("Full error:", error);
      const message = error instanceof Error ? error.message : "Failed to save winner";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this winner?")) return;

    setIsLoading(true);
    try {
      await deleteWinner(id);
      toast({
        title: "Success",
        description: "Winner deleted successfully",
      });
      await loadWinners();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete winner",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (winner: Winner) => {
    setEditingWinner(winner);
    setFormData({
      event_id: winner.event_id,
      player_name: winner.player_name,
      team_name: winner.team_name || "",
      rank: winner.rank.toString(),
      image_url: winner.image_url || "",
      team_members: "",
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      event_id: "",
      player_name: "",
      team_name: "",
      rank: "1",
      image_url: "",
      team_members: "",
    });
    setEditingWinner(null);
    setShowForm(false);
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return "from-yellow-500 to-yellow-600";
    if (rank === 2) return "from-gray-400 to-gray-500";
    if (rank === 3) return "from-amber-600 to-amber-700";
    return "from-blue-500 to-blue-600";
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    if (rank === 2) return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    if (rank === 3) return "bg-amber-600/20 text-amber-400 border-amber-600/30";
    return "bg-blue-500/20 text-blue-400 border-blue-500/30";
  };

  const getEventTitle = (eventId: string) => {
    return events.find((e) => e.id === eventId)?.title || "Unknown Event";
  };

  const winnersByEvent = events.map((event) => ({
    event,
    winners: winners.filter((w) => w.event_id === event.id),
  }));

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Create/Edit Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => !isLoading && resetForm()}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#121224]/95 border border-blue-900/40 rounded-2xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start sm:items-center justify-between mb-6 gap-4">
                <h3 className="text-xl sm:text-2xl font-bold text-white flex-1">
                  {editingWinner ? "Edit Winner" : "Add New Winner"}
                </h3>
                <button
                  onClick={() => !isLoading && resetForm()}
                  className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
                >
                  <X className="h-5 sm:h-6 w-5 sm:w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* Event Selection */}
                <div>
                  <Label className="text-gray-300">Event *</Label>
                  <select
                    value={formData.event_id}
                    onChange={(e) =>
                      setFormData({ ...formData, event_id: e.target.value })
                    }
                    disabled={isLoading}
                    required
                    className="mt-2 w-full px-3 py-2 bg-[#1a1a2e]/80 border border-blue-900/40 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                  >
                    <option value="">Select an event</option>
                    {events.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Winner Type: Solo or Team */}
                <div>
                  <Label className="text-gray-300">Winner Type *</Label>
                  <div className="mt-2 flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={!formData.team_name}
                        onChange={() =>
                          setFormData({ ...formData, team_name: "" })
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-gray-300">Solo</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={!!formData.team_name}
                        onChange={() =>
                          setFormData({ ...formData, team_name: "Team" })
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-gray-300">Team</span>
                    </label>
                  </div>
                </div>

                {/* Player/Leader Name */}
                <div>
                  <Label className="text-gray-300">
                    {formData.team_name ? "Team Leader Name" : "Player Name"} *
                  </Label>
                  <Input
                    value={formData.player_name}
                    onChange={(e) =>
                      setFormData({ ...formData, player_name: e.target.value })
                    }
                    placeholder={
                      formData.team_name
                        ? "Enter team leader name"
                        : "Enter player name"
                    }
                    disabled={isLoading}
                    required
                    className="mt-2 bg-[#1a1a2e]/50 border-blue-900/40 text-white"
                  />
                </div>

                {/* Team Name (if team) */}
                {formData.team_name && (
                  <div>
                    <Label className="text-gray-300">Team Name *</Label>
                    <Input
                      value={formData.team_name}
                      onChange={(e) =>
                        setFormData({ ...formData, team_name: e.target.value })
                      }
                      placeholder="Enter team name"
                      disabled={isLoading}
                      required
                      className="mt-2 bg-[#1a1a2e]/50 border-blue-900/40 text-white"
                    />
                  </div>
                )}

                {/* Team Members (if team) */}
                {formData.team_name && (
                  <div>
                    <Label className="text-gray-300">Team Members</Label>
                    <Textarea
                      value={formData.team_members}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          team_members: e.target.value,
                        })
                      }
                      placeholder="Enter team member names (one per line)"
                      disabled={isLoading}
                      rows={3}
                      className="mt-2 bg-[#1a1a2e]/50 border-blue-900/40 text-white"
                    />
                  </div>
                )}

                {/* Rank */}
                <div>
                  <Label className="text-gray-300">Rank *</Label>
                  <Input
                    type="number"
                    value={formData.rank}
                    onChange={(e) =>
                      setFormData({ ...formData, rank: e.target.value })
                    }
                    min="1"
                    disabled={isLoading}
                    required
                    className="mt-2 bg-[#1a1a2e]/50 border-blue-900/40 text-white"
                  />
                </div>

                {/* Image URL */}
                <div>
                  <Label className="text-gray-300">Image URL</Label>
                  <Input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) =>
                      setFormData({ ...formData, image_url: e.target.value })
                    }
                    placeholder="https://example.com/image.jpg"
                    disabled={isLoading}
                    className="mt-2 bg-[#1a1a2e]/50 border-blue-900/40 text-white"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-4 pt-4">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-semibold"
                  >
                    {isLoading
                      ? "Saving..."
                      : editingWinner
                        ? "Update Winner"
                        : "Add Winner"}
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

      {/* Winners by Event */}
      <div className="space-y-8 sm:space-y-12">
        {winnersByEvent.map(({ event, winners: eventWinners }) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#121224]/70 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-blue-900/40"
          >
            {/* Event Header */}
            <div className="flex items-start sm:items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <Trophy className="h-5 sm:h-6 w-5 sm:w-6 text-yellow-400 flex-shrink-0 mt-0.5 sm:mt-0" />
              <div className="min-w-0 flex-1">
                <h3 className="text-lg sm:text-2xl font-bold text-white truncate">{event.title}</h3>
                <p className="text-gray-400 text-xs sm:text-sm">
                  {new Date(event.date).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Winners List */}
            {eventWinners.length === 0 ? (
              <div className="text-center py-8 bg-[#0d0d1a]/60 rounded-xl border border-blue-900/20">
                <Trophy className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">
                  No winners added for this event yet
                </p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {eventWinners
                  .sort((a, b) => a.rank - b.rank)
                  .map((winner) => (
                    <motion.div
                      key={winner.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-[#1a1a2e]/50 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 border border-blue-900/40 hover:border-blue-900/60 transition-all"
                    >
                      <div className="flex items-center gap-3 sm:gap-4 flex-1 w-full min-w-0">
                        {/* Rank Badge */}
                        <div
                          className={`w-10 sm:w-12 h-10 sm:h-12 rounded-full flex items-center justify-center font-bold text-base sm:text-lg bg-gradient-to-br ${getRankColor(winner.rank)} flex-shrink-0`}
                        >
                          #{winner.rank}
                        </div>

                        {/* Winner Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 sm:gap-2 mb-0.5 sm:mb-1 flex-wrap">
                            <h4 className="text-base sm:text-lg font-bold text-white truncate">
                              {winner.player_name}
                            </h4>
                            {winner.team_name && (
                              <>
                                <Users className="h-3 sm:h-4 w-3 sm:w-4 text-green-400 flex-shrink-0" />
                                <span className="text-sm text-green-400">
                                  {winner.team_name}
                                </span>
                              </>
                            )}
                          </div>
                          {winner.team_members && (
                            <p className="text-gray-400 text-xs mb-0.5 sm:mb-1">
                              Members: {winner.team_members.replace(/\n/g, ", ")}
                            </p>
                          )}
                          {winner.image_url && (
                            <p className="text-gray-400 text-xs truncate">
                              Image: {winner.image_url}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleEdit(winner)}
                          disabled={isLoading}
                          className="p-1.5 sm:p-2 bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 rounded-lg transition-colors"
                        >
                          <Edit2 className="h-4 sm:h-5 w-4 sm:w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(winner.id)}
                          disabled={isLoading}
                          className="p-1.5 sm:p-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 sm:h-5 w-4 sm:w-5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* No Events Message */}
      {events.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 bg-[#0d0d1a]/80 rounded-2xl border border-blue-900/40"
        >
          <div className="w-16 h-16 bg-yellow-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Trophy className="h-8 w-8 text-yellow-400" />
          </div>
          <p className="text-white font-semibold text-lg mb-1">No events found</p>
          <p className="text-gray-400 text-sm">
            Create an event first to add winners.
          </p>
        </motion.div>
      )}
    </div>
  );
};
