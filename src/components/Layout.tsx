
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Leaf, User, Settings, LogOut } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return <>{children}</>;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-crop-green-600 text-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
            <Leaf className="h-6 w-6" />
            <h1 className="text-xl font-bold">CropWhisperer</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              className="text-white hover:bg-crop-green-700" 
              onClick={() => navigate('/profile')}
            >
              <User className="h-5 w-5 mr-1" />
              <span className="hidden sm:inline">Profile</span>
            </Button>
            <Button 
              variant="ghost" 
              className="text-white hover:bg-crop-green-700"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 mr-1" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow bg-gray-50">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-crop-green-700 text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center justify-center md:justify-start">
                <Leaf className="h-5 w-5 mr-2" />
                <span className="font-bold text-lg">CropWhisperer</span>
              </div>
              <p className="text-sm text-gray-200 mt-1">Protecting crops through AI</p>
            </div>
            
            <div className="text-sm text-gray-200">
              &copy; {new Date().getFullYear()} CropWhisperer. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
