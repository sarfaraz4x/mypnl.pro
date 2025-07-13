
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { User, Globe, DollarSign, Trash2, Save, Shield, Lock, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  email: string;
  full_name: string;
  timezone: string;
  currency: string;
}

const Settings = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const { toast } = useToast();

  useEffect(() => {
    const checkAdminStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email === 'sarfarazalam.sa460@gmail.com') {
        setIsAdmin(true);
      }
    };
    checkAdminStatus();
  }, []);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const updateProfile = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          timezone: profile.timezone,
          currency: profile.currency,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your settings have been saved successfully."
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

    const handleChangePassword = async () => {
    if (!profile) return;

    // Validate passwords
    if (newPassword.length < 6) {
      toast({
        title: "Password Too Short",
        description: "New password must be at least 6 characters long.",
        variant: "destructive"
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "New password and confirm password must match.",
        variant: "destructive"
      });
      return;
    }

    setChangePasswordLoading(true);
    try {
      // First verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: currentPassword,
      });

      if (signInError) {
        throw new Error("Current password is incorrect.");
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      toast({
        title: "Password Updated",
        description: "Your password has been successfully changed."
      });

      // Reset form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowChangePassword(false);
      setShowPasswords({ current: false, new: false, confirm: false });
    } catch (error: any) {
      toast({
        title: "Error Changing Password",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const deleteAllTrades = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: password,
      });

      if (signInError) {
        throw new Error("Incorrect password. Please try again.");
      }

      const { error: tradesError } = await supabase
        .from('trades')
        .delete()
        .eq('user_id', profile.id);

      if (tradesError) throw tradesError;

      toast({
        title: "All Trades Deleted",
        description: "All your trading data has been permanently deleted."
      });
      setPassword(''); // Clear password field on success
    } catch (error: any) {
      toast({
        title: "Error Deleting Trades",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const timezones = [
    'UTC', 'EST', 'CST', 'MST', 'PST', 'GMT', 'CET', 'JST', 'AEST', 'IST'
  ];

  const currencies = [
    'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR', 'KRW', 'USC'
  ];

  if (!profile) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-800 rounded w-1/4"></div>
          <div className="h-64 bg-slate-800 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-slate-400">Manage your account and preferences</p>
      </div>

      {/* Profile Settings */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <User className="h-5 w-5 mr-2" />
            Profile Information
          </CardTitle>
          <CardDescription className="text-slate-400">
            Update your personal information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-slate-300">Email</Label>
            <Input
              id="email"
              type="email"
              value={profile.email || ''}
              disabled
              className="bg-slate-700 border-slate-600 text-slate-400"
            />
            <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
          </div>

          <div>
            <Label htmlFor="full_name" className="text-slate-300">Full Name</Label>
            <Input
              id="full_name"
              value={profile.full_name || ''}
              onChange={(e) => setProfile(prev => prev ? { ...prev, full_name: e.target.value } : null)}
              className="bg-slate-700 border-slate-600 text-white"
              placeholder="Enter your full name"
            />
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Lock className="h-5 w-5 mr-2" />
            Change Password
          </CardTitle>
          <CardDescription className="text-slate-400">
            Update your account password
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showChangePassword ? (
            <Button
              onClick={() => setShowChangePassword(true)}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <Lock className="h-4 w-4 mr-2" />
              Change Password
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <Label htmlFor="current-password" className="text-slate-300">Current Password</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showPasswords.current ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white pr-10"
                    placeholder="Enter current password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-slate-600"
                    onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                  >
                    {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="relative">
                <Label htmlFor="new-password" className="text-slate-300">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPasswords.new ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white pr-10"
                    placeholder="Enter new password (min 6 characters)"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-slate-600"
                    onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                  >
                    {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="relative">
                <Label htmlFor="confirm-password" className="text-slate-300">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showPasswords.confirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white pr-10"
                    placeholder="Confirm new password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-slate-600"
                    onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                  >
                    {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleChangePassword}
                  disabled={changePasswordLoading || !currentPassword || !newPassword || !confirmPassword}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {changePasswordLoading ? 'Updating...' : 'Update Password'}
                </Button>
                <Button
                  onClick={() => {
                    setShowChangePassword(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setShowPasswords({ current: false, new: false, confirm: false });
                  }}
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trading Preferences */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Globe className="h-5 w-5 mr-2" />
            Trading Preferences
          </CardTitle>
          <CardDescription className="text-slate-400">
            Configure your trading environment settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="timezone" className="text-slate-300">Timezone</Label>
            <Select
              value={profile.timezone}
              onValueChange={(value) => setProfile(prev => prev ? { ...prev, timezone: value } : null)}
            >
              <SelectTrigger className="bg-primary/10 border-primary/20 text-primary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                {timezones.map((tz) => (
                  <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="currency" className="text-slate-300">Default Currency</Label>
            <Select
              value={profile.currency}
              onValueChange={(value) => setProfile(prev => prev ? { ...prev, currency: value } : null)}
            >
              <SelectTrigger className="bg-primary/10 border-primary/20 text-primary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                {currencies.map((currency) => (
                  <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Admin Panel Section - Only show for admin */}
      {isAdmin && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Admin Panel
            </CardTitle>
            <CardDescription className="text-slate-400">
              Access the admin panel to manage users and subscriptions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => window.open('/admin', '_blank')}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Shield className="h-4 w-4 mr-2" />
              Open Admin Panel
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center">
        <Button
          onClick={updateProfile}
          disabled={saving}
          className="bg-green-600 hover:bg-green-700"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete All Trades
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-slate-800 border-slate-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-400">
                This action is irreversible. To confirm deletion of all trades, please enter your password.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2 my-4">
              <Label htmlFor="password-confirm" className="text-slate-300">Password</Label>
              <Input
                id="password-confirm"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="Enter your password"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel 
                onClick={() => setPassword('')} 
                className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={deleteAllTrades}
                disabled={loading || !password}
                className="bg-red-600 hover:bg-red-700"
              >
                {loading ? 'Verifying & Deleting...' : 'Delete All Trades'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Settings;
