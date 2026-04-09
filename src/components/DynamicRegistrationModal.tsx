import React, { useState } from "react";
import { DialogContent, DialogHeader, DialogTitle, DialogScrollArea } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { submitRegistration } from "@/lib/api";

export const DynamicRegistrationModal = ({ event, onClose }: { event: any, onClose: () => void }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const isTeam = event.participation_type === "team";
  const numTeamMembers = Number(event.team_min_members) || 1;
  const maxTeamMembers = Number(event.team_max_members) || 5;

  // State handles team members (array of form data objects)
  const [membersData, setMembersData] = useState<any[]>(Array.from({ length: isTeam ? numTeamMembers : 1 }).fill({}));
  const [paymentScreenshot, setPaymentScreenshot] = useState<string>("");
  const [teamName, setTeamName] = useState("");

  const formFields = event.form_fields || [
    { id: "name", label: "Name", type: "text", enabled: true, required: true },
    { id: "email", label: "Email", type: "email", enabled: true, required: true },
  ];

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
      const updated = membersData.filter((_, i) => i !== index);
      setMembersData(updated);
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
        dynamic_fields: primaryMember // Legacy backwards compat
      });
      toast({
        title: "Registration Successful!",
        description: `You're registered for ${event.title}.`,
      });
      onClose();
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: any, index: number) => {
    const value = membersData[index]?.[field.id] || "";
    // If team details enforced or it's the primary member (index 0)
    const isRequired = field.required && (index === 0 || event.team_enforce_details);

    return (
      <div key={field.id} className="mb-4">
        <Label className="text-xs sm:text-sm text-gray-300">
          {field.label} {isRequired && <span className="text-red-500">*</span>}
        </Label>
        {field.type === "textarea" ? (
          <Textarea 
            value={value} 
            onChange={(e) => handleMemberChange(index, field.id, e.target.value)} 
            required={isRequired} 
            className="mt-1 bg-[#1a1a2e]/50 border-blue-900/40 text-white" 
          />
        ) : (
          <Input 
            type={field.type === 'url' ? 'url' : field.type === 'date' ? 'date' : field.type === 'email' ? 'email' : 'text'}
            value={value} 
            onChange={(e) => handleMemberChange(index, field.id, e.target.value)} 
            required={isRequired} 
            className="mt-1 bg-[#1a1a2e]/50 border-blue-900/40 text-white" 
          />
        )}
      </div>
    );
  };

  return (
    <DialogContent className="bg-[#121224]/95 border border-blue-900/40 text-gray-200 p-0 max-w-3xl overflow-hidden h-auto max-h-[90vh] flex flex-col">
      <DialogHeader className="px-6 py-4 border-b border-blue-900/40 bg-black/20">
        <DialogTitle className="text-xl sm:text-2xl font-sans text-green-400 line-clamp-2">
          Registration: {event.title}
        </DialogTitle>
      </DialogHeader>
      
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <form id="registrationForm" onSubmit={handleSubmit} className="space-y-6">
          
          {isTeam && (
            <div className="bg-[#1a1a2e]/50 p-4 rounded-xl border border-blue-900/40 mb-6">
              <Label className="text-sm text-gray-300">Team Name *</Label>
              <Input value={teamName} onChange={e => setTeamName(e.target.value)} required className="mt-2 bg-black/20 border-blue-900/40 text-white" />
            </div>
          )}

          {membersData.map((_, index) => (
             <div key={index} className="bg-[#1a1a2e]/30 border border-blue-900/40 p-5 rounded-xl space-y-4">
                <div className="flex justify-between items-center mb-2 pb-2 border-b border-blue-900/20">
                  <h4 className="font-bold text-blue-400">{isTeam ? `Team Member ${index + 1}` : 'Your Details'}{index === 0 && ' (Primary Contact)'}</h4>
                  {isTeam && index >= numTeamMembers && (
                    <Button type="button" variant="destructive" size="sm" onClick={() => removeMember(index)} className="h-7 text-xs">Remove</Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activeFields.map((f: any) => renderField(f, index))}
                </div>
             </div>
          ))}

          {isTeam && membersData.length < maxTeamMembers && (
            <Button type="button" onClick={addMember} variant="outline" className="w-full border-blue-900/40 text-blue-400 hover:bg-blue-900/20">
               + Add Team Member
            </Button>
          )}

          {event.registration_type === "paid" && (
            <div className="bg-yellow-900/10 border border-yellow-500/20 p-5 rounded-xl mt-6">
              <h4 className="font-bold text-yellow-500 mb-2">Payment Details</h4>
              {event.payment_instructions && (
                <p className="text-sm text-gray-300 mb-4 whitespace-pre-wrap leading-relaxed">{event.payment_instructions}</p>
              )}
              {event.payment_qr_url && (
                <div className="mb-4 bg-white p-2 rounded-lg inline-block">
                  <img src={event.payment_qr_url} alt="Payment QR" className="max-w-[200px] h-auto rounded" />
                </div>
              )}
              <div>
                <Label className="text-sm text-gray-300">Proof of Payment URL *</Label>
                <Input type="url" value={paymentScreenshot} onChange={e => setPaymentScreenshot(e.target.value)} placeholder="Link to screenshot (Drive, Imgur, etc.)" required className="mt-2 bg-black/20 border-yellow-500/40 text-white" />
                <p className="text-xs text-gray-500 mt-2">Please upload your payment screenshot to a cloud service and paste the public link here.</p>
              </div>
            </div>
          )}

        </form>
      </div>

      <div className="px-6 py-4 border-t border-blue-900/40 bg-black/20 flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting} className="text-gray-400 hover:text-white">Cancel</Button>
        <Button type="submit" form="registrationForm" disabled={isSubmitting} className="bg-green-500 text-black hover:bg-green-400">
          {isSubmitting ? "Submitting..." : "Complete Registration"}
        </Button>
      </div>
    </DialogContent>
  );
};
