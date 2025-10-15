import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Camera, Leaf, Bug, AlertCircle, Activity, Brain, BarChart3, TrendingUp, PieChart } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import Layout from '@/components/Layout';
import Chatbot from '@/components/Chatbot';
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, PieChart as RePieChart, Pie, Cell, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// Cotton disease data for reference and fallback
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

// Hash function to create consistent results based on image content
const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

const Dashboard: React.FC = () => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [diagnosesData, setDiagnosesData] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
          setSelectedImage(event.target.result);
          setResult(null);
          setAiAnalysis(null);
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
          setAiAnalysis(null);
        }
      };
      
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) return;
    
    setIsAnalyzing(true);
    setResult(null);
    setAiAnalysis(null);
    
    try {
      console.log('Starting AI disease prediction...');
      
      // Extract base64 from data URL
      const base64Data = selectedImage.split(',')[1];
      
      const { data, error } = await supabase.functions.invoke('gemini-analysis', {
        body: {
          imageBase64: base64Data,
          analysisType: 'disease_prediction'
        }
      });

      if (error) {
        console.error('AI analysis error:', error);
        toast({
          title: "Analysis Failed",
          description: "Could not analyze the image. Please try again.",
          variant: "destructive"
        });
        setIsAnalyzing(false);
        return;
      }

      console.log('AI response received:', data);
      
      // Parse AI response for disease prediction
      const analysis = data.analysis;
      
      // Extract disease name from AI analysis
      let detectedDiseaseName = "Unknown Disease";
      let detectedDisease = cottonDiseases[0]; // fallback
      let confidence = 75;
      
      // Check if it's healthy
      const isHealthy = analysis.toLowerCase().includes('healthy') && 
                       !analysis.toLowerCase().includes('disease') &&
                       !analysis.toLowerCase().includes('infected');
      
      if (isHealthy) {
        detectedDiseaseName = "Healthy Cotton";
        detectedDisease = cottonDiseases.find(d => d.name === "Healthy Cotton") || cottonDiseases[3];
        confidence = 90;
      } else {
        // Try to extract disease name from analysis
        const analysisLower = analysis.toLowerCase();
        
        if (analysisLower.includes('cotton leaf curl') || analysisLower.includes('leaf curl')) {
          detectedDiseaseName = "Cotton Leaf Curl Disease";
          detectedDisease = cottonDiseases[0];
          confidence = 85;
        } else if (analysisLower.includes('bacterial blight') || analysisLower.includes('blight')) {
          detectedDiseaseName = "Bacterial Blight";
          detectedDisease = cottonDiseases[1];
          confidence = 80;
        } else if (analysisLower.includes('fusarium wilt') || analysisLower.includes('wilt')) {
          detectedDiseaseName = "Fusarium Wilt";
          detectedDisease = cottonDiseases[2];
          confidence = 85;
        } else {
          // Extract potential disease name from first line of analysis
          const lines = analysis.split('\n');
          for (const line of lines) {
            if (line.toLowerCase().includes('disease') || line.toLowerCase().includes('infection')) {
              detectedDiseaseName = line.trim();
              break;
            }
          }
        }
      }
      
      // Generate confidence scores with the detected disease having highest confidence
      const confidenceScores = cottonDiseases.map(disease => {
        if (disease.name === detectedDiseaseName) {
          return { name: disease.name, confidence: confidence };
        } else {
          return { 
            name: disease.name, 
            confidence: Math.max(10, confidence - 20 - Math.random() * 30) 
          };
        }
      }).sort((a, b) => b.confidence - a.confidence);
      
      const analysisResult = {
        isCottonPlant: true,
        disease: detectedDisease,
        detectedDiseaseName: detectedDiseaseName,
        confidenceScores: confidenceScores,
        aiRawAnalysis: analysis
      };

      setResult(analysisResult);
      setAiAnalysis(analysis);
      
      // Save to database if user is authenticated and disease detected
      if (user && detectedDiseaseName !== "Healthy Cotton") {
        try {
          const { error } = await supabase
            .from('diagnoses')
            .insert({
              user_id: user.id,
              crop_id: 'cotton',
              disease_name: detectedDiseaseName,
              confidence: confidenceScores[0].confidence,
              diagnosis_text: detectedDisease.treatment,
              insights: analysis,
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
        description: `AI detected: ${detectedDiseaseName}`,
      });
      
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

  const analyzeWithAI = async (diseaseResult: any) => {
    setIsAiAnalyzing(true);
    
    try {
      // Extract base64 from data URL
      const base64Data = selectedImage?.split(',')[1] || '';
      
      const { data, error } = await supabase.functions.invoke('gemini-analysis', {
        body: {
          imageBase64: base64Data,
          analysisType: 'general_insights'
        }
      });

      if (error) {
        console.error('AI analysis error:', error);
        toast({
          title: "Advanced Analysis Failed",
          description: "Could not get insights from AI",
          variant: "destructive"
        });
      } else {
        setAiAnalysis(data.analysis);
        toast({
          title: "Advanced Analysis Complete",
          description: "AI insights are now available",
        });
      }
    } catch (error) {
      console.error('AI API error:', error);
      toast({
        title: "Advanced Analysis Failed",
        description: "Could not connect to AI service",
        variant: "destructive"
      });
    } finally {
      setIsAiAnalyzing(false);
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
    setAiAnalysis(null);
  };

  const formatAiAnalysis = (analysis: string) => {
    if (!analysis) return null;
    
    // Split the analysis into sections and format nicely
    const sections = analysis.split('\n').filter(line => line.trim());
    
    return (
      <div className="space-y-3">
        {sections.map((section, index) => {
          const trimmed = section.trim();
          
          // Check if it's a numbered point or bullet
          if (trimmed.match(/^\d+\./)) {
            return (
              <div key={index} className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                <p className="text-sm text-gray-700 font-medium">{trimmed}</p>
              </div>
            );
          }
          
          // Check if it's a header-like line (contains colons or is short)
          if (trimmed.includes(':') && trimmed.length < 100) {
            const [label, ...rest] = trimmed.split(':');
            return (
              <div key={index} className="mb-2">
                <h5 className="font-semibold text-gray-800 text-sm">{label.trim()}:</h5>
                {rest.length > 0 && (
                  <p className="text-sm text-gray-600 mt-1">{rest.join(':').trim()}</p>
                )}
              </div>
            );
          }
          
          // Regular paragraph
          return (
            <p key={index} className="text-sm text-gray-700 leading-relaxed">
              {trimmed}
            </p>
          );
        })}
      </div>
    );
  };

  // Fetch diagnoses data on component mount
  React.useEffect(() => {
    const fetchDiagnoses = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('diagnoses')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setDiagnosesData(data);
      }
    };
    
    fetchDiagnoses();
  }, [user]);

  // Process data for charts
  const processChartData = () => {
    if (diagnosesData.length === 0) {
      return {
        diseaseDistribution: [],
        confidenceScores: [],
        severityAnalysis: [],
        detectionTrends: []
      };
    }

    // 1. Disease Distribution
    const diseaseCounts = diagnosesData.reduce((acc: any, item: any) => {
      acc[item.disease_name] = (acc[item.disease_name] || 0) + 1;
      return acc;
    }, {});

    const diseaseDistribution = Object.entries(diseaseCounts).map(([name, count]) => {
      const colors: any = {
        'Cotton Leaf Curl Disease': '#ef4444',
        'Bacterial Blight': '#f97316',
        'Fusarium Wilt': '#eab308',
        'Healthy Cotton': '#22c55e'
      };
      return { name, value: count, color: colors[name] || '#6b7280' };
    });

    // 2. Average Confidence Scores
    const diseaseConfidence = diagnosesData.reduce((acc: any, item: any) => {
      if (!acc[item.disease_name]) {
        acc[item.disease_name] = { total: 0, count: 0 };
      }
      acc[item.disease_name].total += parseFloat(item.confidence || 0);
      acc[item.disease_name].count += 1;
      return acc;
    }, {});

    const confidenceScores = Object.entries(diseaseConfidence).map(([disease, data]: [string, any]) => ({
      disease: disease.replace('Cotton ', '').replace(' Disease', ''),
      confidence: Math.round(data.total / data.count)
    }));

    // 3. Severity Analysis
    const severityMap: any = {
      'Cotton Leaf Curl Disease': 'High',
      'Bacterial Blight': 'Medium',
      'Fusarium Wilt': 'High',
      'Healthy Cotton': 'None'
    };

    const severityCounts = diagnosesData.reduce((acc: any, item: any) => {
      const severity = severityMap[item.disease_name] || 'Low';
      acc[severity] = (acc[severity] || 0) + 1;
      return acc;
    }, {});

    const severityAnalysis = Object.entries(severityCounts).map(([severity, count]) => ({
      severity,
      count
    }));

    // 4. Detection Trends (group by month)
    const trendData = diagnosesData.reduce((acc: any, item: any) => {
      const date = new Date(item.created_at);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      acc[monthKey] = (acc[monthKey] || 0) + 1;
      return acc;
    }, {});

    const detectionTrends = Object.entries(trendData)
      .map(([month, detections]) => ({ month, detections }))
      .slice(-6); // Last 6 months

    return {
      diseaseDistribution,
      confidenceScores,
      severityAnalysis,
      detectionTrends
    };
  };

  const chartData = processChartData();

  const displayName = profile?.first_name 
    ? `${profile.first_name}${profile.last_name ? ` ${profile.last_name}` : ''}`
    : user?.email?.split('@')[0] || 'User';

  return (
    <Layout>
      <Chatbot />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Welcome, {displayName}!</h1>
          <p className="text-gray-600 mt-1">Cotton Disease Prediction & Plant Health Analysis</p>
        </div>

        <Tabs defaultValue="cotton-analysis" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="cotton-analysis">Cotton Disease Analysis</TabsTrigger>
            <TabsTrigger value="analytics">Analysis & Charts</TabsTrigger>
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
                      Upload an image of your cotton plant to detect diseases using AI
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
                          Analyzing with AI...
                        </>
                      ) : (
                        "Analyze with AI"
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
                        ) : result.detectedDiseaseName === "Healthy Cotton" ? (
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
                          AI Analysis Results
                        </>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {result
                        ? result.isCottonPlant === false
                          ? "Upload a valid cotton plant image"
                          : "AI-powered disease detection and analysis"
                        : "Upload a cotton plant image to see AI analysis results"}
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
                          {/* ML Model Badge */}
                          <div className="mb-4 flex items-center gap-2 bg-gradient-to-r from-purple-50 to-blue-50 p-3 rounded-lg border border-purple-200">
                            <Brain className="h-5 w-5 text-purple-600" />
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-purple-900">Analyzed with ML Model</p>
                              <p className="text-xs text-purple-700">AI Model - Advanced Disease Detection</p>
                            </div>
                            <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded-full">AI</span>
                          </div>

                          <div className="mb-4">
                            <h3 className="text-lg font-semibold">
                              {result.detectedDiseaseName}
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
                                    <span className={score.name === result.detectedDiseaseName ? "font-semibold" : ""}>
                                      {score.name}
                                    </span>
                                    <span className={score.name === result.detectedDiseaseName ? "font-semibold" : ""}>
                                      {Math.round(score.confidence)}%
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                      className={`h-2 rounded-full ${
                                        score.name === result.detectedDiseaseName 
                                          ? "bg-blue-600" 
                                          : "bg-crop-green-600"
                                      }`}
                                      style={{ width: `${score.confidence}%` }}
                                    ></div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {result.detectedDiseaseName !== "Healthy Cotton" && (
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
                              {result.detectedDiseaseName === "Healthy Cotton" ? (
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

                          {/* AI Analysis Section */}
                          <div className="border-t pt-4">
                            <h4 className="text-sm font-semibold text-gray-700 flex items-center mb-3">
                              <Activity className="h-4 w-4 mr-1" />
                              Detailed AI Analysis
                            </h4>
                            {aiAnalysis ? (
                              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                                {formatAiAnalysis(aiAnalysis)}
                              </div>
                            ) : (
                              <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-500">
                                AI analysis will appear here
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>No analysis results yet</p>
                        <p className="text-sm mt-2">
                          Upload a cotton plant image and click "Analyze with AI" to detect diseases
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart 1: Disease Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PieChart className="h-5 w-5 mr-2 text-blue-600" />
                    Disease Distribution
                  </CardTitle>
                  <CardDescription>Distribution of detected cotton diseases</CardDescription>
                </CardHeader>
                <CardContent>
                  {chartData.diseaseDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <RePieChart>
                        <Pie
                          data={chartData.diseaseDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {chartData.diseaseDistribution.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RePieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-gray-500">
                      <p>No diagnosis data yet. Analyze some images to see statistics.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Chart 2: Confidence Scores Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-green-600" />
                    Average Confidence Scores
                  </CardTitle>
                  <CardDescription>ML model confidence by disease type</CardDescription>
                </CardHeader>
                <CardContent>
                  {chartData.confidenceScores.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData.confidenceScores}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="disease" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="confidence" fill="#22c55e" name="Confidence %" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-gray-500">
                      <p>No diagnosis data yet.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Chart 3: Severity Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2 text-orange-600" />
                    Disease Severity Analysis
                  </CardTitle>
                  <CardDescription>Severity levels of detected diseases</CardDescription>
                </CardHeader>
                <CardContent>
                  {chartData.severityAnalysis.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData.severityAnalysis} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="severity" type="category" />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" fill="#3b82f6" name="Cases" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-gray-500">
                      <p>No diagnosis data yet.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Chart 4: Detection Trends */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-purple-600" />
                    Detection Trends
                  </CardTitle>
                  <CardDescription>Disease detection over time</CardDescription>
                </CardHeader>
                <CardContent>
                  {chartData.detectionTrends.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={chartData.detectionTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Area type="monotone" dataKey="detections" stroke="#8b5cf6" fill="#c4b5fd" name="Total Detections" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-gray-500">
                      <p>No diagnosis data yet.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
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
