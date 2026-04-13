import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Users, CreditCard, CheckCircle, Building2, GraduationCap, Calendar, Clock, MapPin, ArrowRight, ExternalLink } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { submitRegistration, fetchEvents, fetchRegistrationCount } from "@/lib/api";
import { Scene3D } from "@/components/Scene3D";
import ReactMarkdown from 'react-markdown';

const DEFAULT_FORM_FIELDS = [
  { id: "name", label: "Name", type: "text", enabled: true, required: true, category: "Common" },
  { id: "email", label: "Email", type: "email", enabled: true, required: true, category: "Common" },
  { id: "aadhar_number", label: "Aadhar Number", type: "text", enabled: true, required: true, category: "Organization" },
];

type RegType = "organization" | "university" | null;
type Step = "details" | "form";

const RegisterPage = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [event, setEvent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [step, setStep] = useState<Step>("details");
  const [regType, setRegType] = useState<RegType>(null);
  const [liveCount, setLiveCount] = useState<number | null>(null);

  const isTeam = event?.participation_type === "team";
  const numTeamMembers = Number(event?.team_min_members) || 1;
  const maxTeamMembers = Number(event?.team_max_members) || 5;

  const [membersData, setMembersData] = useState<any[]>([{}]);
  const [paymentScreenshot, setPaymentScreenshot] = useState<string>("");
  const [transactionId, setTransactionId] = useState<string>("");
  const [transactionIdError, setTransactionIdError] = useState<string>("");
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
          fetchRegistrationCount(eventId!).then(setLiveCount);
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

  const activeFields = formFields.filter((f: any) => {
    if (!f.enabled) return false;
    if (f.category === "Common") return true;
    if (regType === "organization" && f.category === "Organization") return true;
    if (regType === "university" && f.category === "University") return true;
    return false;
  });

  const hasOrgFields = formFields.some((f: any) => f.enabled && f.category === "Organization");
  const hasUniFields = formFields.some((f: any) => f.enabled && f.category === "University");
  const needsTypeSelection = hasOrgFields || hasUniFields;

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

  const handleProceed = (type: RegType) => {
    setRegType(type);
    setStep("form");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (event.registration_type === "paid" && !transactionId.trim()) {
      setTransactionIdError("Reference / Transaction ID is required for paid events.");
      return;
    }

    if (regType === "organization") {
      const aadharField = activeFields.find(f => f.id === "aadhar_number" || (f.label && f.label.toLowerCase().includes("aadhar")));
      const aadharFieldId = aadharField?.id || "aadhar_number";
      
      for (let i = 0; i < membersData.length; i++) {
        const aadhar = membersData[i][aadharFieldId];
        if (!aadhar || aadhar.length !== 12 || !/^\d+$/.test(aadhar)) {
          toast({
            title: `Invalid Aadhar for Member ${i + 1}`,
            description: "Aadhar Number must be exactly 12 digits.",
            variant: "destructive",
          });
          return;
        }
      }
      
      const aadhars = membersData.map(m => m[aadharFieldId]).filter(Boolean);
      const uniqueAadhars = new Set(aadhars);
      if (uniqueAadhars.size !== aadhars.length) {
        toast({
          title: "Duplicate Aadhar Numbers",
          description: "Each member in your team must have a unique Aadhar number and it must not repeat.",
          variant: "destructive",
        });
        return;
      }
    }

    setTransactionIdError("");
    setIsSubmitting(true);
    try {
      const primaryMember = membersData[0] || {};
      await submitRegistration({
        event_id: event.id,
        name: primaryMember.name || "Unknown",
        email: primaryMember.email || "unknown@domain.com",
        team_name: isTeam ? teamName : null,
        registration_type: event.registration_type,
        registration_category: regType,
        payment_proof_url: paymentScreenshot || null,
        transaction_id: transactionId.trim() || null,
        team_members: membersData,
        dynamic_fields: primaryMember,
      });
      setSubmitted(true);
      toast({ title: "Registration Successful!", description: `You're registered for ${event.title}.` });
    } catch (error: any) {
      const msg = error?.message || "";
      if (msg.includes("DUPLICATE_TRANSACTION_ID") || error?.status === 409 || msg.toLowerCase().includes("duplicate")) {
        if (msg.includes("Aadhar") || msg.includes("AADHAR") || msg.toLowerCase().includes("aadhar")) {
          toast({
            title: "Aadhar Already Registered",
            description: "One or more Aadhar numbers in this team are already registered for this event.",
            variant: "destructive",
          });
        } else {
          setTransactionIdError("This Transaction ID has already been used. Please check your payment details and enter the correct unique ID.");
          toast({
            title: "Duplicate Transaction ID",
            description: "This Reference / Transaction ID is already registered. Each payment must be unique.",
            variant: "destructive",
          });
        }
      } else {
        toast({ title: "Registration Failed", description: "Something went wrong. Please try again.", variant: "destructive" });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: any, index: number) => {
    const value = membersData[index]?.[field.id] || "";
    const isRequired = field.required && (index < numTeamMembers || event?.team_enforce_details);
    const isAadharField = field.id === "aadhar_number" || field.label.toLowerCase().includes("aadhar");

    const handleChange = (val: string) => {
      if (isAadharField) {
        const numericValue = val.replace(/\D/g, "").slice(0, 12);
        handleMemberChange(index, field.id, numericValue);
      } else {
        handleMemberChange(index, field.id, val);
      }
    };

    return (
      <div key={field.id}>
        <Label className="text-sm text-gray-300">
          {field.label} {isRequired && <span className="text-red-500">*</span>}
        </Label>
        {field.type === "textarea" ? (
          <Textarea
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            required={isRequired}
            className="mt-1.5 bg-[#1a1a2e]/50 border-blue-900/40 text-white focus:border-green-500/50"
          />
        ) : (
          <div className="relative">
            <Input
              type={isAadharField ? "tel" : field.type === "url" ? "url" : field.type === "date" ? "date" : field.type === "email" ? "email" : "text"}
              inputMode={isAadharField ? "numeric" : undefined}
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              required={isRequired}
              placeholder={isAadharField ? "12-digit Aadhar number" : ""}
              className={`mt-1.5 bg-[#1a1a2e]/50 border-blue-900/40 text-white focus:border-green-500/50 ${isAadharField && value.length > 0 && value.length < 12 ? 'border-yellow-500/50' : ''}`}
            />
            {isAadharField && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {value.length === 12 ? (
                  <span className="text-green-500 text-[10px] font-bold">12/12</span>
                ) : value.length > 0 ? (
                  <span className="text-yellow-500 text-[10px] font-bold">{value.length}/12</span>
                ) : null}
              </div>
            )}
          </div>
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

  if (event.registration_open === false) {
    return (
      <div className="relative min-h-screen bg-[#0a0a14] flex items-center justify-center px-4">
        <div className="fixed inset-0 z-0"><Scene3D /></div>
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative z-10 text-center max-w-lg w-full"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
            className="w-28 h-28 mx-auto mb-6 rounded-2xl bg-red-900/20 border border-red-500/30 flex items-center justify-center"
          >
            <svg className="w-14 h-14 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </motion.div>

          <h1 className="text-3xl font-bold text-white mb-3">Registration Closed</h1>
          <p className="text-gray-400 mb-2 leading-relaxed">
            Registrations for <span className="text-red-400 font-semibold">{event.title}</span> are currently closed.
          </p>
          <p className="text-gray-600 text-sm mb-8">
            Please check back later or contact the organiser for more information.
          </p>

          <div className="bg-[#121224]/80 backdrop-blur-md border border-red-900/30 rounded-2xl p-5 mb-8 text-left">
            <div className="flex items-center gap-3 mb-3">
              {event.image_url && (
                <img src={event.image_url} alt={event.title}
                  className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              )}
              <div>
                <h2 className="text-white font-bold text-lg leading-tight">{event.title}</h2>
                <span className="text-xs text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full">
                  Locked Registration
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="bg-[#1a1a2e]/60 rounded-lg p-3 text-center">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Date</p>
                <p className="text-white text-sm font-medium mt-0.5">{event.date}</p>
              </div>
              <div className="bg-[#1a1a2e]/60 rounded-lg p-3 text-center">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Time</p>
                <p className="text-white text-sm font-medium mt-0.5">{event.time}</p>
              </div>
              <div className="bg-[#1a1a2e]/60 rounded-lg p-3 text-center">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Status</p>
                <p className="text-white text-sm font-medium mt-0.5 capitalize">{event.status}</p>
              </div>
            </div>
          </div>

          <Button onClick={() => navigate("/events")} className="bg-gray-700 hover:bg-gray-600 text-gray-200 px-8 py-3">
            Back to Events
          </Button>
        </motion.div>
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
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <Button variant="ghost" onClick={() => step === "form" ? setStep("details") : navigate("/events")} className="text-gray-400 hover:text-white mb-4 -ml-2">
              <ArrowLeft className="w-4 h-4 mr-2" /> {step === "form" ? "Back to Event Details" : "Back to Events"}
            </Button>
          </motion.div>

          <AnimatePresence mode="wait">
            {step === "details" && (
              <motion.div key="details" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                <div className="bg-[#121224]/80 backdrop-blur-md rounded-2xl border border-blue-900/40 overflow-hidden">
                  <div className="h-48 sm:h-64 overflow-hidden bg-[#0a0a14] relative">
                    <img src={event.image_url || "/default_image/meisa_default.jpeg"} alt={event.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "/default_image/meisa_default.jpeg"; }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#121224] via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                      <span className={`text-[10px] uppercase tracking-wider px-3 py-1 rounded-full border mb-3 inline-block ${event.status === 'active' ? 'bg-green-500/10 border-green-500/30 text-green-400' : event.status === 'upcoming' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-gray-500/10 border-gray-500/30 text-gray-400'}`}>
                        {event.status}
                      </span>
                      <h1 className="text-2xl sm:text-4xl font-bold text-white leading-tight">{event.title}</h1>
                    </div>
                  </div>
                  <div className="p-6 sm:p-8">
                    <div className="prose prose-invert prose-sm sm:prose-base max-w-none text-gray-400 mb-6 leading-relaxed"><ReactMarkdown>{event.description}</ReactMarkdown></div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
                      <div className="flex items-center gap-3 bg-[#1a1a2e]/50 px-4 py-3 rounded-xl border border-blue-900/20">
                        <Calendar className="w-5 h-5 text-green-400 flex-shrink-0" />
                        <div><p className="text-[10px] uppercase text-gray-500 tracking-wider">Date</p><p className="text-sm text-white">{event.date}</p></div>
                      </div>
                      <div className="flex items-center gap-3 bg-[#1a1a2e]/50 px-4 py-3 rounded-xl border border-blue-900/20">
                        <Clock className="w-5 h-5 text-blue-400 flex-shrink-0" />
                        <div><p className="text-[10px] uppercase text-gray-500 tracking-wider">Time</p><p className="text-sm text-white">{event.time}</p></div>
                      </div>
                      <div className="flex items-center gap-3 bg-[#1a1a2e]/50 px-4 py-3 rounded-xl border border-blue-900/20">
                        <MapPin className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                        <div><p className="text-[10px] uppercase text-gray-500 tracking-wider">Location</p><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`} target="_blank" rel="noopener noreferrer" className="text-sm text-white hover:text-blue-400 transition-colors flex items-center gap-1">{event.location} <ExternalLink className="w-3 h-3 text-gray-500" /></a></div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {isTeam && <span className="bg-blue-900/20 px-3 py-1.5 rounded-full border border-blue-500/30 text-blue-400 flex items-center gap-1.5 text-xs"><Users className="w-3 h-3" /> Team ({numTeamMembers}-{maxTeamMembers} members)</span>}
                      {event.registration_type === "paid" && <span className="bg-yellow-900/20 px-3 py-1.5 rounded-full border border-yellow-500/30 text-yellow-400 flex items-center gap-1.5 text-xs"><CreditCard className="w-3 h-3" /> Paid Event</span>}
                      <span className="bg-green-900/20 px-3 py-1.5 rounded-full border border-green-500/30 text-green-400 text-xs flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />{liveCount === null ? '...' : liveCount} registered {event.participation_type==="team"?`team${liveCount!==1?"s":""}`:"solo"}</span>
                    </div>
                  </div>
                </div>

                {needsTypeSelection ? (
                  <div className="bg-[#121224]/80 backdrop-blur-md rounded-2xl border border-blue-900/40 p-6 sm:p-8">
                    <h2 className="text-xl font-bold text-white mb-2">Choose Your Registration Type</h2>
                    <p className="text-gray-500 text-sm mb-6">Select the category that best describes you to proceed with registration.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {hasOrgFields && (
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleProceed("organization")} className="group relative bg-[#1a1a2e]/50 border border-blue-900/40 hover:border-emerald-500/50 rounded-2xl p-6 text-left transition-all hover:shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition-colors"><Building2 className="w-6 h-6 text-emerald-400" /></div>
                          <h3 className="text-lg font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">Organization</h3>
                          <p className="text-gray-500 text-xs leading-relaxed">For working professionals and organization representatives.</p>
                          <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-emerald-400 absolute top-6 right-6 transition-colors" />
                        </motion.button>
                      )}
                      {hasUniFields && (
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleProceed("university")} className="group relative bg-[#1a1a2e]/50 border border-blue-900/40 hover:border-violet-500/50 rounded-2xl p-6 text-left transition-all hover:shadow-[0_0_30px_rgba(139,92,246,0.1)]">
                          <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center mb-4 group-hover:bg-violet-500/20 transition-colors"><GraduationCap className="w-6 h-6 text-violet-400" /></div>
                          <h3 className="text-lg font-bold text-white mb-1 group-hover:text-violet-400 transition-colors">University</h3>
                          <p className="text-gray-500 text-xs leading-relaxed">For students and university representatives.</p>
                          <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-violet-400 absolute top-6 right-6 transition-colors" />
                        </motion.button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center"><Button onClick={() => handleProceed(null)} className="bg-green-500 text-black hover:bg-green-400 h-12 px-10 text-base font-bold">Proceed to Registration <ArrowRight className="w-5 h-5 ml-2" /></Button></div>
                )}
              </motion.div>
            )}

            {step === "form" && (
              <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                {regType && (
                  <div className="mb-6 flex items-center gap-3">
                    <span className="text-gray-500 text-sm">Registering as:</span>
                    <span className={`px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2 ${regType === 'organization' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-violet-500/10 border border-violet-500/30 text-violet-400'}`}>
                      {regType === "organization" ? <Building2 className="w-4 h-4" /> : <GraduationCap className="w-4 h-4" />}
                      {regType === "organization" ? "Organization" : "University"}
                    </span>
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {isTeam && (
                    <div className="bg-[#121224]/80 backdrop-blur-md rounded-2xl border border-blue-900/40 p-6">
                      <h3 className="text-lg font-bold text-blue-400 mb-4 flex items-center gap-2"><Users className="w-5 h-5" /> Team Information</h3>
                      <div><Label className="text-sm text-gray-300">Team Name <span className="text-red-500">*</span></Label><Input value={teamName} onChange={(e) => setTeamName(e.target.value)} required className="mt-1.5 bg-[#1a1a2e]/50 border-blue-900/40 text-white focus:border-green-500/50" placeholder="Enter your team name" /></div>
                      <p className="text-xs text-gray-500 mt-3">Minimum {numTeamMembers} member{numTeamMembers > 1 ? "s" : ""} required. All members must complete the registration form. Up to {maxTeamMembers} members.</p>
                    </div>
                  )}
                  {membersData.map((_, index) => (
                    <motion.div key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * index }} className="bg-[#121224]/80 backdrop-blur-md rounded-2xl border border-blue-900/40 p-6">
                      <div className="flex justify-between items-center mb-5 pb-3 border-b border-blue-900/30"><h3 className="text-lg font-bold text-white">{isTeam ? <><span className="text-blue-400">Member {index + 1}</span>{index === 0 && <span className="text-gray-500 text-sm ml-2">(Primary Contact)</span>}{index < numTeamMembers && <span className="text-red-400 text-xs ml-2">(Required)</span>}</> : "Your Details"}</h3>{isTeam && index >= numTeamMembers && <Button type="button" variant="destructive" size="sm" onClick={() => removeMember(index)} className="h-8 text-xs">Remove</Button>}</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{activeFields.map((f: any) => renderField(f, index))}</div>
                    </motion.div>
                  ))}
                  {isTeam && membersData.length < maxTeamMembers && <Button type="button" onClick={addMember} variant="outline" className="w-full border-blue-900/40 border-dashed text-blue-400 hover:bg-blue-900/20 h-12">+ Add Team Member ({membersData.length}/{maxTeamMembers})</Button>}
                  {event.registration_type === "paid" && (
                    <div className="bg-[#121224]/80 backdrop-blur-md rounded-2xl border border-yellow-500/30 p-6">
                      <h3 className="text-lg font-bold text-yellow-500 mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5" /> Payment Details</h3>
                      {event.payment_instructions && <p className="text-sm text-gray-300 mb-4 whitespace-pre-wrap leading-relaxed bg-yellow-900/10 p-4 rounded-xl border border-yellow-500/10">{event.payment_instructions}</p>}
                      {event.payment_qr_url && (event.payment_qr_url.startsWith('data:image') || event.payment_qr_url.startsWith('https://') || event.payment_qr_url.startsWith('http://')) && <div className="mb-5"><p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Scan to Pay</p><div className="bg-white p-3 rounded-xl inline-block"><img src={event.payment_qr_url} alt="Payment QR" className="max-w-[200px] h-auto rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /></div></div>}
                      {event.payment_link && <div className="mb-5"><a href={event.payment_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"><ExternalLink className="w-4 h-4" />Pay Now</a></div>}
                      <div className="mb-4">
                        <Label className="text-sm text-gray-300 flex items-center gap-1.5">Reference / Transaction ID <span className="text-red-500">*</span><span className="text-xs text-gray-600 font-normal ml-1">(must be unique)</span></Label>
                        <div className="relative mt-1.5"><Input type="text" value={transactionId} onChange={(e) => { setTransactionId(e.target.value); if (transactionIdError) setTransactionIdError(""); }} placeholder="e.g. TXN123456789" required className={`bg-[#1a1a2e]/50 border text-white focus:ring-0 pr-10 ${transactionIdError ? "border-red-500/70 focus:border-red-500" : transactionId.trim() ? "border-green-500/50 focus:border-green-500" : "border-yellow-500/40 focus:border-yellow-400/50"}`} />{transactionId.trim() && !transactionIdError && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400 text-sm">V</span>}{transactionIdError && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400 text-sm">X</span>}</div>
                        {transactionIdError ? <p className="text-red-400 text-xs mt-1.5 flex items-start gap-1.5"><span className="text-red-500 mt-0.5 flex-shrink-0">W</span>{transactionIdError}</p> : <p className="text-gray-600 text-xs mt-1.5">Enter the UTR / Reference number from your payment confirmation.</p>}
                      </div>
                      <div>
                        <Label className="text-sm text-gray-300">Proof of Payment URL <span className="text-red-500">*</span></Label><Input type="url" value={paymentScreenshot} onChange={(e) => setPaymentScreenshot(e.target.value)} placeholder="Link to screenshot" required className="mt-1.5 bg-[#1a1a2e]/50 border-yellow-500/40 text-white focus:border-yellow-400/50" />
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2 pb-8"><Button type="button" variant="ghost" onClick={() => setStep("details")} className="text-gray-400 hover:text-white sm:order-1">Back</Button><Button type="submit" disabled={isSubmitting} className="flex-1 bg-green-500 text-black hover:bg-green-400 h-12 text-base font-bold sm:order-2">{isSubmitting ? "Submitting..." : "Complete Registration"}</Button></div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
