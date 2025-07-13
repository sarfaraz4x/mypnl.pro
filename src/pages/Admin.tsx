import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { supabaseAdmin } from '@/integrations/supabase/admin-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Users, 
  Search, 
  LogOut, 
  Shield, 
  Calendar, 
  Mail, 
  User, 
  Crown,
  Loader2,
  AlertCircle,
  ArrowUp,
  Zap
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  subscription?: {
    plan_type: string;
    status: string;
    end_date: string | null;
  };
}

const Admin = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [confirmingPlanChange, setConfirmingPlanChange] = useState<{
    userId: string;
    userEmail: string;
    currentPlan: string;
    newPlan: string;
  } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  useEffect(() => {
    const filtered = users.filter(user =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredUsers(filtered);
  }, [users, searchTerm]);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Access Denied",
          description: "Please log in to access the admin panel.",
          variant: "destructive"
        });
        return;
      }

      // Check if user is the admin
      if (user.email !== 'sarfarazalam.sa460@gmail.com') {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access the admin panel.",
          variant: "destructive"
        });
        return;
      }

      setCurrentUser(user);
      setIsAdmin(true);
    } catch (error) {
      console.error('Error checking admin access:', error);
      toast({
        title: "Error",
        description: "Failed to verify admin access.",
        variant: "destructive"
      });
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      console.log('Service role key available:', !!supabaseAdmin);
      console.log('Environment variable:', !!import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY);
      
      // Try to fetch all users using admin client if available
      if (supabaseAdmin) {
        console.log('Attempting to fetch users with admin client...');
        const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
        
        console.log('Auth users result:', { authUsers: authUsers?.users?.length, error: authError });
        
        if (!authError && authUsers?.users) {
          console.log('Successfully fetched', authUsers.users.length, 'users from auth');
          
          // Fetch subscription data for each user
          const usersWithSubscriptions = await Promise.all(
            authUsers.users.map(async (authUser) => {
              const { data: subscription } = await supabaseAdmin
                .from('subscriptions')
                .select('plan_type, status, end_date')
                .eq('user_id', authUser.id)
                .single();

              return {
                id: authUser.id,
                email: authUser.email || '',
                full_name: authUser.user_metadata?.full_name || null,
                created_at: authUser.created_at,
                subscription: subscription || null
              };
            })
          );

          setUsers(usersWithSubscriptions);
          return;
        } else {
          console.error('Admin client error:', authError);
        }
      }

      // Fallback: Fetch users from profiles table (shows more users)
      console.log('Using fallback method to fetch users from profiles...');
      
      // First try to get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, created_at');

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        toast({
          title: "Error",
          description: "Failed to fetch users. Please check your database setup.",
          variant: "destructive"
        });
        return;
      }

      console.log('Found', profiles?.length, 'profiles');

      // Then get subscriptions to match
      const { data: subscriptions, error: subError } = await supabase
        .from('subscriptions')
        .select('user_id, plan_type, status, end_date');

      if (subError) {
        console.error('Error fetching subscriptions:', subError);
      }

      const subscriptionsMap = new Map();
      subscriptions?.forEach(sub => {
        subscriptionsMap.set(sub.user_id, sub);
      });

      const usersFromProfiles = profiles?.map(profile => {
        const subscription = subscriptionsMap.get(profile.id);
        return {
          id: profile.id,
          email: profile.email || 'Unknown',
          full_name: profile.full_name || null,
          created_at: profile.created_at,
          subscription: subscription || {
            plan_type: 'free',
            status: 'active',
            end_date: null
          }
        };
      }) || [];

      setUsers(usersFromProfiles);
      
      if (usersFromProfiles.length === 0) {
        toast({
          title: "No Users Found",
          description: "No users found in profiles table. This might be normal if no users have been created yet.",
          variant: "default"
        });
      }

    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users. Check console for details.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePlanChange = (userId: string, userEmail: string, currentPlan: string, newPlan: string) => {
    if (currentPlan === newPlan) return;
    
    setConfirmingPlanChange({
      userId,
      userEmail,
      currentPlan,
      newPlan
    });
  };

  const confirmPlanChange = async () => {
    if (!confirmingPlanChange) return;
    
    const { userId, newPlan } = confirmingPlanChange;
    setUpdatingUser(userId);
    
    try {
      console.log(`Updating user ${userId} from ${confirmingPlanChange.currentPlan} to ${newPlan}`);
      
      let endDate = null;
      
      // Calculate end date based on plan type
      if (newPlan === 'monthly') {
        endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (newPlan === 'yearly') {
        endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 1);
      }
      // For 'free' and 'lifetime', end_date remains null

      console.log(`Calculated end date: ${endDate ? endDate.toISOString() : 'null'}`);
      
      // Try admin client first, fallback to regular client
      const client = supabaseAdmin || supabase;
      console.log('Using client:', supabaseAdmin ? 'admin' : 'regular');
      
      // Use upsert with conflict resolution to handle both insert and update
      console.log('Upserting subscription...');
      const { error } = await client
        .from('subscriptions')
        .upsert({
          user_id: userId,
          plan_type: newPlan,
          status: 'active',
          end_date: endDate ? endDate.toISOString() : null,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error upserting subscription:', error);
        throw error;
      }
      console.log('Subscription upserted successfully');

      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? {
              ...user,
              subscription: {
                plan_type: newPlan,
                status: 'active',
                end_date: endDate ? endDate.toISOString() : null
              }
            }
          : user
      ));

      // Force refresh the user's subscription context if they're currently logged in
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser && currentUser.id === userId) {
          console.log('Forcing subscription refresh for current user');
          // Trigger a manual refresh by updating the subscription context
          const { data: updatedSubscription } = await supabase
            .from('subscriptions')
            .select('plan_type, status, end_date')
            .eq('user_id', userId)
            .single();
          
          if (updatedSubscription) {
            // Dispatch a custom event to notify the subscription context
            window.dispatchEvent(new CustomEvent('subscription-updated', {
              detail: updatedSubscription
            }));
          }
        }
      } catch (error) {
        console.error('Error refreshing user subscription:', error);
      }

      toast({
        title: "Plan Updated Successfully",
        description: `User plan has been upgraded to ${newPlan}. The user will see this change immediately. Check the user's pricing page to see the update.`
      });
    } catch (error: any) {
      console.error('Error updating user plan:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUpdatingUser(null);
      setConfirmingPlanChange(null);
    }
  };

  const updateUserPlan = async (userId: string, planType: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    handlePlanChange(userId, user.email, user.subscription?.plan_type || 'free', planType);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logged Out",
        description: "You have been logged out successfully."
      });
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const getPlanBadgeColor = (planType: string) => {
    switch (planType) {
      case 'lifetime':
        return 'bg-purple-600 text-white';
      case 'yearly':
        return 'bg-blue-600 text-white';
      case 'monthly':
        return 'bg-green-600 text-white';
      case 'free':
        return 'bg-gray-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 flex items-center justify-center">
        <Card className="w-full max-w-md bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Shield className="h-5 w-5 text-blue-400" />
              Admin Access Required
            </CardTitle>
            <CardDescription className="text-slate-400">
              Only authorized administrators can access this panel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-yellow-400 mb-4">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Checking permissions...</span>
            </div>
            <Button onClick={() => window.location.href = '/'} className="w-full bg-blue-600 hover:bg-blue-700">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/20 p-2 rounded-lg">
                <Shield className="h-6 w-6 text-blue-400" />
              </div>
              <h1 className="text-xl font-bold text-white">My<span className="text-blue-400">PnL</span> Admin Panel</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-300 bg-slate-700/50 px-3 py-1 rounded-full">
                Logged in as: {currentUser?.email}
              </span>
              <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800/80 border-slate-700 shadow-lg backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="bg-blue-500/20 p-3 rounded-lg">
                  <Users className="h-8 w-8 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400 font-medium">Total Users</p>
                  <p className="text-3xl font-bold text-white">{users.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/80 border-slate-700 shadow-lg backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="bg-purple-500/20 p-3 rounded-lg">
                  <Crown className="h-8 w-8 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400 font-medium">Lifetime Users</p>
                  <p className="text-3xl font-bold text-white">
                    {users.filter(u => u.subscription?.plan_type === 'lifetime').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/80 border-slate-700 shadow-lg backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="bg-green-500/20 p-3 rounded-lg">
                  <Calendar className="h-8 w-8 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400 font-medium">Paid Users</p>
                  <p className="text-3xl font-bold text-white">
                    {users.filter(u => 
                      u.subscription?.plan_type === 'monthly' || 
                      u.subscription?.plan_type === 'yearly' ||
                      u.subscription?.plan_type === 'lifetime'
                    ).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/80 border-slate-700 shadow-lg backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="bg-gray-500/20 p-3 rounded-lg">
                  <User className="h-8 w-8 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400 font-medium">Free Users</p>
                  <p className="text-3xl font-bold text-white">
                    {users.filter(u => u.subscription?.plan_type === 'free').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card className="mb-6 bg-slate-800/80 border-slate-700 shadow-lg backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search users by email or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500"
                />
              </div>
              <Button onClick={fetchUsers} variant="outline" className="flex items-center gap-2 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">
                <Loader2 className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="bg-slate-800/80 border-slate-700 shadow-lg backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Users className="h-5 w-5 text-blue-400" />
              User Management
            </CardTitle>
            <CardDescription className="text-slate-400">
              Manage user subscriptions and access levels
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="bg-slate-700/50 p-4 rounded-lg">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                  <span className="ml-3 text-slate-300">Loading users...</span>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-slate-300 font-medium">User</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-medium">Current Plan</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-medium">Status</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-medium">Expiry Date</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b border-slate-700 hover:bg-slate-800/50 transition-colors duration-200">
                        <td className="py-4 px-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-slate-400" />
                              <span className="text-white font-medium">{user.email}</span>
                            </div>
                            {user.full_name && (
                              <div className="text-sm text-slate-400 mt-1">
                                {user.full_name}
                              </div>
                            )}
                            <div className="text-xs text-slate-500 mt-1">
                              Joined: {formatDate(user.created_at)}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge className={getPlanBadgeColor(user.subscription?.plan_type || 'free')}>
                            {user.subscription?.plan_type || 'free'}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant={user.subscription?.status === 'active' ? 'default' : 'secondary'}>
                            {user.subscription?.status || 'active'}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-slate-300">
                          {user.subscription?.end_date 
                            ? formatDate(user.subscription.end_date)
                            : user.subscription?.plan_type === 'lifetime' 
                              ? 'Never'
                              : 'N/A'
                          }
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Select
                              value={user.subscription?.plan_type || 'free'}
                              onValueChange={(value) => updateUserPlan(user.id, value)}
                              disabled={updatingUser === user.id}
                            >
                              <SelectTrigger className="w-32 bg-slate-700 border-slate-600 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                <SelectItem value="free">Free</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="yearly">Yearly</SelectItem>
                                <SelectItem value="lifetime">Lifetime</SelectItem>
                              </SelectContent>
                            </Select>
                            {updatingUser === user.id && (
                              <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                            )}
                          </div>
                          
                          {/* Quick Upgrade Buttons */}
                          <div className="flex gap-1 mt-2">
                            {user.subscription?.plan_type === 'free' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateUserPlan(user.id, 'monthly')}
                                  disabled={updatingUser === user.id}
                                  className="text-xs px-2 py-1 h-6 bg-green-600/20 border-green-500/30 text-green-400 hover:bg-green-600/30"
                                >
                                  <ArrowUp className="h-3 w-3 mr-1" />
                                  Monthly
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateUserPlan(user.id, 'yearly')}
                                  disabled={updatingUser === user.id}
                                  className="text-xs px-2 py-1 h-6 bg-blue-600/20 border-blue-500/30 text-blue-400 hover:bg-blue-600/30"
                                >
                                  <ArrowUp className="h-3 w-3 mr-1" />
                                  Yearly
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateUserPlan(user.id, 'lifetime')}
                                  disabled={updatingUser === user.id}
                                  className="text-xs px-2 py-1 h-6 bg-purple-600/20 border-purple-500/30 text-purple-400 hover:bg-purple-600/30"
                                >
                                  <Crown className="h-3 w-3 mr-1" />
                                  Lifetime
                                </Button>
                              </>
                            )}
                            {user.subscription?.plan_type === 'monthly' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateUserPlan(user.id, 'yearly')}
                                  disabled={updatingUser === user.id}
                                  className="text-xs px-2 py-1 h-6 bg-blue-600/20 border-blue-500/30 text-blue-400 hover:bg-blue-600/30"
                                >
                                  <ArrowUp className="h-3 w-3 mr-1" />
                                  Yearly
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateUserPlan(user.id, 'lifetime')}
                                  disabled={updatingUser === user.id}
                                  className="text-xs px-2 py-1 h-6 bg-purple-600/20 border-purple-500/30 text-purple-400 hover:bg-purple-600/30"
                                >
                                  <Crown className="h-3 w-3 mr-1" />
                                  Lifetime
                                </Button>
                              </>
                            )}
                            {user.subscription?.plan_type === 'yearly' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateUserPlan(user.id, 'lifetime')}
                                disabled={updatingUser === user.id}
                                className="text-xs px-2 py-1 h-6 bg-purple-600/20 border-purple-500/30 text-purple-400 hover:bg-purple-600/30"
                              >
                                <Crown className="h-3 w-3 mr-1" />
                                Lifetime
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {filteredUsers.length === 0 && !loading && (
                  <div className="text-center py-12">
                    <div className="bg-slate-700/50 p-6 rounded-lg inline-block">
                      <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-300">
                        {searchTerm ? 'No users found matching your search.' : 'No users found.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Plan Change Confirmation Dialog */}
      <AlertDialog open={!!confirmingPlanChange} onOpenChange={() => setConfirmingPlanChange(null)}>
        <AlertDialogContent className="bg-slate-800 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-400" />
              Confirm Plan Upgrade
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">
              {confirmingPlanChange && (
                <>
                  Are you sure you want to upgrade <strong className="text-white">{confirmingPlanChange.userEmail}</strong> from{' '}
                  <Badge className={getPlanBadgeColor(confirmingPlanChange.currentPlan)}>
                    {confirmingPlanChange.currentPlan}
                  </Badge>{' '}
                  to{' '}
                  <Badge className={getPlanBadgeColor(confirmingPlanChange.newPlan)}>
                    {confirmingPlanChange.newPlan}
                  </Badge>?
                  <br /><br />
                  <span className="text-yellow-400">
                    This change will be applied immediately and the user will see the upgrade in real-time.
                  </span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmPlanChange}
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={updatingUser === confirmingPlanChange?.userId}
            >
              {updatingUser === confirmingPlanChange?.userId ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Upgrading...
                </>
              ) : (
                <>
                  <ArrowUp className="h-4 w-4 mr-2" />
                  Confirm Upgrade
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Admin; 