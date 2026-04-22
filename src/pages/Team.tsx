import { useState } from "react";
import { motion } from "framer-motion";
// --- UPDATED: Added Instagram and Linkedin icons ---
import { Github, Linkedin, Mail, Code, Shield, Zap, Instagram } from "lucide-react";
// Assuming Scene3D is defined elsewhere
import { Scene3D } from "@/components/Scene3D";

// Data structure for a team member
interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  image_url: string | null;
  linkedin_url?: string;
  github_url?: string;
  email?: string;
}

// Helper function to generate bio based on role
const generateBio = (role: string, name: string): string => {
  const roleLower = role.toLowerCase();
  if (roleLower.includes('president')) {
    return 'A strategic leader driving the core vision and initiatives of the team, ensuring excellence in all endeavors.';
  }
  if (roleLower.includes('vice president')) {
    return 'A strategic leader supporting the core vision and initiatives of the team, ensuring excellence in all endeavors.';
  }
  if (roleLower.includes('secretary')) {
    return 'The organizational backbone of the team, managing communications and ensuring smooth operational workflow.';
  }
  if (roleLower.includes('head of')) {
    if (roleLower.includes('web security') || roleLower.includes('ui/ux')) {
      return 'Leading web security initiatives and crafting exceptional user experiences with cutting-edge design principles.';
    }
    if (roleLower.includes('pr') || roleLower.includes('social media')) {
      return 'The creative force behind our brand, leading our media strategy and public engagement.';
    }
    if (roleLower.includes('external engagement')) {
      return 'Building strategic partnerships and managing external relations to expand our network and impact.';
    }
    if (roleLower.includes('operations')) {
      return 'Expert in managing day-to-day activities and strategic projects, ensuring efficiency and timely execution.';
    }
    return 'Leading strategic initiatives and driving excellence in their specialized domain.';
  }
  if (roleLower.includes('lead') || (roleLower.includes('head') && !roleLower.includes('head of'))) {
    if (roleLower.includes('technical')) {
      return 'The engineering visionary who transforms complex technical challenges into powerful, scalable solutions.';
    }
    if (roleLower.includes('security')) {
      if (roleLower.includes('os')) {
        return 'Expert in operating system security, hardening systems and protecting against vulnerabilities.';
      }
      return 'Expert in security practices, safeguarding our systems and leading security-focused initiatives.';
    }
    if (roleLower.includes('network')) {
      return 'Specializing in network security protocols and infrastructure protection strategies.';
    }
    if (roleLower.includes('iot')) {
      return 'Pioneering IoT security solutions and innovative approaches to connected device protection.';
    }
    if (roleLower.includes('cryptography')) {
      return 'Expert in cryptographic systems and secure communication protocols.';
    }
    if (roleLower.includes('offensive')) {
      return 'Leading offensive security research and penetration testing initiatives.';
    }
    if (roleLower.includes('forensics')) {
      return 'Specializing in digital forensics and incident response investigations.';
    }
    if (roleLower.includes('event')) {
      return 'Expert in organizing and managing events, workshops, and competitions.';
    }
    return 'Leading initiatives and contributing expertise to drive team success.';
  }
  if (roleLower.includes('coordinator')) {
    return 'Coordinating media activities and supporting team communications and outreach efforts.';
  }
  if (roleLower.includes('event management')) {
    return 'Expert in planning and executing events, ensuring smooth operations and engaging experiences.';
  }
  if (roleLower.includes('core member')) {
    return 'Dedicated team member contributing expertise and passion to drive our mission forward.';
  }
  return 'Passionate contributor dedicated to advancing our team\'s goals and objectives.';
};

// Team data - organized by hierarchy
const manualTeam: TeamMember[] = [
    // Leadership
    {
      id: 't1',
      name: 'Shivansh Saxena',
      role: 'President',
      bio: generateBio('President', 'Shivansh Saxena'),
      image_url: '/photos/Shivansh_Saxena.jpg',
      email: 'saxenashivansh51@gmail.com',
      linkedin_url: 'https://www.linkedin.com/in/shivanshsaxena01/'
    },
    {
      id: 't2',
      name: 'Aditya Tripati',
      role: 'Vice President',
      bio: generateBio('Vice President', 'Aditya Tripati'),
      image_url: '/photos/Aditiya.jpg',
      email: 'aditya.tripathi7631@gmail.com'
    },
    {
      id: 't3',
      name: 'Om Pushpraj Patel',
      role: 'General Secretary',
      bio: generateBio('General Secretary', 'Om Pushpraj Patel'),
      image_url: null,
      email: 'ompushpraj2004@gmail.com'
    },
    {
      id: 't4',
      name: 'Bidhu Mitra',
      role: 'Joint Secretary',
      bio: generateBio('Joint Secretary', 'Bidhu Mitra'),
      image_url: '/team/Bidhu_Mitra - Bidhu Mitra.jpg',
      email: 'bidhumitra2005@gmail.com',
      github_url: 'https://github.com/BidhuMitra1',
      linkedin_url: 'https://www.linkedin.com/in/bidhumitra/'
    },
    // Heads
    {
      id: 't5',
      name: 'Navya',
      role: 'Head of Web Security & UI/UX',
      bio: generateBio('Head of Web Security & UI/UX', 'Navya'),
      image_url: '/team/Navya.jpg.jpeg',
      email: 'navyapandey841@gmail.com'
    },
    {
      id: 't6',
      name: 'Jiya siwach',
      role: 'Head of PR & Social Media',
      bio: generateBio('Head of PR & Social Media', 'Jiya siwach'),
      image_url: '/photos/jiya.jpg',
      email: 'jiyaswiach1234@gmail.com'
    },
    {
      id: 't7',
      name: 'Gaurav Chauhan',
      role: 'Head of External Engagement',
      bio: generateBio('Head of External Engagement', 'Gaurav Chauhan'),
      image_url: null,
      email: 'chauhan.gaurav10112005@gmail.com'
    },
    {
      id: 't8',
      name: 'Subodh sharma',
      role: 'Head of Operations',
      bio: generateBio('Head of Operations', 'Subodh sharma'),
      image_url: '/team/Subodh sharma - Subodh Sharma.png',
      email: 'subodhsharma8008@gmail.com',
      github_url: 'https://github.com/subodh0006',
      linkedin_url: 'https://www.linkedin.com/in/subodh06?utm_source=share_via&utm_content=profile&utm_medium=member_android'
    },
    {
      id: 't20',
      name: 'Mayank Rath',
      role: 'Management Head',
      bio: generateBio('Head of Operations', 'Mayank Rath'),
      image_url: '/team/Mayank_Rath - Mayank Rath.png',
      email: 'mayankrath007@gmail.com',
      github_url: 'https://github.com/mayank1916',
      linkedin_url: 'https://www.linkedin.com/in/mayank-rath-142ab1331/'
    },
    // Leads
    {
      id: 't9',
      name: 'Saurav Kumar',
      role: 'Technical Lead',
      bio: generateBio('Technical Lead', 'Saurav Kumar'),
      image_url: '/photos/saurav_kumar.jpg',
      email: '0501saurav@gmail.com',
      github_url: 'https://github.com/Astro-Saurav'
    },
    {
      id: 't10',
      name: 'Anuj Rawat',
      role: 'OS Security Lead',
      bio: generateBio('OS Security Lead', 'Anuj Rawat'),
      image_url: null,
      email: 'anujrwt08@gmail.com'
    },
    {
      id: 't11',
      name: 'Sandip Biswa',
      role: 'Network Security Lead',
      bio: generateBio('Network Security Lead', 'Sandip Biswa'),
      image_url: '/team/Sandip_Biswa - Sandip Biswa.png',
      email: 'sandipbiswa2000@gmail.com',
      github_url: 'https://github.com/b1swa25',
      linkedin_url: 'https://www.linkedin.com/in/cyber-monk-636b85142/'
    },
    {
      id: 't12',
      name: 'Aadarsh',
      role: 'IoT Security Head',
      bio: generateBio('IoT Security Head', 'Aadarsh'),
      image_url: null,
      email: 'aadarsh.bonthula@gmail.com'
    },
    {
      id: 't13',
      name: 'Abhijit kharol',
      role: 'Cryptography Head',
      bio: generateBio('Cryptography Head', 'Abhijit kharol'),
      image_url: null,
      email: 'abhijeetkharol7489@gmail.com'
    },
    {
      id: 't14',
      name: 'Jigyashu Bhatt',
      role: 'Offensive Security Lead',
      bio: generateBio('Offensive Security Lead', 'Jigyashu Bhatt'),
      image_url: '/team/Jigyashu.jpg',
      email: 'jishubhatt07@gmail.com',
      github_url: 'https://github.com/jigyashu-bhatt',
      linkedin_url: 'https://www.linkedin.com/in/jigyashu-bhatt?utm_source=share_via&utm_content=profile&utm_medium=member_android'
    },
    {
      id: 't15',
      name: 'Nisha',
      role: 'Digital Forensics Lead',
      bio: generateBio('Digital Forensics Lead', 'Nisha'),
      image_url: null,
      email: 'kumarinihu234@gmail.com'
    },
    // Event Management
    {
      id: 't16',
      name: 'PRIYANSHU KUMAR',
      role: 'Event Management',
      bio: generateBio('Event Management', 'PRIYANSHU KUMAR'),
      image_url: '/team/Priyanshu_Kumar.png',
      email: 'raopriyanshu07@gmail.com',
      github_url: 'https://github.com/raopriyanshu90',
      linkedin_url: 'https://www.linkedin.com/in/priyanshu-kumar-8a9b23310/'
    },
    {
      id: 't17',
      name: 'Sneha Khurana',
      role: 'Event Lead',
      bio: generateBio('Event Lead', 'Sneha Khurana'),
      image_url: null,
      email: 'khuranask131005@gmail.com'
    },
    // Media Coordinators
    {
      id: 't18',
      name: 'Dev Kaushik',
      role: 'Media Coordinator',
      bio: generateBio('Media Coordinator', 'Dev Kaushik'),
      image_url: '/team/Dev_Kaushik.jpg',
      email: 'dav02032006@gmail.com',
      github_url: 'https://github.com/deox00',
      linkedin_url: 'https://www.linkedin.com/in/dev-kaushik-607784337/'
    },
    {
      id: 't19',
      name: 'Khushi',
      role: 'Media Coordinator',
      bio: generateBio('Media Coordinator', 'Khushi'),
      image_url: null,
      email: 'k.khushii2711@gmail.com'
    },
    {
      id: 't21',
      name: 'Komal Kumari',
      role: 'Core Team Member',
      bio: generateBio('Core Member', 'Komal Kumari'),
      image_url: '/team/komal - Komal Kumari.png',
      email: 'kk2796903@gmail.com',
      github_url: 'https://github.com/KomalKumari280',
      linkedin_url: 'https://www.linkedin.com/in/komal-kumari-14b01731b/'
    }
];

const socialIcons = [
  { Component: Github, name: "github" },
  { Component: Linkedin, name: "linkedin" },
  { Component: Mail, name: "mail" },
];

const TeamCard = ({ member, index }: { member: TeamMember, index: number }) => {
  const [imageError, setImageError] = useState(false);
  const getRoleIcon = (role: string) => {
    if (role.toLowerCase().includes('technical') || role.toLowerCase().includes('engineer')) return Code;
    if (role.toLowerCase().includes('security') || role.toLowerCase().includes('president')) return Shield;
    if (role.toLowerCase().includes('operations') || role.toLowerCase().includes('media')) return Zap;
    return Zap;
  };
  const RoleIcon = getRoleIcon(member.role);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotateY: -15 }}
      whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.6 }}
      whileHover={{ y: -10, rotateY: 5 }}
      className="p-4 sm:p-6 md:p-8 group relative overflow-hidden bg-[#121224]/70 backdrop-blur-md rounded-lg sm:rounded-xl border border-blue-900/40"
      style={{ perspective: "1000px" }}
    >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative mb-4 sm:mb-6 flex justify-center">
            <div className="relative">
                <div className="w-24 sm:w-28 md:w-32 h-24 sm:h-28 md:h-32 rounded-full overflow-hidden border-3 sm:border-4 border-primary/30 group-hover:border-primary/60 transition-colors duration-300">
                    {member.image_url && !imageError ? (<img src={member.image_url} alt={member.name} className="w-full h-full object-cover" onError={() => setImageError(true)} />) : (<div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center"><RoleIcon className="h-12 sm:h-14 md:h-16 w-12 sm:w-14 md:w-16 text-primary/60" /></div>)}
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-primary/50 opacity-0 group-hover:opacity-100 animate-pulse transition-opacity duration-300" />
                <div className="absolute -bottom-1 sm:-bottom-2 -right-1 sm:-right-2 w-8 sm:w-10 h-8 sm:h-10 bg-primary/20 rounded-full border-2 border-primary/50 flex items-center justify-center backdrop-blur-sm"><RoleIcon className="h-3.5 sm:h-4 md:h-5 w-3.5 sm:w-4 md:w-5 text-primary" /></div>
            </div>
        </div>
        <div className="text-center mb-3 sm:mb-4"><h3 className="text-lg sm:text-xl md:text-2xl font-sans font-bold text-white mb-1 sm:mb-2 group-hover:text-green-400 transition-colors line-clamp-2">{member.name}</h3><p className="text-xs sm:text-sm font-mono uppercase tracking-wide text-green-500/80 line-clamp-1">{member.role}</p></div>
        <p className="text-gray-400 text-xs sm:text-sm md:text-base text-center mb-4 sm:mb-6 leading-relaxed line-clamp-3 sm:line-clamp-none">{member.bio}</p>
        <div className="flex justify-center gap-2 sm:gap-3 md:gap-4 h-8 sm:h-9 md:h-10 items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {socialIcons.map(({ Component, name }, idx) => {
              let url;
              switch (name) {
                case 'linkedin':
                  url = member.linkedin_url;
                  break;
                case 'github':
                  url = member.github_url;
                  break;
                case 'mail':
                  url = member.email ? `mailto:${member.email}` : undefined;
                  break;
                default:
                  url = undefined;
              }
              if (!url) return null;
              return (
                <motion.a
                  key={idx} href={url} target="_blank" rel="noopener noreferrer" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
                  className="w-8 sm:w-9 md:w-10 h-8 sm:h-9 md:h-10 rounded-full flex items-center justify-center transition-all duration-300 bg-primary/10 hover:bg-primary/20 border border-primary/30 hover:border-primary/50 cursor-pointer"
                >
                  <Component className="h-3.5 sm:h-4 md:h-4 w-3.5 sm:w-4 md:w-4 text-primary" />
                </motion.a>
              );
            })}
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-green-500 via-blue-500 to-green-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
    </motion.div>
  );
};

const Team = () => {
  return (
    <div className="relative text-gray-200">
      <div className="fixed inset-0 z-0">
        <Scene3D />
      </div>
      <div className="relative z-10 min-h-screen py-8 sm:py-12 md:py-16 lg:py-20">
        <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8 sm:mb-12 md:mb-16"
          >
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-sans font-bold mb-3 sm:mb-4 md:mb-6 text-white" style={{ textShadow: '0 0 20px rgba(0, 255, 150, 0.5)' }}>
              Our Team
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-300 max-w-3xl mx-auto px-2">
                Meet the core team driving our vision forward.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {manualTeam.map((member, index) => (
              <TeamCard key={member.id} member={member} index={index} />
            ))}
          </div>

          {/* --- MODIFIED: Community CTA Section --- */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mt-12 sm:mt-16 md:mt-20 text-center bg-[#121224]/70 backdrop-blur-md rounded-lg sm:rounded-2xl p-6 sm:p-8 md:p-12 border border-blue-900/40 relative overflow-hidden"
          >
            <div className="relative z-10">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-sans font-bold mb-3 sm:mb-4 md:mb-6 text-white px-2">
                Join Our Community
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-gray-300 max-w-3xl mx-auto mb-5 sm:mb-6 md:mb-8 px-2">
                Stay connected and be the first to know about our upcoming events, workshops, and competitions by following our social media channels.
              </p>
              {/* --- NEW: Social media buttons --- */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                  <motion.a 
                    href="https://www.linkedin.com/company/manav-rachna-infosec-army" target="_blank" rel="noopener noreferrer"
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    className="inline-flex items-center justify-center bg-blue-600 text-white rounded-lg px-6 sm:px-8 py-2 sm:py-3 font-semibold transition-colors hover:bg-blue-500 text-sm sm:text-base h-10 sm:h-11 w-full sm:w-auto"
                  >
                    <Linkedin className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    Follow LinkedIn
                  </motion.a>
                  <motion.a
                    href="https://www.instagram.com/mrisa_mriirs" target="_blank" rel="noopener noreferrer"
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    className="inline-flex items-center justify-center bg-pink-600 text-white rounded-lg px-6 sm:px-8 py-2 sm:py-3 font-semibold transition-colors hover:bg-pink-500 text-sm sm:text-base h-10 sm:h-11 w-full sm:w-auto"
                  >
                    <Instagram className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    Join Instagram
                  </motion.a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Team;
