import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

interface NavbarProps {
  onAuthNav?: (mode: 'signin' | 'signup') => void;
}

const Navbar = ({ onAuthNav }: NavbarProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Name */}
          <div className="flex items-center space-x-3">
            <img 
              src="/logo.png" 
              alt="MyPnL Logo" 
              className="h-8 w-auto"
            />
            <span className="text-xl font-bold text-white">
              My<span className="text-blue-500">PnL</span>
            </span>
          </div>

          {/* Desktop Navigation Links and Buttons */}
          <div className="hidden md:flex items-center space-x-8">
            <a 
              href="#pricing" 
              className="text-slate-300 hover:text-white transition-colors duration-200 font-medium cursor-pointer"
            >
              Pricing
            </a>
            <a 
              href="#features" 
              className="text-slate-300 hover:text-white transition-colors duration-200 font-medium cursor-pointer"
            >
              Features
            </a>
            <a 
              href="#about" 
              className="text-slate-300 hover:text-white transition-colors duration-200 font-medium cursor-pointer"
            >
              About
            </a>
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white font-medium"
              onClick={() => onAuthNav?.('signin')}
            >
              Login
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
              onClick={() => onAuthNav?.('signup')}
            >
              Get Started
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-slate-300 hover:text-white"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-slate-800 border-t border-slate-700">
              <a 
                href="#pricing" 
                className="block px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-md transition-colors duration-200 cursor-pointer"
                onClick={() => setIsMenuOpen(false)}
              >
                Pricing
              </a>
              <a 
                href="#features" 
                className="block px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-md transition-colors duration-200 cursor-pointer"
                onClick={() => setIsMenuOpen(false)}
              >
                Features
              </a>
              <a 
                href="#about" 
                className="block px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-md transition-colors duration-200 cursor-pointer"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </a>
              <div className="pt-4 space-y-2">
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium"
                  onClick={() => {
                    onAuthNav?.('signin');
                    setIsMenuOpen(false);
                  }}
                >
                  Login
                </Button>
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
                  onClick={() => {
                    onAuthNav?.('signup');
                    setIsMenuOpen(false);
                  }}
                >
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 