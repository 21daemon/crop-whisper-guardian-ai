
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Camera, Leaf, Bug, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";

// Mock crop disease data
const cropDiseases = [
  {
    id: 1,
    name: "Late Blight",
    scientificName: "Phytophthora infestans",
    description: "A destructive disease affecting potatoes and tomatoes. Causes dark lesions on leaves, stems and fruits.",
    treatment: "Fungicides containing chlorothalonil, mancozeb, or copper compounds. Remove infected plants and practice crop rotation.",
    severity: "High",
  },
  {
    id: 2,
    name: "Powdery Mildew",
    scientificName: "Erysiphe spp.",
    description: "Common fungal disease that appears as white powdery spots on leaves. Affects various crops including cucurbits, grapes, and cereals.",
    treatment: "Sulfur-based fungicides, neem oil, or potassium bicarbonate. Improve air circulation around plants.",
    severity: "Medium",
  },
  {
    id: 3,
    name: "Bacterial Leaf Spot",
    scientificName: "Xanthomonas spp.",
    description: "Causes water-soaked spots on leaves that later turn brown. Common in peppers, tomatoes, and leafy greens.",
    treatment: "Copper-based bactericides. Remove infected plant debris and avoid overhead watering.",
    severity: "Medium",
  },
  {
    id: 4,
    name: "Healthy",
    scientificName: "N/A",
    description: "The plant appears healthy with no visible signs of disease or pest damage.",
    treatment: "Continue regular maintenance and monitoring.",
    severity: "None",
  }
];

const Dashboard: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
          setSelectedImage(event.target.result);
          setResult(null); // Reset previous results
        }
      };
      
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
          setSelectedImage(event.target.result);
          setResult(null); // Reset previous results
        }
      };
      
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = () => {
    if (!selectedImage) return;
    
    setIsAnalyzing(true);
    
    // Simulate AI analysis with timeout
    setTimeout(() => {
      // For demo purposes, randomly select a disease
      const randomIndex = Math.floor(Math.random() * cropDiseases.length);
      const detected = cropDiseases[randomIndex];
      
      // Mock confidence scores
      const confidenceScores = cropDiseases.map(disease => ({
        name: disease.name,
        confidence: disease.id === detected.id ? 
          Math.floor(Math.random() * 21) + 80 : // 80-100% for detected disease
          Math.floor(Math.random() * 50) // 0-50% for others
      })).sort((a, b) => b.confidence - a.confidence);
      
      setResult({
        disease: detected,
        confidenceScores: confidenceScores
      });
      
      setIsAnalyzing(false);
      
      toast({
        title: "Analysis Complete",
        description: `Detected: ${detected.name}`,
      });
    }, 3000);
  };

  const handleCameraCapture = () => {
    // In a real app, this would access the device camera
    // For this demo, we just show a message
    toast({
      title: "Camera Access",
      description: "Camera functionality would open here in a real app.",
    });
  };

  const resetAnalysis = () => {
    setSelectedImage(null);
    setResult(null);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Welcome, {user?.name}!</h1>
          <p className="text-gray-600 mt-1">Upload a crop image to analyze for diseases</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Leaf className="h-5 w-5 mr-2 text-crop-green-600" />
                  Crop Image Analysis
                </CardTitle>
                <CardDescription>
                  Upload or take a photo of your crop to detect diseases
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!selectedImage ? (
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-all ${
                      isDragging ? "border-crop-green-500 bg-crop-green-50" : "border-gray-300"
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-600">
                      Drag & drop an image here or click to browse
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      Supports: JPG, JPEG, PNG (max 5MB)
                    </p>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleImageSelect}
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={selectedImage}
                      alt="Selected crop"
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={resetAnalysis}
                    >
                      Change Image
                    </Button>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={handleCameraCapture}
                  className="flex items-center"
                >
                  <Camera className="h-5 w-5 mr-2" />
                  Take Photo
                </Button>
                <Button
                  onClick={analyzeImage}
                  disabled={!selectedImage || isAnalyzing}
                  className="bg-crop-green-600 hover:bg-crop-green-700"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Analyzing...
                    </>
                  ) : (
                    "Analyze Image"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div>
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center">
                  {result ? (
                    result.disease.name === "Healthy" ? (
                      <>
                        <Leaf className="h-5 w-5 mr-2 text-crop-green-600" />
                        Healthy Plant Detected
                      </>
                    ) : (
                      <>
                        <Bug className="h-5 w-5 mr-2 text-red-500" />
                        Disease Detected
                      </>
                    )
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5 mr-2 text-gray-500" />
                      Analysis Results
                    </>
                  )}
                </CardTitle>
                <CardDescription>
                  {result
                    ? "View detected disease information and treatment recommendations"
                    : "Upload an image to see analysis results"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {result ? (
                  <div>
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold">
                        {result.disease.name}
                        {result.disease.name !== "Healthy" && (
                          <span className="text-sm font-normal text-gray-500 ml-2">
                            ({result.disease.scientificName})
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {result.disease.description}
                      </p>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700">Confidence Scores</h4>
                      <div className="mt-2 space-y-2">
                        {result.confidenceScores.slice(0, 3).map((score: any, index: number) => (
                          <div key={index} className="w-full">
                            <div className="flex justify-between text-xs mb-1">
                              <span>{score.name}</span>
                              <span>{score.confidence}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-crop-green-600 h-2 rounded-full"
                                style={{ width: `${score.confidence}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {result.disease.name !== "Healthy" && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-700">Treatment Recommendations</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {result.disease.treatment}
                        </p>
                      </div>
                    )}

                    <div>
                      <h4 className="text-sm font-semibold text-gray-700">Severity</h4>
                      <div className="flex items-center mt-1">
                        {result.disease.name === "Healthy" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            None - Healthy
                          </span>
                        ) : result.disease.severity === "High" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            High
                          </span>
                        ) : result.disease.severity === "Medium" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Medium
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Low
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No analysis results yet</p>
                    <p className="text-sm mt-2">
                      Upload a crop image and click "Analyze Image" to detect diseases
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
