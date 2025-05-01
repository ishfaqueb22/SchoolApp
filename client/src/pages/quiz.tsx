import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowRight, ArrowLeft, CheckCircle, School, MapPin, BookOpen, DollarSign, Award, HelpCircle, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { v4 as uuidv4 } from 'uuid';
import SchoolCard from "@/components/schools/SchoolCard";
import MainLayout from "@/components/layout/MainLayout";

// Define the question structure
interface QuizQuestion {
  id: number;
  questionText: string;
  choices: string[] | null;
  category: string;
  order: number;
  answerType: string;
  createdAt: string;
}

// Define the quiz state
interface QuizState {
  sessionId: string;
  currentQuestionIndex: number;
  answers: Record<number, string[]>;
  preferences: {
    schoolType: string[];
    curriculum: string[];
    location: string[];
    features: string[];
    extracurricular: string[];
    budget: string;
  };
  isComplete: boolean;
  results: any | null;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.1
    }
  },
  exit: {
    opacity: 0,
    transition: { when: "afterChildren" }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1
  },
  exit: {
    y: -20,
    opacity: 0
  }
};

const QuizPage = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Safe authentication check that works even without AuthProvider
  const [authState, setAuthState] = useState({
    user: null,
    isAuthenticated: false,
    isLoading: true
  });
  
  // Fetch user data directly from API
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setAuthState({
            user: userData,
            isAuthenticated: true,
            isLoading: false
          });
        } else {
          // User is not authenticated
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false
          });
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false
        });
      }
    };
    
    checkAuth();
  }, []);
  
  // Initialize quiz state
  const [quizState, setQuizState] = useState<QuizState>({
    sessionId: uuidv4(),
    currentQuestionIndex: 0,
    answers: {},
    preferences: {
      schoolType: [],
      curriculum: [],
      location: [],
      features: [],
      extracurricular: [],
      budget: "",
    },
    isComplete: false,
    results: null
  });
  
  // Fetch quiz questions
  const { data: questions, isLoading: questionsLoading, error: questionsError } = useQuery({
    queryKey: ['/api/quiz/questions'],
    enabled: !quizState.isComplete
  });
  
  // Submit quiz responses mutation
  const { mutate: submitQuiz, isPending: isSubmitting } = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/quiz/response', data),
    onSuccess: (data) => {
      setQuizState(prev => ({
        ...prev,
        isComplete: true,
        results: data
      }));
      
      toast({
        title: "Quiz completed!",
        description: "We've found some schools that match your preferences."
      });
      
      // Store the session ID in local storage for anonymous users
      if (!authState.isAuthenticated) {
        localStorage.setItem('quiz_session_id', quizState.sessionId);
      }
    },
    onError: (error: any) => {
      console.error("Error submitting quiz:", error);
      
      // Check if authentication error
      if (error.status === 401) {
        toast({
          title: "Authentication Required",
          description: "Please log in to submit your quiz results.",
          variant: "destructive"
        });
        
        // Redirect to login after a short delay
        setTimeout(() => {
          window.location.href = `/login?redirect=${encodeURIComponent('/quiz')}`;
        }, 2000);
        
      } else {
        toast({
          title: "Error",
          description: "Failed to submit quiz. Please try again.",
          variant: "destructive"
        });
      }
    }
  });
  
  // Process the user's answers into preferences
  const processAnswers = () => {
    const preferences = {
      schoolType: [] as string[],
      curriculum: [] as string[],
      location: [] as string[],
      features: [] as string[],
      extracurricular: [] as string[],
      budget: "",
    };
    
    // Map question categories to preference properties
    questions?.forEach((question: QuizQuestion) => {
      const answers = quizState.answers[question.id] || [];
      
      switch (question.category) {
        case "school_type":
          preferences.schoolType = [...preferences.schoolType, ...answers];
          break;
        case "curriculum":
          preferences.curriculum = [...preferences.curriculum, ...answers];
          break;
        case "location":
          preferences.location = [...preferences.location, ...answers];
          break;
        case "features":
          preferences.features = [...preferences.features, ...answers];
          break;
        case "extracurricular":
          preferences.extracurricular = [...preferences.extracurricular, ...answers];
          break;
        case "budget":
          // Assume only one budget option is selected
          preferences.budget = answers[0] || "";
          break;
      }
    });
    
    return preferences;
  };
  
  // Handle answer selection
  const handleAnswerSelect = (questionId: number, answer: string) => {
    setQuizState(prev => {
      const question = questions.find((q: QuizQuestion) => q.id === questionId);
      const currentAnswers = prev.answers[questionId] || [];
      
      let newAnswers;
      // Multi-select if answerType contains 'multiple' and not set to single choice
      const isMultiSelect = question?.answerType?.includes('multiple') && !['single', 'one'].some(type => question.answerType.includes(type));
      
      if (isMultiSelect) {
        // Toggle answer for multi-select questions
        if (currentAnswers.includes(answer)) {
          newAnswers = currentAnswers.filter(a => a !== answer);
        } else {
          newAnswers = [...currentAnswers, answer];
        }
      } else {
        // Replace answer for single-select questions
        newAnswers = [answer];
      }
      
      return {
        ...prev,
        answers: {
          ...prev.answers,
          [questionId]: newAnswers
        }
      };
    });
  };
  
  // Navigate to the next question
  const handleNext = () => {
    if (questions && quizState.currentQuestionIndex < questions.length - 1) {
      setQuizState(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1
      }));
    } else {
      // Submit the quiz
      const preferences = processAnswers();
      setQuizState(prev => ({
        ...prev,
        preferences
      }));
      
      console.log("Submitting quiz with session ID:", quizState.sessionId);
      console.log("User authenticated:", authState.isAuthenticated ? "Yes" : "No");
      console.log("Processed preferences:", preferences);
      console.log("Quiz responses:", quizState.answers);
      
      submitQuiz({
        sessionId: quizState.sessionId,
        response: quizState.answers,
        preferences
      });
    }
  };
  
  // Navigate to the previous question
  const handlePrevious = () => {
    if (quizState.currentQuestionIndex > 0) {
      setQuizState(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex - 1
      }));
    }
  };
  
  // Check if current question is answered
  const isCurrentQuestionAnswered = () => {
    if (!questions) return false;
    
    const currentQuestion = questions[quizState.currentQuestionIndex];
    if (!currentQuestion) return false;
    
    const answers = quizState.answers[currentQuestion.id] || [];
    return answers.length > 0;
  };

  // Restart the quiz
  const handleRestart = () => {
    setQuizState({
      sessionId: uuidv4(),
      currentQuestionIndex: 0,
      answers: {},
      preferences: {
        schoolType: [],
        curriculum: [],
        location: [],
        features: [],
        extracurricular: [],
        budget: "",
      },
      isComplete: false,
      results: null
    });
  };

  // View a matched school
  const viewSchool = (schoolId: number) => {
    setLocation(`/schools/${schoolId}`);
  };
  
  // Loading state
  if (questionsLoading || !questions) {
    return (
      <MainLayout title="Loading Quiz..." description="Please wait while we load the quiz questions">
        <div className="container mx-auto py-10 flex flex-col items-center justify-center min-h-[50vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <h2 className="text-2xl font-semibold text-center">Loading quiz questions...</h2>
        </div>
      </MainLayout>
    );
  }
  
  // Error state
  if (questionsError) {
    return (
      <MainLayout title="Error - Quiz" description="An error occurred while loading quiz questions">
        <div className="container mx-auto py-10 flex flex-col items-center justify-center min-h-[50vh]">
          <h2 className="text-2xl font-semibold text-center text-destructive mb-4">
            Error loading quiz questions
          </h2>
          <p className="text-gray-600 max-w-md text-center mb-6">
            We couldn't load the quiz questions. Please try again later or contact support if the problem persists.
          </p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </MainLayout>
    );
  }
  
  // Results view (quiz complete)
  if (quizState.isComplete && quizState.results) {
    // Extract data from results, ensuring we have defaults if any properties are missing
    const schoolMatches = quizState.results.schoolMatches || [];
    const aiAnalysis = quizState.results.aiAnalysis || {
      insights: "We've analyzed your preferences to find educational options.",
      recommendations: [],
      nextSteps: [],
      personalizedAdvice: ""
    };
    
    return (
      <MainLayout title="Your School Matches - Quiz Results" description="View schools that match your preferences based on your quiz answers">
        <div className="container mx-auto py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-block rounded-full bg-green-100 p-3 text-green-600 mb-4"
            >
              <CheckCircle size={42} />
            </motion.div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Your School Matches</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Based on your preferences, we've found {schoolMatches.length} schools that might be a good fit for you.
            </p>
          </div>
          
          {/* AI Analysis Insights Panel */}
          {aiAnalysis && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-8"
            >
              <Card className="bg-primary/5 border-primary/10">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-6 w-6 text-primary"><path d="M12 2c1.7 0 3.3.7 4.5 1.9A6.54 6.54 0 0 1 18.4 8.4c0 1-.2 2-.5 2.9 0 .1-.1.1-.1.2-.1.3 0 .5.1.7l1.8 2.9c.2.2.2.6 0 .8-.1.2-.4.2-.6.2h-2.9c-.4 0-.7.2-.9.6-.2.5-.5.9-.8 1.3-.3.4-.4.8-.3 1.3.1.4.2.8.4 1.2.2.4.3.9.2 1.3-.2.9-1 1.4-1.8 1.4-.5 0-.9-.2-1.2-.6-.4-.5-.8-.9-1.3-1.3-.5-.3-1-.5-1.6-.5s-1.1.2-1.6.5c-.5.3-.9.8-1.3 1.3-.3.4-.7.6-1.2.6-.8 0-1.6-.5-1.8-1.4-.1-.4 0-.9.2-1.3.2-.4.3-.8.4-1.2.1-.5 0-.9-.3-1.3-.3-.4-.5-.8-.8-1.3-.2-.3-.5-.6-.9-.6H3.8c-.2 0-.5-.1-.6-.2-.1-.2-.1-.6 0-.8l1.8-2.9c.1-.2.2-.5.1-.7 0-.1-.1-.1-.1-.2-.3-.9-.5-1.9-.5-2.9 0-1.7.7-3.3 1.9-4.5C8.7 2.7 10.3 2 12 2Z"></path><circle cx="12" cy="8.5" r="1.5"></circle><path d="M10.5 13h.5c.5 0 1 .2 1.4.5.4.3.4.8.1 1.1-.4.4-.4 1-.2 1.4.3.4.7.4 1.1.1.3-.2.8-.2 1.1.1.3.3.3.8.1 1.1-.4.4-.4 1 0 1.4.2.3.3.3.5.3"></path></svg>
                    AI Analysis
                  </CardTitle>
                  <CardDescription>
                    Personalized insights based on your preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Key Insights */}
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Key Insights</h3>
                      <p className="text-gray-700 leading-relaxed">
                        {aiAnalysis.insights || "We've analyzed your preferences to find the best educational matches for your needs."}
                      </p>
                    </div>
                    
                    {/* Recommendations */}
                    {aiAnalysis.recommendations && aiAnalysis.recommendations.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Recommendations</h3>
                        <div className="grid gap-4 md:grid-cols-2">
                          {aiAnalysis.recommendations.map((rec: any, i: number) => (
                            <Card key={i} className="bg-white">
                              <CardHeader className="pb-2">
                                <CardTitle className="text-base font-medium">{rec.title}</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <p className="text-sm text-gray-600">{rec.description}</p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Next Steps */}
                    {aiAnalysis.nextSteps && aiAnalysis.nextSteps.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Next Steps</h3>
                        <ul className="space-y-2">
                          {aiAnalysis.nextSteps.map((step: string, i: number) => (
                            <li key={i} className="flex items-start">
                              <div className="mr-2 mt-0.5 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                                {i + 1}
                              </div>
                              <span className="text-gray-700">{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Personalized Advice */}
                    {aiAnalysis.personalizedAdvice && (
                      <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                        <h3 className="text-lg font-semibold mb-2 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-primary"><path d="m3 11 18-5v12L3 14v-3z"></path><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"></path></svg>
                          Personalized Advice
                        </h3>
                        <p className="text-gray-700 italic">{aiAnalysis.personalizedAdvice}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
          
          {/* School Match Results */}
          {schoolMatches.length > 0 ? (
            <div className="grid gap-6">
              {schoolMatches.map((match: any, index: number) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <Card className="relative overflow-hidden">
                    {index === 0 && (
                      <div className="absolute top-0 right-0 bg-gradient-to-r from-primary to-primary/80 text-white py-1 px-4 rounded-bl-md font-medium z-10">
                        Top Match
                      </div>
                    )}
                    <CardContent className="p-0">
                      <div className="flex flex-col md:flex-row">
                        <div className="md:w-1/3 p-6 space-y-4">
                          <div className="flex justify-between">
                            <div className="text-3xl font-bold text-primary">
                              {Math.round(match.matchScore * 10)}%
                            </div>
                            <div className="text-sm text-gray-500">Match Score</div>
                          </div>
                          <div>
                            <h4 className="font-medium text-sm mb-2">Match Factors:</h4>
                            <div className="space-y-1">
                              {match.matchFactors.map((factor: string, i: number) => (
                                <div key={i} className="flex items-center text-sm">
                                  <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                                  <span className="capitalize">{factor}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="md:w-2/3 border-t md:border-t-0 md:border-l border-gray-200">
                          <SchoolCard school={match} />
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end p-4 bg-gray-50">
                      <Button onClick={() => viewSchool(match.id)}>
                        View School Details
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="text-center p-6">
              <CardContent className="pt-6">
                <div className="mb-4">
                  <School className="mx-auto h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-medium mb-2">No Matching Schools Found</h3>
                <p className="text-gray-600 mb-4">
                  We couldn't find any schools that match your specific preferences. Try adjusting your criteria.
                </p>
              </CardContent>
              <CardFooter className="justify-center">
                <Button onClick={handleRestart}>
                  Retake Quiz
                </Button>
              </CardFooter>
            </Card>
          )}
          
          <div className="mt-8 text-center">
            <Button variant="outline" onClick={handleRestart} className="mr-2">
              Retake Quiz
            </Button>
            <Button onClick={() => setLocation('/discover')}>
              Browse All Schools
            </Button>
          </div>
        </motion.div>
      </div>
      </MainLayout>
    );
  }
  
  // Quiz in progress
  // Make sure we have questions and that they're properly loaded
  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    return (
      <MainLayout title="Loading Quiz..." description="Please wait while we load the quiz questions">
        <div className="container mx-auto py-10 flex flex-col items-center justify-center min-h-[50vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <h2 className="text-2xl font-semibold text-center">Loading quiz questions...</h2>
        </div>
      </MainLayout>
    );
  }

  const currentQuestion = questions[quizState.currentQuestionIndex];
  // Make sure current question exists
  if (!currentQuestion) {
    return (
      <MainLayout title="Error - Quiz Question" description="An error occurred while loading the quiz question">
        <div className="container mx-auto py-10 flex flex-col items-center justify-center min-h-[50vh]">
          <h2 className="text-2xl font-semibold text-center text-destructive mb-4">
            Error loading quiz question
          </h2>
          <p className="text-gray-600 max-w-md text-center mb-6">
            We couldn't load the current quiz question. Please try again.
          </p>
          <Button onClick={handleRestart}>
            Restart Quiz
          </Button>
        </div>
      </MainLayout>
    );
  }
  
  const progress = ((quizState.currentQuestionIndex + 1) / questions.length) * 100;
  
  return (
    <MainLayout 
      title="School Matching Quiz - Find Your Perfect School" 
      description="Take our interactive quiz to find schools that match your preferences and requirements"
    >
      <div className="container mx-auto py-10 bg-gradient-to-b from-primary/5 to-transparent rounded-lg">
        <div className="max-w-3xl mx-auto px-4">
          <div className="mb-8">
          <div className="text-center mb-6">
            <Badge variant="outline" className="mb-3 px-3 py-1 bg-primary/10 text-primary font-medium">
              School Matching Quiz
            </Badge>
            <h1 className="text-4xl font-bold text-center mb-3 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
              Find Your Perfect School
            </h1>
            <p className="text-center text-gray-600 mb-6 max-w-xl mx-auto">
              Answer these questions to help us understand your preferences, and we'll match you with schools that best fit your needs
            </p>
          </div>
          
          <div className="p-4 rounded-lg bg-white shadow-sm border mb-6">
            <div className="mb-2 flex justify-between text-sm font-medium">
              <span className="flex items-center">
                <span className="bg-primary text-white w-6 h-6 rounded-full inline-flex items-center justify-center mr-2 text-xs">
                  {quizState.currentQuestionIndex + 1}
                </span>
                Question {quizState.currentQuestionIndex + 1} of {questions.length}
              </span>
              <span className="text-primary font-semibold">{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-3 rounded-full" />
          </div>
        </div>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="mb-8"
          >
            <Card className="border-primary/10 shadow-md">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
                <div className="flex items-center mb-2">
                  <div className="p-2 rounded-full bg-primary/10 mr-3">
                    {currentQuestion.category === "school_type" && <School className="h-5 w-5 text-primary" />}
                    {currentQuestion.category === "location" && <MapPin className="h-5 w-5 text-primary" />}
                    {currentQuestion.category === "curriculum" && <BookOpen className="h-5 w-5 text-primary" />}
                    {currentQuestion.category === "budget" && <DollarSign className="h-5 w-5 text-primary" />}
                    {currentQuestion.category === "features" && <Award className="h-5 w-5 text-primary" />}
                    {!["school_type", "location", "curriculum", "budget", "features"].includes(currentQuestion.category) && 
                      <HelpCircle className="h-5 w-5 text-primary" />}
                  </div>
                  <div>
                    <CardTitle className="text-xl">{currentQuestion.questionText}</CardTitle>
                    <CardDescription className="mt-1">
                      {currentQuestion.answerType?.includes('multiple') && !['single', 'one'].some(type => currentQuestion.answerType.includes(type)) 
                        ? "Select all options that apply to your preferences" 
                        : "Select one option that best matches your preference"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {currentQuestion.answerType === "slider" ? (
                    <div className="p-6">
                      <div className="mb-6">
                        <div className="flex justify-between mb-2 text-sm text-muted-foreground">
                          <span>Not Important</span>
                          <span>Very Important</span>
                        </div>
                        <Slider
                          defaultValue={[(quizState.answers[currentQuestion.id]?.[0] && parseInt(quizState.answers[currentQuestion.id][0])) || 50]}
                          min={0}
                          max={100}
                          step={10}
                          onValueChange={(value) => {
                            handleAnswerSelect(currentQuestion.id, value[0].toString());
                          }}
                          className="py-4"
                        />
                        <div className="flex justify-center mt-4">
                          <Badge variant="outline" className="px-4 py-2 text-base">
                            {(quizState.answers[currentQuestion.id]?.[0] && parseInt(quizState.answers[currentQuestion.id][0])) || 50}%
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ) : currentQuestion.choices && currentQuestion.choices.map((option, index) => {
                    const isSelected = (quizState.answers[currentQuestion.id] || []).includes(option);
                    
                    return (
                      <motion.div
                        key={index}
                        variants={itemVariants}
                        className="relative"
                      >
                        <button
                          className={`w-full text-left p-5 rounded-md border transition-all duration-200 ${
                            isSelected
                              ? "border-primary bg-primary/5 text-primary shadow-sm"
                              : "border-gray-200 hover:border-primary/30 hover:bg-gray-50"
                          }`}
                          onClick={() => handleAnswerSelect(currentQuestion.id, option)}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${
                                isSelected 
                                  ? "border-primary bg-primary" 
                                  : "border-gray-300"
                              }`}>
                                {isSelected && (
                                  <Check className="h-3 w-3 text-white" />
                                )}
                              </div>
                              <span className={`font-medium ${isSelected ? "text-primary" : ""}`}>{option}</span>
                            </div>
                            {isSelected && (
                              <div className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">Selected</div>
                            )}
                          </div>
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
        
        <div className="mt-8 flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={quizState.currentQuestionIndex === 0}
            className="border-primary/20 hover:bg-primary/5 hover:text-primary transition-all duration-200 px-5 py-6 h-auto"
            size="lg"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            <span className="font-medium">Previous</span>
          </Button>
          
          <div className="text-sm text-muted-foreground">
            {isCurrentQuestionAnswered() 
              ? "Continue to the next question" 
              : "Please select an option to continue"}
          </div>
          
          <Button
            onClick={handleNext}
            disabled={!isCurrentQuestionAnswered() || isSubmitting}
            className="bg-primary hover:bg-primary/90 transition-all duration-200 px-6 py-6 h-auto"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                <span className="font-medium">Processing...</span>
              </>
            ) : quizState.currentQuestionIndex === questions.length - 1 ? (
              <>
                <span className="font-medium">Get Your Results</span>
                <CheckCircle className="ml-2 h-5 w-5" />
              </>
            ) : (
              <>
                <span className="font-medium">Next</span>
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        </div>
      </div>
      </div>
    </MainLayout>
  );
};

// Export as both QuizPage and Quiz for compatibility
const Quiz = QuizPage;
export { Quiz };
export default QuizPage;