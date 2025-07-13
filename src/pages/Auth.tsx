
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { TrendingUp, Mail, ArrowLeft } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';

interface AuthProps {
  mode?: 'signin' | 'signup';
  onModeChange?: (mode: 'signin' | 'signup') => void;
}

const Auth = ({ mode = 'signin', onModeChange }: AuthProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'signin' | 'signup'>(mode);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    setTab(mode);
  }, [mode]);

  // Handle password recovery flow
  useEffect(() => {
    const handlePasswordRecovery = async () => {
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');
      const type = searchParams.get('type');

      if (type === 'recovery' && accessToken && refreshToken) {
        try {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) throw error;

          toast({
            title: "Password Reset Successful",
            description: "You have been signed in successfully. You can now set a new password in your settings.",
          });

          // Redirect to the main app
          navigate('/');
        } catch (error: any) {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        }
      }
    };

    handlePasswordRecovery();
  }, [searchParams, navigate, toast]);

  const handleSignUp = async () => {
    setLoading(true);
    try {
      // Use the correct redirect URL for development
      const redirectUrl = import.meta.env.DEV 
        ? 'http://localhost:8080/'
        : `${window.location.origin}/`;

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Account created!",
        description: "Please check your email to verify your account.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setForgotPasswordLoading(true);
    try {
      // Use the correct redirect URL for development
      const redirectUrl = import.meta.env.DEV 
        ? 'http://localhost:8080/auth'
        : `${window.location.origin}/auth`;

      const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;

      toast({
        title: "Reset Email Sent",
        description: "Please check your email for password reset instructions.",
      });
      setShowForgotPassword(false);
      setForgotPasswordEmail('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md flex flex-col items-center justify-center gap-6">
      <div className="flex flex-col items-center justify-center">
        <div className="flex items-center justify-center">
          <img src="/logo.png" alt="MyPnL Logo" className="h-8 w-auto mr-2" />
          <h1 className="text-2xl font-bold text-white">My PnL</h1>
        </div>
        <p className="text-slate-300 text-center mt-2">Your intelligent Forex trading journal</p>
      </div>
      <Tabs value={tab} onValueChange={(v) => { setTab(v as 'signin' | 'signup'); onModeChange?.(v as 'signin' | 'signup'); }} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-slate-800 text-slate-400">
          <TabsTrigger value="signin" className="data-[state=active]:bg-slate-600 data-[state=active]:text-white">Sign In</TabsTrigger>
          <TabsTrigger value="signup" className="data-[state=active]:bg-slate-600 data-[state=active]:text-white">Sign Up</TabsTrigger>
        </TabsList>
        <TabsContent value="signin" className="space-y-4">
          {!showForgotPassword ? (
            <div className="space-y-4">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              />
              <Button 
                onClick={handleSignIn} 
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
              <div className="text-center">
                <Button
                  variant="link"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-slate-400 hover:text-slate-300 text-sm"
                >
                  Forgot your password?
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <Mail className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                <h3 className="text-lg font-semibold text-white">Reset Password</h3>
                <p className="text-slate-400 text-sm">Enter your email to receive reset instructions</p>
              </div>
              <Input
                type="email"
                placeholder="Enter your email"
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              />
              <Button 
                onClick={handleForgotPassword} 
                disabled={forgotPasswordLoading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {forgotPasswordLoading ? 'Sending...' : 'Send Reset Email'}
              </Button>
              <div className="text-center">
                <Button
                  variant="link"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotPasswordEmail('');
                  }}
                  className="text-slate-400 hover:text-slate-300 text-sm flex items-center justify-center"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Sign In
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
        <TabsContent value="signup" className="space-y-4">
          <div className="space-y-4">
            <Input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            />
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            />
            <Button 
              onClick={handleSignUp} 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Auth;
