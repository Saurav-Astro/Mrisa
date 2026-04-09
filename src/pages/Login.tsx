import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, LogIn, Eye, EyeOff, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Scene3D } from "@/components/Scene3D";
import { validateEmail, sanitizeText } from "@/lib/security";
import { authRateLimiter } from "@/lib/auth";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rateLimitMessage, setRateLimitMessage] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check rate limiting
    const clientId = email.toLowerCase();
    if (authRateLimiter.isLimited(clientId)) {
      const remainingTime = Math.ceil(authRateLimiter.getRemainingTime(clientId) / 1000);
      const message = `Too many login attempts. Please try again in ${remainingTime} seconds.`;
      setRateLimitMessage(message);
      toast({
        title: "Rate Limited",
        description: message,
        variant: "destructive",
      });
      return;
    }
    
    // Validate inputs
    if (!email || !password) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (!validateEmail(email)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    const sanitizedEmail = sanitizeText(email.trim());

    setIsLoading(true);
    setRateLimitMessage("");
    try {
      const result = await login(sanitizedEmail, password);

      if (result.error) {
        toast({
          title: "Login Failed",
          description: result.error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Logged in successfully!",
        });
        navigate("/dashboard");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative text-gray-200 min-h-screen">
      <div className="fixed inset-0 z-0">
        <Scene3D />
      </div>
      <div className="relative z-10 min-h-screen flex items-center justify-center py-6 sm:py-12 px-3 sm:px-4 md:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <div className="bg-[#121224]/80 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-blue-900/40 shadow-2xl">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-center mb-6 sm:mb-8"
            >
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                Admin Login
              </h1>
              <p className="text-gray-400 text-sm sm:text-base">
                Sign in to access the admin dashboard
              </p>
            </motion.div>

            {/* Form */}
            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="space-y-4 sm:space-y-6"
            >
              {/* Rate Limit Warning */}
              {rateLimitMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/10 border border-red-500/50 rounded-lg p-2 sm:p-3 text-red-400 text-xs sm:text-sm"
                >
                  {rateLimitMessage}
                </motion.div>
              )}
              {/* Email Field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <Label htmlFor="email" className="text-gray-300 text-xs sm:text-sm font-medium">
                  Email Address
                </Label>
                <div className="relative mt-2">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 sm:h-5 w-4 sm:w-5 text-green-400 flex-shrink-0" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="pl-10 bg-[#1a1a2e]/50 border-blue-900/40 text-white placeholder:text-gray-500 focus:border-green-400/50 focus:ring-green-400/20 h-10 sm:h-11 text-sm sm:text-base"
                  />
                </div>
              </motion.div>

              {/* Password Field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <Label htmlFor="password" className="text-gray-300 text-xs sm:text-sm font-medium">
                  Password
                </Label>
                <div className="relative mt-2">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 sm:h-5 w-4 sm:w-5 text-green-400 flex-shrink-0" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="pl-10 pr-10 bg-[#1a1a2e]/50 border-blue-900/40 text-white placeholder:text-gray-500 focus:border-green-400/50 focus:ring-green-400/20 h-10 sm:h-11 text-sm sm:text-base"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-400 transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 sm:h-5 w-4 sm:w-5" />
                    ) : (
                      <Eye className="h-4 sm:h-5 w-4 sm:w-5" />
                    )}
                  </button>
                </div>
              </motion.div>

              {/* Submit Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-black hover:from-green-400 hover:to-emerald-400 font-semibold h-10 sm:h-11 transition-all duration-300 flex items-center justify-center gap-2 group text-sm sm:text-base"
                >
                  {isLoading ? (
                    <>
                      <Loader className="h-4 sm:h-5 w-4 sm:w-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 sm:h-5 w-4 sm:w-5 transition-transform group-hover:translate-x-1" />
                      Sign In
                    </>
                  )}
                </Button>
              </motion.div>
            </motion.form>

            {/* Decorative Elements */}
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 20px rgba(16, 185, 129, 0.1)",
                  "0 0 40px rgba(16, 185, 129, 0.2)",
                  "0 0 20px rgba(16, 185, 129, 0.1)",
                ],
              }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute -top-1 -left-1 w-20 h-20 bg-green-500/10 rounded-full blur-3xl pointer-events-none"
            />
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 40px rgba(59, 130, 246, 0.1)",
                  "0 0 60px rgba(59, 130, 246, 0.2)",
                  "0 0 40px rgba(59, 130, 246, 0.1)",
                ],
              }}
              transition={{ duration: 4, repeat: Infinity, delay: 1 }}
              className="absolute -bottom-1 -right-1 w-20 h-20 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
