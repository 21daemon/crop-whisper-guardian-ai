
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useAuth } from '../contexts/AuthContext';
import Layout from '@/components/Layout';
import { User, Settings } from 'lucide-react';
import { toast } from "../components/ui/sonner";

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate saving profile
    setTimeout(() => {
      toast.success("Profile updated successfully");
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Your Profile</h1>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Account Information
              </CardTitle>
              <CardDescription>
                Update your personal information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    value={email}
                    disabled
                  />
                  <p className="text-sm text-muted-foreground">
                    Email address cannot be changed
                  </p>
                </div>
                
                <Button 
                  type="submit" 
                  className="bg-crop-green-600 hover:bg-crop-green-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Preferences
              </CardTitle>
              <CardDescription>
                Manage your notification settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium leading-none mb-1">Email Notifications</h4>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications about your crop analysis
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="email-notifications"
                      className="h-4 w-4 rounded border-gray-300 text-crop-green-600 focus:ring-crop-green-500"
                      defaultChecked
                    />
                    <Label htmlFor="email-notifications" className="text-sm">Enabled</Label>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium leading-none mb-1">Disease Alerts</h4>
                    <p className="text-sm text-muted-foreground">
                      Get alerts when new diseases are detected in your region
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="disease-alerts"
                      className="h-4 w-4 rounded border-gray-300 text-crop-green-600 focus:ring-crop-green-500"
                      defaultChecked
                    />
                    <Label htmlFor="disease-alerts" className="text-sm">Enabled</Label>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                onClick={() => toast.success("Preferences saved")}
              >
                Save Preferences
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
