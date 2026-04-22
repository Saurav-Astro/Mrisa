import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/events", label: "Events" },
  { href: "/winners", label: "Winners" },
  { href: "/team", label: "Team" },
  { href: "/community-partners", label: "Partners" },
  { href: "/contact", label: "Contact" }
];

const mobileMenuVariants = {
  hidden: { opacity: 0, transition: { duration: 0.3, ease: "easeOut" } },
  visible: { opacity: 1, transition: { duration: 0.3, ease: "easeIn", when: "beforeChildren", staggerChildren: 0.08 } },
  exit: { opacity: 0, transition: { duration: 0.3, ease: "easeOut", when: "afterChildren", staggerChildren: 0.08, staggerDirection: -1 } },
};

const mobileLinkVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 260, damping: 20 } },
  exit: { y: 20, opacity: 0 },
};


export const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const location = useLocation();

  const toggleMenu = () => setIsOpen(!isOpen);

  // Handle navbar style on scroll
  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "auto";
    return () => {
        document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  return (
    <>
      {/* Navbar optimized for all screen sizes */}
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${
          hasScrolled ? "bg-background/90 backdrop-blur-lg border-b border-primary/10 shadow-md" : "bg-background/60 backdrop-blur-sm border-b border-transparent"
        }`}
      >
        <div className="container mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Link to="/" className="flex items-center space-x-2 sm:space-x-3 group flex-shrink-0">
              <img 
                src="/photos/mrisa.jpg" 
                alt="MRISA Logo" 
                className="h-7 sm:h-8 md:h-9 lg:h-12 xl:h-14 w-auto transition-transform duration-300 group-hover:scale-105" 
              />
            </Link>

            {/* Desktop Navigation - Only show on large screens (1024px+) */}
            <div className="hidden lg:flex items-center space-x-1 xl:space-x-2 bg-black/20 border border-primary/10 rounded-full px-1 xl:px-2">
              {navItems.map((item) => (
                <Link 
                  key={item.href} 
                  to={item.href} 
                  className="relative font-mono text-xs xl:text-sm uppercase tracking-wider transition-colors duration-300 px-2 xl:px-4 py-2 rounded-full text-muted-foreground hover:text-primary"
                >
                  {location.pathname === item.href && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-primary rounded-full z-0"
                      initial={false}
                      transition={{ type: "spring", stiffness: 280, damping: 30 }} 
                    />
                  )}
                  <span className={`relative z-10 ${location.pathname === item.href ? 'text-background' : ''}`}>
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>

            {/* Mobile/Tablet Menu Button - Show on screens smaller than 1024px */}
            <div className="lg:hidden">
              <button 
                onClick={toggleMenu} 
                className="relative w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-primary z-50 touch-manipulation active:scale-95 transition-transform"
                aria-label="Toggle Menu"
                aria-expanded={isOpen}
              >
                <AnimatePresence initial={false}>
                  <motion.div
                    key={isOpen ? "x" : "menu"}
                    initial={{ rotate: 45, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -45, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    {isOpen ? (
                      <X className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2} />
                    ) : (
                      <Menu className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2} />
                    )}
                  </motion.div>
                </AnimatePresence>
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Mobile/Tablet Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            variants={mobileMenuVariants} 
            initial="hidden" 
            animate="visible" 
            exit="exit" 
            className="fixed inset-0 z-40 bg-background/98 backdrop-blur-xl lg:hidden"
          >
            <div className="flex flex-col items-center justify-center h-full text-center px-4 py-20">
              {navItems.map((item, index) => (
                <motion.div 
                  key={item.href} 
                  variants={mobileLinkVariants} 
                  className="my-2 sm:my-3 w-full max-w-xs"
                >
                  <Link 
                    to={item.href} 
                    onClick={toggleMenu} 
                    className={`block py-3 sm:py-4 text-xl sm:text-2xl md:text-3xl font-mono uppercase tracking-widest transition-colors duration-300 rounded-lg touch-manipulation active:bg-primary/10 ${
                      location.pathname === item.href 
                        ? "text-primary font-semibold" 
                        : "text-muted-foreground hover:text-primary"
                    }`}
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer to prevent content from going under navbar */}
      <div className="h-14 sm:h-16" />
    </>
  );
};
