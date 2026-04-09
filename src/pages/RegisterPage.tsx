import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Users, CreditCard, CheckCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { submitRegistration, fetchEvents } from "@/lib/api";
import { Scene3D } from "@/components/Scene3D";

const DEFAULT_FORM_FIELDS = [
  { id: "name", label: "Name", type: "text", enabled: true, required: true },
  { id: "email", label: "Email", type: "email", enabled: true, required: true },
];

const RegisterPage = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [event, setEvent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isTeam = event?.participation_type === "team";
  const numTeamMembers = Number(event?.team_min_members) || 1;
  const maxTeamMembers = Number(event?.team_max_members) || 5;

  const [membersData, setMembersData] = useState<any[]>([{}]);
  const [paymentScreenshot, setPaymentScreenshot] = useState<string>("");
  const [teamName, setTeamName] = useState("");

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const events = await fetchEvents();
        const ev = events.find((e: any) => e.id === eventId);
        if (ev) {
          setEvent(ev);
          const minMembers = ev.participation_type === "team" ? Number(ev.team_min_members) || 1 : 1;
          setMembersData(Array.from({ length: minMembers }, () => ({})));
        }
      } catch (error) {
        toast({ title: "Error", description: "Failed to load event details", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [eventId, toast]);

  const formFields = event?.form_fields || DEFAULT_FORM_FIELDS;
  const activeFields = formFields.filter((f: any) => f.enabled);

  const handleMemberChange = (index: number, fieldId: string, value: string) => {
    const updated = [...membersData];
    updated[index] = { ...updated[index], [fieldId]: value };
    setMembersData(updated);
  };

  const addMember = () => {
    if (membersData.length < maxTeamMembers) {
      setMembersData([...membersData, {}]);
    }
  };

  const removeMember = (index: number) => {
    if (membersData.length > numTeamMembers) {
      setMembersData(membersData.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const primaryMember = membersData[0] || {};
      await submitRegistration({
        event_id: event.id,
        name: primaryMember.name || "Unknown",
        email: primaryMember.email || "unknown@domain.com",
        team_name: isTeam ? teamName : null,
        registration_type: event.registration_type,
        payment_proof_url: paymentScreenshot || null,
        team_members: membersData,
        dynamic_fields: primaryMember,
      });
      setSubmitted(true);
      toast({ title: "Registration Successful!", description: `You're registered for ${event.title}.` });
    } catch (error) {
      toast({ title: "Registration Failed", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: any, index: number) => {
    const value = membersData[index]?.[field.id] || "";
    // All members up to min_members are ALWAYS required to fill all required fields
    const isRequired = field.required && (index < numTeamMembers || event?.team_enforce_details);

    return (
      <div key={field.id}>
        <Label className="text-sm text-gray-300">
          {field.label} {isRequired && <span className="text-red-500">*</span>}
        </Label>
        {field.type === "textarea" ? (
          <Textarea
            value={value}
            onChange={(e) => handleMemberChange(index, field.id, e.target.value)}
            required={isRequired}
            className="mt-1.5 bg-[#1a1a2e]/50 border-blue-900/40 text-white focus:border-green-500/50"
          />
        ) : (
          <Input
            type={field.type === "url" ? "url" : field.type === "date" ? "date" : field.type === "email" ? "email" : "text"}
            value={value}
            onChange={(e) => handleMemberChange(index, field.id, e.target.value)}
            required={isRequired}
            className="mt-1.5 bg-[#1a1a2e]/50 border-blue-900/40 text-white focus:border-green-500/50"
          />
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 font-mono">Loading registration form...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-xl mb-4">Event not found</p>
          <Button onClick={() => navigate("/events")} variant="outline" className="border-blue-900/40 text-blue-400">
            Back to Events
          </Button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center px-4">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-md">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }}>
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
          </motion.div>
          <h2 className="text-3xl font-bold text-white mb-3">You're Registered!</h2>
          <p className="text-gray-400 mb-8">Your registration for <span className="text-green-400 font-semibold">{event.title}</span> has been submitted successfully.</p>
          <Button onClick={() => navigate("/events")} className="bg-green-500 text-black hover:bg-green-400 px-8 py-3">
            Back to Events
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen text-gray-200">
      <div className="fixed inset-0 z-0"><Scene3D /></div>
      <div className="relative z-10 min-h-screen py-8 sm:py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <Button variant="ghost" onClick={() => navigate("/events")} className="text-gray-400 hover:text-white mb-4 -ml-2">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Events
            </Button>
            <div className="bg-[#121224]/80 backdrop-blur-md rounded-2xl border border-blue-900/40 p-6 sm:p-8">
              {event.image_url && (
                <div className="h-40 sm:h-52 rounded-xl overflow-hidden mb-6 -mx-2 -mt-2">
                  <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "/default_image/meisa_default.jpeg"; }} />
                </div>
              )}
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{event.title}</h1>
              <p className="text-gray-400 text-sm mb-4">{event.description}</p>
              <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                <span className="bg-[#1a1a2e]/80 px-3 py-1.5 rounded-full border border-blue-900/30">{event.date} • {event.time}</span>
                <span className="bg-[#1a1a2e]/80 px-3 py-1.5 rounded-full border border-blue-900/30">{event.location}</span>
                {isTeam && (
                  <span className="bg-blue-900/20 px-3 py-1.5 rounded-full border border-blue-500/30 text-blue-400 flex items-center gap-1">
                    <Users className="w-3 h-3" /> Team ({numTeamMembers}–{maxTeamMembers} members)
                  </span>
                )}
                {event.registration_type === "paid" && (
                  <span className="bg-yellow-900/20 px-3 py-1.5 rounded-full border border-yellow-500/30 text-yellow-400 flex items-center gap-1">
                    <CreditCard className="w-3 h-3" /> Paid Event
                  </span>
                )}
              </div>
            </div>
          </motion.div>

          {/* Registration Form */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Team Name */}
              {isTeam && (
                <div className="bg-[#121224]/80 backdrop-blur-md rounded-2xl border border-blue-900/40 p-6">
                  <h3 className="text-lg font-bold text-blue-400 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5" /> Team Information
                  </h3>
                  <div>
                    <Label className="text-sm text-gray-300">Team Name <span className="text-red-500">*</span></Label>
                    <Input value={teamName} onChange={(e) => setTeamName(e.target.value)} required className="mt-1.5 bg-[#1a1a2e]/50 border-blue-900/40 text-white focus:border-green-500/50" placeholder="Enter your team name" />
                  </div>
                  {isTeam && (
                    <p className="text-xs text-gray-500 mt-3">
                      Minimum {numTeamMembers} member{numTeamMembers > 1 ? "s" : ""} required. All members must complete the registration form. You can add up to {maxTeamMembers} members.
                    </p>
                  )}
                </div>
              )}

              {/* Member Forms */}
              {membersData.map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                  className="bg-[#121224]/80 backdrop-blur-md rounded-2xl border border-blue-900/40 p-6"
                >
                  <div className="flex justify-between items-center mb-5 pb-3 border-b border-blue-900/30">
                    <h3 className="text-lg font-bold text-white">
                      {isTeam ? (
                        <>
                          <span className="text-blue-400">Member {index + 1}</span>
                          {index === 0 && <span className="text-gray-500 text-sm ml-2">(Primary Contact)</span>}
                          {index < numTeamMembers && <span className="text-red-400 text-xs ml-2">(Required)</span>}
                        </>
                      ) : (
                        "Your Details"
                      )}
                    </h3>
                    {isTeam && index >= numTeamMembers && (
                      <Button type="button" variant="destructive" size="sm" onClick={() => removeMember(index)} className="h-8 text-xs">
                        Remove
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {activeFields.map((f: any) => renderField(f, index))}
                  </div>
                </motion.div>
              ))}

              {/* Add Member Button */}
              {isTeam && membersData.length < maxTeamMembers && (
                <Button type="button" onClick={addMember} variant="outline" className="w-full border-blue-900/40 border-dashed text-blue-400 hover:bg-blue-900/20 h-12">
                  + Add Team Member ({membersData.length}/{maxTeamMembers})
                </Button>
              )}

              {/* Payment Section */}
              {event.registration_type === "paid" && (
                <div className="bg-[#121224]/80 backdrop-blur-md rounded-2xl border border-yellow-500/30 p-6">
                  <h3 className="text-lg font-bold text-yellow-500 mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5" /> Payment Details
                  </h3>
                  {event.payment_instructions && (
                    <p className="text-sm text-gray-300 mb-4 whitespace-pre-wrap leading-relaxed bg-yellow-900/10 p-4 rounded-xl border border-yellow-500/10">
                      {event.payment_instructions}
                    </p>
                  )}
                  {event.payment_qr_url && (
                    <div className="mb-5 bg-white p-3 rounded-xl inline-block">
                      <img src={event.payment_qr_url} alt="Payment QR" className="max-w-[220px] h-auto rounded" />
                    </div>
                  )}
                  <div>
                    <Label className="text-sm text-gray-300">Proof of Payment URL <span className="text-red-500">*</span></Label>
                    <Input
                      type="url"
                      value={paymentScreenshot}
                      onChange={(e) => setPaymentScreenshot(e.target.value)}
                      placeholder="Link to screenshot (Drive, Imgur, etc.)"
                      required
                      className="mt-1.5 bg-[#1a1a2e]/50 border-yellow-500/40 text-white focus:border-yellow-400/50"
                    />
                    <p className="text-xs text-gray-500 mt-2">Upload your payment screenshot to a cloud service and paste the public link here.</p>
                  </div>
                </div>
              )}

              {/* Submit */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2 pb-8">
                <Button type="button" variant="ghost" onClick={() => navigate("/events")} className="text-gray-400 hover:text-white sm:order-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1 bg-green-500 text-black hover:bg-green-400 h-12 text-base font-bold sm:order-2">
                  {isSubmitting ? "Submitting..." : "Complete Registration"}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
