import { motion, useScroll, useSpring } from "framer-motion";
// --- UPDATED: Added Linkedin and Instagram, removed Calendar ---
import { Users, Trophy, Shield, ArrowRight, Linkedin, Instagram } from "lucide-react"; 
import { Scene3D } from "@/components/Scene3D"; 
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

// --- REMOVED: Unused event interface import ---

const Index = () => {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  // --- REMOVED: Unused state and useEffect for fetching events ---

  const cardVariants = {
    offscreen: { y: 50, opacity: 0 },
    onscreen: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", bounce: 0.4, duration: 0.8 },
    },
  };

  return (
    <div className="relative bg-[#0A0A1A] text-gray-200 overflow-hidden">
      
      <div className="fixed inset-0 z-0">
        <Scene3D />
      </div>

      <motion.div className="fixed top-0 left-0 right-0 h-1 bg-green-500 origin-[0%] z-50" style={{ scaleX }} />
      
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center text-center px-4">
          <div className="max-w-4xl mx-auto">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-5xl md:text-7xl font-sans font-bold mb-6 text-white"
              style={{ textShadow: '0 0 20px rgba(0, 255, 123, 0.5)' }}
            >
              MRISA
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto"
              style={{ textShadow: '0 0 20px rgba(0, 255, 123, 0.74)' }}
            >
              Hack to Secure
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="flex flex-col sm:flex-row justify-center items-center gap-4"
            >
              <Button
                onClick={() => navigate("/events")}
                className="bg-green-500 text-black hover:bg-green-400 transition-all duration-300 transform hover:scale-105 rounded-lg px-8 py-3 group"
              >
                Explore Challenges
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                onClick={() => navigate("/winners")}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white transition-all duration-300 transform hover:scale-105 rounded-lg px-8 py-3"
              >
                View Winners
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Who We Are Section */}
        <motion.section 
            className="py-20 flex items-center justify-center"
            initial="offscreen"
            whileInView="onscreen"
            viewport={{ once: true, amount: 0.3 }}
            transition={{ staggerChildren: 0.3 }}
        >
            <div className="text-center px-4 max-w-4xl mx-auto">
                <motion.h2
                    variants={cardVariants}
                    className="text-4xl md:text-5xl font-sans font-bold mb-8 text-white"
                    style={{ textShadow: '0 0 20px rgba(0, 255, 123, 0.5)' }}
                >
                    Who We Are
                </motion.h2>
                <motion.div 
                  variants={cardVariants}
                  className="bg-[#121224]/70 p-8 rounded-lg border border-blue-900/40 backdrop-blur-sm"
                >
                    <p className="text-lg text-gray-300 mb-6 text-left leading-relaxed">
                        <span className="font-bold text-primary">MRISA (Manav Rachna InfoSec Army)</span> is the official cybersecurity club of Manav Rachna International Institute of Research and Studies. We are a community of students passionate about information security, dedicated to the principle of <span className="font-bold text-primary">"Hack to Secure."</span>
                    </p>
                    <p className="text-lg text-gray-300 text-left leading-relaxed">
                        Our mission is to explore the depths of cyberspace by understanding offensive tactics to build robust defensive strategies. We provide a platform for students to learn, practice, and master the art of ethical hacking, digital forensics, and network defense through hands-on workshops, Capture The Flag (CTF) competitions, and expert-led seminars. At MRISA, we are not just a club; we are an army, united to build and command the future of cybersecurity.
                    </p>
                </motion.div>
            </div>
        </motion.section>

        {/* What We Offer Section */}
        <section className="py-20 flex items-center justify-center">
          <div className="text-center px-4 max-w-4xl mx-auto">
            <motion.div
              initial="offscreen"
              whileInView="onscreen"
              viewport={{ once: true, amount: 0.3 }}
              transition={{ staggerChildren: 0.2 }}
            >
              <motion.h2 variants={cardVariants} className="text-4xl md:text-5xl font-sans font-bold mb-4 text-white">
                What We Offer
              </motion.h2>
              <motion.p variants={cardVariants} className="text-lg text-gray-400 max-w-3xl mx-auto mb-12">
                A platform built for practical skill development in a competitive environment.
              </motion.p>
            </motion.div>
            <motion.div
              initial="offscreen"
              whileInView="onscreen"
              viewport={{ once: true, amount: 0.2 }}
              transition={{ staggerChildren: 0.2 }}
              className="grid md:grid-cols-3 gap-8"
            >
              {[
                { icon: Shield, title: "Real-World Scenarios", description: "Tackle challenges inspired by actual cybersecurity incidents." },
                { icon: Users, title: "Global Community", description: "Connect with peers and experts from around the world." },
                { icon: Trophy, title: "Competitive Rankings", description: "Climb the leaderboards and earn recognition for your skills." },
              ].map((feature) => (
                <motion.div
                  key={feature.title}
                  variants={cardVariants}
                  whileHover={{ y: -10, scale: 1.03 }}
                  className="bg-[#121224]/70 p-8 rounded-lg border border-blue-900/40 text-center transition-shadow duration-300 hover:shadow-2xl hover:shadow-green-500/10 cursor-pointer"
                >
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-900/50 text-green-400 rounded-lg mb-6">
                    <feature.icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-sans font-semibold mb-3 text-white">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400">{feature.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* --- UPDATED: Join Our Community Section --- */}
        <section className="py-20">
             <div className="container mx-auto px-4 max-w-4xl text-center">
                <motion.div
                    initial="offscreen"
                    whileInView="onscreen"
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ staggerChildren: 0.2 }}
                >
                    <motion.h2 
                        variants={cardVariants}
                        className="text-4xl md:text-5xl font-sans font-bold mb-4 text-white" 
                        style={{ textShadow: '0 0 20px rgba(0, 255, 150, 0.5)' }}>
                        Join Our Community
                    </motion.h2>
                    <motion.p 
                        variants={cardVariants}
                        className="text-lg text-gray-400 max-w-3xl mx-auto mb-12"
                    >
                        Follow us on social media to stay updated with our latest events, workshops, and cybersecurity news.
                    </motion.p>
                    <motion.div 
                        variants={cardVariants}
                        className="flex flex-col sm:flex-row justify-center items-center gap-4"
                    >
                        <Button 
                            onClick={() => window.open('https://www.linkedin.com/company/manav-rachna-infosec-army', '_blank')}
                            className="bg-blue-600 text-white hover:bg-blue-500 transition-all duration-300 transform hover:scale-105 rounded-lg px-8 py-3 group"
                        >
                            <Linkedin className="mr-2 h-5 w-5" />
                            Follow on LinkedIn
                        </Button>
                        <Button
                            onClick={() => window.open('https://www.instagram.com/mrisa_mriirs', '_blank')}
                            className="bg-pink-600 text-white hover:bg-pink-500 transition-all duration-300 transform hover:scale-105 rounded-lg px-8 py-3 group"
                        >
                            <Instagram className="mr-2 h-5 w-5" />
                            Join us on Instagram
                        </Button>
                    </motion.div>
                </motion.div>
             </div>
         </section>
      </div>
    </div>
  );
};

export default Index;