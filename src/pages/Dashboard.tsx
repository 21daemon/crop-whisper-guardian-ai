
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Camera, Leaf, Bug, AlertCircle, Activity } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

// Cotton disease data
const cottonDiseases = [
  {
    id: 1,
    name: "Cotton Leaf Curl Disease",
    symptoms: "Leaf curling, yellowing, stunted growth, reduced fiber quality",
    treatment: "Use resistant varieties, control whitefly vectors, apply systemic insecticides",
    severity: "High",
  },
  {
    id: 2,
    name: "Bacterial Blight",
    symptoms: "Water-soaked spots on leaves, angular lesions, defoliation",
    treatment: "Copper-based bactericides, crop rotation, resistant varieties",
    severity: "Medium",
  },
  {
    id: 3,
    name: "Fusarium Wilt",
    symptoms: "Yellowing of lower leaves, wilting, vascular discoloration",
    treatment: "Resistant varieties, soil fumigation, proper drainage",
    severity: "High",
  },
  {
    id: 4,
    name: "Healthy Cotton",
    symptoms: "No visible symptoms, normal growth pattern",
    treatment: "Continue regular monitoring and preventive care",
    severity: "None",
  }
];

// General plant diseases for other crops
const generalPlantDiseases = [
  {
    crop: "Tomato",
    diseases: [
      {
        name: "Late Blight",
        symptoms: "Dark lesions on leaves and fruits, white fungal growth",
        treatment: "Fungicides, proper spacing, avoid overhead watering"
      },
      {
        name: "Early Blight",
        symptoms: "Concentric ring spots on leaves, yellowing",
        treatment: "Crop rotation, fungicide application, resistant varieties"
      }
    ]
  },
  {
    crop: "Wheat",
    diseases: [
      {
        name: "Rust Disease",
        symptoms: "Orange/brown pustules on leaves and stems",
        treatment: "Fungicide application, resistant varieties, proper timing"
      },
      {
        name: "Powdery Mildew",
        symptoms: "White powdery coating on leaves",
        treatment: "Fungicides, adequate spacing, sulfur applications"
      }
    ]
  },
  {
    crop: "Rice",
    diseases: [
      {
        name: "Blast Disease",
        symptoms: "Diamond-shaped lesions on leaves, neck rot",
        treatment: "Silicon application, resistant varieties, water management"
      },
      {
        name: "Bacterial Leaf Blight",
        symptoms: "Water-soaked lesions, yellowing margins",
        treatment: "Copper bactericides, seed treatment, balanced nutrition"
      }
    ]
  }
];

const Dashboard: React.FC = () => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [geminiAnalysis, setGeminiAnalysis] = useState<string | null>(null);
  const [isGeminiAnalyzing, setIsGeminiAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
          setSelectedImage(event.target.result);
          setResult(null);
          setGeminiAnalysis(null);
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
          setResult(null);
          setGeminiAnalysis(null);
        }
      };
      
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) return;
    
    setIsAnalyzing(true);
    
    try {
      // Simulate cotton plant detection and disease prediction
      const isCottonPlant = Math.random() > 0.3; // 70% chance it's a cotton plant
      
      if (!isCottonPlant) {
        setResult({
          isCottonPlant: false,
          message: "This image does not appear to be a cotton plant. Please upload a valid cotton crop image."
        });
        setIsAnalyzing(false);
        toast({
          title: "Not a Cotton Plant",
          description: "Please upload an image of a cotton plant for disease prediction.",
          variant: "destructive"
        });
        return;
      }

      // Simulate disease detection for cotton
      const randomIndex = Math.floor(Math.random() * cottonDiseases.length);
      const detected = cottonDiseases[randomIndex];
      
      const confidenceScores = cottonDiseases.map(disease => ({
        name: disease.name,
        confidence: disease.id === detected.id ? 
          Math.floor(Math.random() * 21) + 80 : 
          Math.floor(Math.random() * 50)
      })).sort((a, b) => b.confidence - a.confidence);
      
      const analysisResult = {
        isCottonPlant: true,
        disease: detected,
        confidenceScores: confidenceScores
      };
      
      setResult(analysisResult);
      
      // Save to database if user is authenticated
      if (user && detected.name !== "Healthy Cotton") {
        try {
          const { error } = await supabase
            .from('diagnoses')
            .insert({
              crop_id: null, // We'll need to create a crop record first in a real implementation
              disease_name: detected.name,
              confidence: confidenceScores[0].confidence,
              treatment_recommendation: detected.treatment,
              image_url: selectedImage
            });
          
          if (error) {
            console.error('Error saving diagnosis:', error);
          }
        } catch (dbError) {
          console.error('Database error:', dbError);
        }
      }
      
      setIsAnalyzing(false);
      
      toast({
        title: "Analysis Complete",
        description: `Detected: ${detected.name}`,
      });

      // Trigger Gemini analysis for further insights
      if (detected.name !== "Healthy Cotton") {
        await analyzeWithGemini(analysisResult);
      }
      
    } catch (error) {
      console.error('Analysis error:', error);
      setIsAnalyzing(false);
      toast({
        title: "Analysis Failed",
        description: "Please try again later.",
        variant: "destructive"
      });
    }
  };

  const analyzeWithGemini = async (diseaseResult: any) => {
    setIsGeminiAnalyzing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('gemini-analysis', {
        body: {
          diseaseData: diseaseResult,
          imageBase64: selectedImage
        }
      });

      if (error) {
        console.error('Gemini analysis error:', error);
        toast({
          title: "Advanced Analysis Failed",
          description: "Could not get insights from Gemini API",
          variant: "destructive"
        });
      } else {
        setGeminiAnalysis(data.analysis);
        toast({
          title: "Advanced Analysis Complete",
          description: "Gemini insights are now available",
        });
      }
    } catch (error) {
      console.error('Gemini API error:', error);
      toast({
        title: "Advanced Analysis Failed",
        description: "Could not connect to Gemini API",
        variant: "destructive"
      });
    } finally {
      setIsGeminiAnalyzing(false);
    }
  };

  const handleCameraCapture = () => {
    toast({
      title: "Camera Access",
      description: "Camera functionality would open here in a real app.",
    });
  };

  const resetAnalysis = () => {
    setSelectedImage(null);
    setResult(null);
    setGeminiAnalysis(null);
  };

  const displayName = profile?.first_name 
    ? `${profile.first_name}${profile.last_name ? ` ${profile.last_name}` : ''}`
    : user?.email?.split('@')[0] || 'User';

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Welcome, {displayName}!</h1>
          <p className="text-gray-600 mt-1">Cotton Disease Prediction & Plant Health Analysis</p>
        </div>

        <Tabs defaultValue="cotton-analysis" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="cotton-analysis">Cotton Disease Analysis</TabsTrigger>
            <TabsTrigger value="general-diseases">General Plant Diseases</TabsTrigger>
          </TabsList>

          <TabsContent value="cotton-analysis">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Leaf className="h-5 w-5 mr-2 text-crop-green-600" />
                      Cotton Crop Image Analysis
                    </CardTitle>
                    <CardDescription>
                      Upload an image of your cotton plant to detect diseases
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
                          Drag & drop a cotton plant image here or click to browse
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
                          alt="Selected cotton plant"
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
                        "Analyze Cotton Plant"
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
                        result.isCottonPlant === false ? (
                          <>
                            <AlertCircle className="h-5 w-5 mr-2 text-orange-500" />
                            Invalid Plant Type
                          </>
                        ) : result.disease?.name === "Healthy Cotton" ? (
                          <>
                            <Leaf className="h-5 w-5 mr-2 text-crop-green-600" />
                            Healthy Cotton Plant
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
                        ? result.isCottonPlant === false
                          ? "Upload a valid cotton plant image"
                          : "View detected disease information and treatment recommendations"
                        : "Upload a cotton plant image to see analysis results"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {result ? (
                      result.isCottonPlant === false ? (
                        <div className="text-center py-8">
                          <AlertCircle className="h-12 w-12 mx-auto mb-3 text-orange-400" />
                          <p className="text-orange-600 font-medium">{result.message}</p>
                        </div>
                      ) : (
                        <div>
                          <div className="mb-4">
                            <h3 className="text-lg font-semibold">
                              {result.disease.name}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              <strong>Symptoms:</strong> {result.disease.symptoms}
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

                          {result.disease.name !== "Healthy Cotton" && (
                            <div className="mb-4">
                              <h4 className="text-sm font-semibold text-gray-700">Treatment Recommendations</h4>
                              <p className="text-sm text-gray-600 mt-1">
                                {result.disease.treatment}
                              </p>
                            </div>
                          )}

                          <div className="mb-4">
                            <h4 className="text-sm font-semibold text-gray-700">Severity</h4>
                            <div className="flex items-center mt-1">
                              {result.disease.name === "Healthy Cotton" ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  None - Healthy
                                </span>
                              ) : result.disease.severity === "High" ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  High
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  Medium
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Gemini Analysis Section */}
                          {result.disease.name !== "Healthy Cotton" && (
                            <div className="border-t pt-4">
                              <h4 className="text-sm font-semibold text-gray-700 flex items-center mb-2">
                                <Activity className="h-4 w-4 mr-1" />
                                Advanced AI Insights
                                {isGeminiAnalyzing && (
                                  <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-crop-green-600 ml-2"></div>
                                )}
                              </h4>
                              {geminiAnalysis ? (
                                <div className="bg-blue-50 p-3 rounded-lg text-sm text-gray-700">
                                  {geminiAnalysis}
                                </div>
                              ) : isGeminiAnalyzing ? (
                                <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-500">
                                  Getting advanced insights from Gemini AI...
                                </div>
                              ) : (
                                <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-500">
                                  Advanced analysis will appear here
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>No analysis results yet</p>
                        <p className="text-sm mt-2">
                          Upload a cotton plant image and click "Analyze Cotton Plant" to detect diseases
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="general-diseases">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {generalPlantDiseases.map((cropData, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Leaf className="h-5 w-5 mr-2 text-crop-green-600" />
                      {cropData.crop}
                    </CardTitle>
                    <CardDescription>
                      Common diseases affecting {cropData.crop.toLowerCase()} crops
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {cropData.diseases.map((disease, diseaseIndex) => (
                        <div key={diseaseIndex} className="border-l-4 border-crop-green-500 pl-3">
                          <h4 className="font-semibold text-gray-900">{disease.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            <strong>Symptoms:</strong> {disease.symptoms}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            <strong>Treatment:</strong> {disease.treatment}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Dashboard;
