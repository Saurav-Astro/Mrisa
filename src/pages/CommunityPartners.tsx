import { useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Handshake, Globe } from "lucide-react";
import { Scene3D } from "@/components/Scene3D";

interface Partner {
  id: string;
  name: string;
  description: string;
  logo_url: string;
  website_url?: string;
  category: "Community Partner" | "Sponsor";
  tags?: string[];
}

const partners: Partner[] = [
  {
    id: "p1",
    name: "APISEC University",
    description: "A leading platform for API security training and certifications, empowering developers and security professionals to build and test secure APIs.",
    logo_url: "/Comunity_partner_and_sponser/APISEC.png",
    website_url: "https://www.apisecuniversity.com",
    category: "Sponsor",
    tags: ["API Security", "Training", "Certifications"],
  },
  {
    id: "p2",
    name: "BSides Delhi",
    description: "A community-driven information security conference in Delhi, fostering knowledge sharing and collaboration among cybersecurity enthusiasts.",
    logo_url: "/Comunity_partner_and_sponser/Bsides.png",
    website_url: "https://bsidesdelhi.in",
    category: "Community Partner",
    tags: ["Conference", "InfoSec", "Community"],
    logoSize: "large" as const,
  },
  {
    id: "p3",
    name: "Cyber Surce",
    description: "A cybersecurity-focused organization dedicated to cultivating the next generation of security researchers and ethical hackers.",
    logo_url: "/Comunity_partner_and_sponser/CS.png",
    category: "Community Partner",
    tags: ["Research", "Ethical Hacking", "Education"],
    logoSize: "large" as const,
  },
  {
    id: "p4",
    name: "DG Sentinels",
    description: "An elite cyber-defense unit bringing cutting-edge threat intelligence and digital guardian capabilities to the security ecosystem.",
    logo_url: "/Comunity_partner_and_sponser/DG_Sentinels.png",
    category: "Sponsor",
    tags: ["Threat Intel", "Defense", "CTF"],
  },
  {
    id: "p5",
    name: "IDevSec",
    description: "A collaborative platform integrating development and security practices, championing DevSecOps principles and secure coding culture.",
    logo_url: "/Comunity_partner_and_sponser/idevsec.png",
    category: "Community Partner",
    tags: ["DevSecOps", "Secure Coding", "Community"],
    logoSize: "large" as const,
  },
  {
    id: "p6",
    name: "0x0 PRI4T3S",
    description: "A pioneering cybersecurity firm focused on offensive and defensive security solutions, pushing boundaries in the realm of digital protection.",
    logo_url: "/Comunity_partner_and_sponser/OXO.png",
    category: "Sponsor",
    tags: ["Offensive Security", "Defensive Security"],
    logoSize: "large" as const,
  },
  {
    id: "p7",
    name: "SigintOps",
    description: "Specialists in signals intelligence and operational security, bringing real-world intelligence community expertise to the cybersecurity space.",
    logo_url: "/Comunity_partner_and_sponser/sigintops.png",
    category: "Community Partner",
    tags: ["SIGINT", "OSINT", "Intelligence"],
    logoSize: "large" as const,
  },
  {
    id: "p8",
    name: ".xyz",
    description: "A vibrant and growing community of technology and security enthusiasts fostering innovation, collaboration, and skill development.",
    logo_url: "/Comunity_partner_and_sponser/xyz.png",
    category: "Sponsor",
    tags: ["Technology", "Innovation", "Community"],
  },
];

const PartnerCard = ({ partner, index }: { partner: Partner; index: number }) => {
  const [imageError, setImageError] = useState(false);
  const isSponsor = partner.category === "Sponsor";
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, duration: 0.5 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="group relative overflow-hidden bg-[#0d0d1a]/80 backdrop-blur-md rounded-2xl border border-blue-900/30 hover:border-primary/50 transition-all duration-300 flex flex-col"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <div className="absolute top-4 right-4 z-10">
        <span className={`px-3 py-1 rounded-full text-xs font-mono font-semibold tracking-wider border ${isSponsor ? "bg-yellow-500/10 border-yellow-500/40 text-yellow-400" : "bg-primary/10 border-primary/40 text-primary"}`}>
          {isSponsor ? "Sponsor" : "Partner"}
        </span>
      </div>
            {/* Logo Area - Enhanced Design */}
      <div className={`relative flex items-center justify-center p-8 border-b min-h-[180px] overflow-hidden transition-all duration-500 ${isSponsor ? "bg-gradient-to-br from-yellow-950/30 via-[#0d0d1a] to-orange-950/20 border-yellow-900/20" : "bg-gradient-to-br from-blue-950/30 via-[#0d0d1a] to-green-950/20 border-blue-900/20"}`}>
        
        {/* Radial glow behind logo */}
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 ${isSponsor ? "bg-[radial-gradient(ellipse_at_center,rgba(234,179,8,0.12)_0%,transparent_70%)]" : "bg-[radial-gradient(ellipse_at_center,rgba(0,255,150,0.10)_0%,transparent_70%)]"}`} />

        {/* Animated scanning line */}
        <div className={`absolute left-0 right-0 h-px opacity-0 group-hover:opacity-60 transition-opacity duration-300 animate-[scan_2s_ease-in-out_infinite] ${isSponsor ? "bg-gradient-to-r from-transparent via-yellow-400 to-transparent" : "bg-gradient-to-r from-transparent via-primary to-transparent"}`}
          style={{ top: "40%", animation: "scan 2.5s ease-in-out infinite" }} />

        {/* Corner brackets - top left */}
        <div className={`absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 rounded-tl opacity-40 group-hover:opacity-100 transition-all duration-300 group-hover:w-7 group-hover:h-7 ${isSponsor ? "border-yellow-400" : "border-primary"}`} />
        {/* Corner brackets - top right */}
        <div className={`absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 rounded-tr opacity-40 group-hover:opacity-100 transition-all duration-300 group-hover:w-7 group-hover:h-7 ${isSponsor ? "border-yellow-400" : "border-primary"}`} />
        {/* Corner brackets - bottom left */}
        <div className={`absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 rounded-bl opacity-40 group-hover:opacity-100 transition-all duration-300 group-hover:w-7 group-hover:h-7 ${isSponsor ? "border-yellow-400" : "border-primary"}`} />
        {/* Corner brackets - bottom right */}
        <div className={`absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 rounded-br opacity-40 group-hover:opacity-100 transition-all duration-300 group-hover:w-7 group-hover:h-7 ${isSponsor ? "border-yellow-400" : "border-primary"}`} />

        {/* Dot grid pattern */}
        <div className="absolute inset-0 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity duration-500"
          style={{ backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)", backgroundSize: "16px 16px" }} />

        {/* Logo image */}
        {/* Logo image */}
        <div className="relative z-10 flex items-center justify-center w-full">
          {!imageError ? (
            <motion.div
              className={`${partner.logoSize === "large" ? "w-44 h-32" : "w-36 h-24"} overflow-hidden rounded-xl`}
              whileHover={{ scale: 1.06 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <img
                src={partner.logo_url}
                alt={`${partner.name} logo`}
                className="w-full h-full object-cover filter brightness-90 group-hover:brightness-110 transition-all duration-300"
                onError={() => setImageError(true)}
              />
            </motion.div>
          ) : (
            <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center border border-primary/20">
              <Globe className="h-10 w-10 text-primary/60" />
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col flex-1 p-6">
        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors duration-300">{partner.name}</h3>
        <p className="text-gray-400 text-sm leading-relaxed mb-4 flex-1">{partner.description}</p>
        {partner.tags && (
          <div className="flex flex-wrap gap-2 mb-4">
            {partner.tags.map((tag) => (
              <span key={tag} className="px-2 py-0.5 bg-blue-900/30 border border-blue-800/40 text-blue-300 text-xs rounded-full font-mono">{tag}</span>
            ))}
          </div>
        )}
        {partner.website_url && (
          <motion.a href={partner.website_url} target="_blank" rel="noopener noreferrer" whileHover={{ x: 4 }} className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-green-400 transition-colors duration-300 mt-auto">
            <ExternalLink className="h-4 w-4" />
            Visit Website
          </motion.a>
        )}
      </div>
      <div className={`absolute inset-x-0 bottom-0 h-0.5 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ${isSponsor ? "bg-gradient-to-r from-yellow-500 via-orange-400 to-yellow-500" : "bg-gradient-to-r from-green-500 via-blue-500 to-green-500"}`} />
    </motion.div>
  );
};

const CommunityPartners = () => {
  const [filter, setFilter] = useState<"All" | "Community Partner" | "Sponsor">("All");
  const filtered = filter === "All" ? partners : partners.filter((p) => p.category === filter);
  return (
    <div className="relative text-gray-200">
      <div className="fixed inset-0 z-0"><Scene3D /></div>
      {/* Dark overlay for readability */}
      <div className="fixed inset-0 z-[1] bg-[#07071a]/70 backdrop-blur-[1px]" />
      <div className="relative z-[2] min-h-screen py-20">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="text-center mb-16">
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 0.5 }} className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-mono tracking-wider">
              <Handshake className="h-4 w-4" />
              Our Network
            </motion.div>
            <h1 className="text-5xl md:text-7xl font-sans font-bold mb-6 text-white" style={{ textShadow: "0 0 30px rgba(0, 255, 150, 0.4)" }}>
              Our Previous Community Partners
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400">&amp; Sponsors</span>
            </h1>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">
              We are proud to collaborate with industry leaders and community champions who share our passion for cybersecurity, innovation, and education. Together, we build a stronger security ecosystem.
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="flex justify-center gap-3 mb-12">
            {(["All", "Community Partner", "Sponsor"] as const).map((tab) => (
              <button key={tab} onClick={() => setFilter(tab)} className={`px-5 py-2 rounded-full text-sm font-mono font-semibold tracking-wider border transition-all duration-300 ${filter === tab ? "bg-primary text-background border-primary shadow-lg shadow-primary/20" : "bg-transparent text-gray-400 border-blue-900/40 hover:border-primary/40 hover:text-primary"}`}>
                {tab === "All" ? `All (${partners.length})` : tab === "Sponsor" ? `Sponsors (${partners.filter((p) => p.category === "Sponsor").length})` : `Partners (${partners.filter((p) => p.category === "Community Partner").length})`}
              </button>
            ))}
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((partner, index) => (<PartnerCard key={partner.id} partner={partner} index={index} />))}
          </div>
          <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3, duration: 0.8 }} className="mt-24 text-center bg-[#0d0d1a]/70 backdrop-blur-md rounded-2xl p-12 border border-blue-900/40 relative overflow-hidden">
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/30 mb-6">
                <Handshake className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-3xl md:text-4xl font-sans font-bold mb-4 text-white">Become a Partner or Sponsor</h2>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-8 leading-relaxed">
                Join our growing network of organizations shaping the future of cybersecurity. Reach talented students, support the community, and amplify your brand within the security ecosystem.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.a href="mailto:mrisa.set@mriu.edu.in" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-flex items-center justify-center gap-2 bg-primary text-background rounded-lg px-8 py-3 font-semibold transition-colors hover:bg-primary/90">
                  <Handshake className="h-5 w-5" />
                  Partner With Us
                </motion.a>
                <motion.a href="/contact" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-flex items-center justify-center gap-2 bg-transparent text-white border border-blue-900/60 hover:border-primary/60 rounded-lg px-8 py-3 font-semibold transition-colors">
                  <Globe className="h-5 w-5" />
                  Contact Us
                </motion.a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CommunityPartners;
