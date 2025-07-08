
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, Lock, TrendingUp } from 'lucide-react';

interface UsageLimitModalProps {
  onUpgrade: () => void;
}

const UsageLimitModal = ({ onUpgrade }: UsageLimitModalProps) => {
  return (
    <div className="p-6 min-h-screen flex items-center justify-center">
      <Card className="bg-slate-800 border-slate-700 max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-slate-700 rounded-full w-fit">
            <Lock className="h-8 w-8 text-yellow-400" />
          </div>
          <CardTitle className="text-white text-2xl">Upload Limit Reached</CardTitle>
          <CardDescription className="text-slate-400">
            You've used all 10 free screenshot uploads
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-slate-700 p-4 rounded-lg">
            <h3 className="text-white font-semibold mb-2 flex items-center">
              <Crown className="h-5 w-5 mr-2 text-yellow-400" />
              Upgrade to Pro
            </h3>
            <ul className="text-sm text-slate-300 space-y-1">
              <li>• Unlimited screenshot uploads</li>
              <li>• Advanced analytics & insights</li>
              <li>• PDF report generation</li>
              <li>• Priority customer support</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={onUpgrade}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <Crown className="h-4 w-4 mr-2" />
              View Pricing Plans
            </Button>
            
            <div className="text-center">
              <p className="text-xs text-slate-400">
                Starting at just ₹99/month
              </p>
            </div>
          </div>

          <div className="border-t border-slate-600 pt-4">
            <div className="flex items-center text-sm text-slate-400">
              <TrendingUp className="h-4 w-4 mr-2 text-green-400" />
              <span>Your existing trades remain accessible</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UsageLimitModal;
