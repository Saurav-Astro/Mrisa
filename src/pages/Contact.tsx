import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, MessageSquare, Send, MapPin, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Scene3D } from "@/components/Scene3D";
import { submitContactMessage } from "@/lib/api";

const contactInfo = [
  { icon: Mail, label: "Email", value: "mrisa.set@mriu.edu.in", href: "mailto:mrisa.set@mriu.edu.in" },
  { icon: MapPin, label: "Location", value: "Aravalli Hills, Delhi-Surajkund Road, Sector 43, Faridabad, Haryana, India", href:"https://maps.app.goo.gl/BCgvbDjxLt2drE65A" },
  { icon: Clock, label: "Schedule a Call", value: "For partnership opportunities, sponsorship requests, or general inquiries, please contact us.", href: "https://cal.com/mrisa" },
];

// --- NEW: Motion-wrapped input components for animation ---
const MotionInput = motion(Input);
const MotionTextarea = motion(Textarea);

const Contact = () => {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [formSubmitted, setFormSubmitted] = useState(false); // New state for success animation

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await submitContactMessage(formData);
      toast({ title: "Message Sent!", description: "We'll be in touch soon." });
      setFormSubmitted(true); // Trigger success animation
    } catch (error) {
      toast({ title: "Submission Failed", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const resetForm = () => {
      setFormData({ name: "", email: "", message: "" });
      setFormSubmitted(false);
  }

  return (
    <div className="relative text-gray-200">
      <div className="fixed inset-0 z-0"><Scene3D /></div>
      <div className="relative z-10 min-h-screen py-8 sm:py-12 md:py-16 lg:py-20">
        <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8 sm:mb-12 md:mb-16 px-2">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-sans font-bold mb-3 sm:mb-4 md:mb-6 text-white leading-tight" style={{ textShadow: '0 0 20px rgba(0, 255, 150, 0.5)' }}>
              Contact Us
            </h1>
            <p className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Have a question, partnership proposal, or want a custom event? Let's build the future of cybersecurity together.
            </p>
          </motion.div>
          <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8 lg:gap-10 max-w-6xl mx-auto" style={{ perspective: "1500px" }}>
            <motion.div
              initial={{ opacity: 0, x: -50, rotateY: 15 }} whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
              viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.8, ease: "easeOut" }}
              className="bg-[#121224]/70 backdrop-blur-md rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 border border-blue-900/40 min-h-[350px] sm:min-h-[400px] md:min-h-[450px]"
            >
              <div className="flex items-center mb-4 sm:mb-6">
                <MessageSquare className="h-4 sm:h-5 md:h-6 w-4 sm:w-5 md:w-6 text-green-400 mr-2 sm:mr-3 flex-shrink-0" />
                <h2 className="text-lg sm:text-xl md:text-2xl font-sans font-bold text-white">Send a Direct Message</h2>
              </div>
              
              {/* --- NEW: Success Animation Logic --- */}
              <AnimatePresence mode="wait">
                {!formSubmitted ? (
                  <motion.form key="form" onSubmit={handleSubmit} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3 sm:space-y-4 md:space-y-6">
                    <div>
                      <Label htmlFor="name" className="text-xs sm:text-sm md:text-base">Name *</Label>
                      <MotionInput 
                        whileFocus={{ scale: 1.01, boxShadow: '0 0 15px rgba(16,185,129,0.5)' }} 
                        id="name" 
                        name="name" 
                        value={formData.name} 
                        onChange={handleChange} 
                        required 
                        placeholder="Your full name"
                        className="mt-1 h-9 sm:h-10 md:h-11 text-xs sm:text-sm md:text-base touch-manipulation"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-xs sm:text-sm md:text-base">Email *</Label>
                      <MotionInput 
                        whileFocus={{ scale: 1.01, boxShadow: '0 0 15px rgba(16,185,129,0.5)' }} 
                        id="email" 
                        name="email" 
                        type="email" 
                        value={formData.email} 
                        onChange={handleChange} 
                        required 
                        placeholder="your.email@example.com"
                        className="mt-1 h-9 sm:h-10 md:h-11 text-xs sm:text-sm md:text-base touch-manipulation"
                      />
                    </div>
                    <div>
                      <Label htmlFor="message" className="text-xs sm:text-sm md:text-base">Message *</Label>
                      <MotionTextarea 
                        whileFocus={{ scale: 1.01, boxShadow: '0 0 15px rgba(16,185,129,0.5)' }} 
                        id="message" 
                        name="message" 
                        value={formData.message} 
                        onChange={handleChange} 
                        required 
                        rows={4}
                        placeholder="How can we help you?"
                        className="mt-1 text-xs sm:text-sm md:text-base touch-manipulation resize-none"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting} 
                      className="w-full bg-green-500 text-black hover:bg-green-400 group relative overflow-hidden h-10 sm:h-11 md:h-12 text-xs sm:text-sm md:text-base font-semibold touch-manipulation"
                    >
                      {/* --- NEW: Shimmer Effect --- */}
                      <span className="absolute top-0 left-0 w-full h-full bg-white opacity-0 transition-all duration-500 group-hover:opacity-10 group-hover:-translate-x-full group-hover:skew-x-12" />
                      <span className="relative flex items-center justify-center">
                        {isSubmitting ? "Sending..." : (
                          <>
                            <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 mr-2 transition-transform duration-300 group-hover:translate-x-1 group-hover:rotate-6" /> 
                            Send Message
                          </>
                        )}
                      </span>
                    </Button>
                  </motion.form>
                ) : (
                  <motion.div key="success" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center text-center min-h-[300px] sm:min-h-[350px] md:min-h-[400px] py-6 sm:py-8">
                    <CheckCircle className="h-12 sm:h-16 md:h-20 w-12 sm:w-16 md:w-20 text-green-400 mb-3 sm:mb-4 md:mb-6" />
                    <h3 className="text-base sm:text-lg md:text-2xl font-sans font-bold text-white mb-1 sm:mb-2 md:mb-3 px-2">Message Sent!</h3>
                    <p className="text-xs sm:text-sm md:text-base text-gray-400 mb-4 sm:mb-6 md:mb-8 px-2 leading-relaxed">Thank you for reaching out. Our team will get back to you shortly.</p>
                    <Button 
                      onClick={resetForm} 
                      variant="outline" 
                      className="border-gray-600 text-gray-300 h-9 sm:h-10 md:h-11 text-xs sm:text-sm md:text-base touch-manipulation"
                    >
                      Send Another Message
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50, rotateY: -15 }} whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
              viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.8, ease: "easeOut" }}
              className="space-y-4 sm:space-y-6 md:space-y-8"
            >
              <div className="space-y-3 sm:space-y-4 md:space-y-6">
                {contactInfo.map((info, index) => (
                  <motion.div
                    key={info.label} 
                    initial={{ opacity: 0, x: 20 }} 
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }} 
                    transition={{ delay: index * 0.15, duration: 0.5 }}
                    whileHover={{ y: -5, scale: 1.02 }} 
                    whileTap={{ scale: 0.98 }}
                    className="bg-[#121224]/70 backdrop-blur-md rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-blue-900/40 group touch-manipulation"
                  >
                    <div className="flex items-start gap-2 sm:gap-3 md:gap-4">
                      <div className="flex items-center justify-center w-9 sm:w-10 md:w-12 h-9 sm:h-10 md:h-12 bg-blue-900/50 rounded-lg flex-shrink-0">
                        {/* --- NEW: Breathing Icon Animation --- */}
                        <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: index * 0.3 }}>
                           <info.icon className="h-4 sm:h-5 md:h-6 w-4 sm:w-5 md:w-6 text-green-400" />
                        </motion.div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm sm:text-base md:text-lg font-sans font-semibold text-white mb-0.5 sm:mb-1 md:mb-2">{info.label}</h3>
                        {info.href ? (
                          <a 
                            href={info.href} 
                            target={info.href.startsWith('http') ? '_blank' : undefined}
                            rel={info.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                            className="text-xs sm:text-sm md:text-base text-gray-400 hover:text-green-400 transition-colors break-words"
                          >
                            {info.value}
                          </a>
                        ) : (
                          <p className="text-xs sm:text-sm md:text-base text-gray-400 break-words leading-relaxed">{info.value}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.div 
                initial={{ opacity: 0, y: 30 }} 
                whileInView={{ opacity: 1, y: 0 }} 
                viewport={{ once: true }} 
                transition={{ delay: 0.4 }} 
                className="bg-[#121224]/70 backdrop-blur-md rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 md:p-8 border border-blue-900/40"
              >
                  <h3 className="text-base sm:text-lg md:text-xl font-sans font-bold text-white mb-2 sm:mb-3 md:mb-4">Common Inquiries</h3>
                  <motion.ul 
                    initial="hidden" 
                    whileInView="visible" 
                    viewport={{ once: true, amount: 0.5 }} 
                    variants={{ visible: { transition: { staggerChildren: 0.1 }} }} 
                    className="space-y-2 sm:space-y-2.5 md:space-y-3 text-gray-400"
                  >
                    {["Partnerships & Sponsorships", "Custom Enterprise Events", "Platform & Technical Support", "Media & Press Inquiries"].map(item => (
                      <motion.li 
                        key={item} 
                        variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }} 
                        className="flex items-start text-xs sm:text-sm md:text-base leading-relaxed"
                      >
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 mr-2 sm:mr-3 flex-shrink-0" />
                        <span>{item}</span>
                      </motion.li>
                    ))}
                  </motion.ul>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;