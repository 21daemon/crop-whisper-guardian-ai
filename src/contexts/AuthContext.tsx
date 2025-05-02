
import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from "../components/ui/sonner";

// Define user type
export interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check if user is stored in localStorage
    const storedUser = localStorage.getItem('cropUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  // Login function - in a real app, this would call an API
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, validate credentials with backend
      // Simple validation for demo
      if (email === "demo@example.com" && password === "password") {
        const userData = {
          id: '1',
          name: 'Demo User',
          email: 'demo@example.com'
        };
        
        setUser(userData);
        localStorage.setItem('cropUser', JSON.stringify(userData));
        toast.success("Login successful");
        return;
      }
      
      // Check if any user exists in localStorage for demo purposes
      const users = JSON.parse(localStorage.getItem('cropUsers') || '[]');
      const foundUser = users.find((u: any) => u.email === email && u.password === password);
      
      if (foundUser) {
        const userData = {
          id: foundUser.id,
          name: foundUser.name,
          email: foundUser.email
        };
        
        setUser(userData);
        localStorage.setItem('cropUser', JSON.stringify(userData));
        toast.success("Login successful");
      } else {
        throw new Error('Invalid email or password');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Signup function
  const signup = async (name: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, this would call a backend API
      // For demo, we'll store in localStorage
      const users = JSON.parse(localStorage.getItem('cropUsers') || '[]');
      
      // Check if user already exists
      if (users.some((u: any) => u.email === email)) {
        throw new Error('User with this email already exists');
      }
      
      const newUser = {
        id: String(Date.now()),
        name,
        email,
        password // In a real app, NEVER store passwords in localStorage
      };
      
      users.push(newUser);
      localStorage.setItem('cropUsers', JSON.stringify(users));
      
      // Log the user in
      const userData = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email
      };
      
      setUser(userData);
      localStorage.setItem('cropUser', JSON.stringify(userData));
      toast.success("Account created successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Signup failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('cropUser');
    toast.success("Logged out successfully");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
