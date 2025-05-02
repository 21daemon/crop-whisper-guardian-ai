
import React from "react";
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Leaf } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <div className="mx-auto h-24 w-24 rounded-full bg-crop-green-100 flex items-center justify-center mb-6">
          <Leaf className="h-12 w-12 text-crop-green-600" />
        </div>
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-6">
          Oops! We couldn't find this page.
        </p>
        <p className="text-gray-500 mb-8">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button asChild className="bg-crop-green-600 hover:bg-crop-green-700">
            <Link to="/dashboard">
              Go to Dashboard
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/login">
              Go to Login
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
