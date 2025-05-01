import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlatformAdminLayout } from '@/components/layouts/platform-admin-layout';
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from '@/components/ui/badge';
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from '@/hooks/use-toast';
import {
  Search, PlusCircle, Edit, Trash, MoveUp, MoveDown, GraduationCap,
  FileQuestion, BookOpen, School, Dumbbell, Lightbulb, PaintBucket,
  Ban, Check, Plus, Minus
} from 'lucide-react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Question type for TypeScript
interface QuizQuestion {
  id: number;
  questionText: string;
  category: string;
  order: number;
  answerType: string;
  choices?: string[];
}

// Form schema for creating/editing questions
const questionFormSchema = z.object({
  questionText: z.string().min(10, "Question must be at least 10 characters"),
  category: z.string().min(1, "Category is required"),
  answerType: z.string().min(1, "Answer type is required"),
  choices: z.array(z.string()).optional(),
  order: z.number().min(1)
});

type QuestionFormValues = z.infer<typeof questionFormSchema>;

const QuizManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedQuestion, setSelectedQuestion] = useState<QuizQuestion | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [choiceInputs, setChoiceInputs] = useState<string[]>(['', '']);
  
  const queryClient = useQueryClient();
  
  // Initialize form
  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      questionText: "",
      category: "",
      answerType: "multiple-choice",
      choices: ["", ""],
      order: 1
    }
  });
  
  // Fetch all quiz questions
  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['/api/platform-admin/quiz-questions'],
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error fetching quiz questions",
        description: "There was a problem loading the quiz questions data."
      });
    }
  });
  
  // Create new question mutation
  const createQuestionMutation = useMutation({
    mutationFn: async (questionData: QuestionFormValues) => {
      const response = await fetch(`/api/platform-admin/quiz-questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(questionData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create quiz question');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/platform-admin/quiz-questions'] });
      setIsCreateDialogOpen(false);
      form.reset();
      setChoiceInputs(['', '']);
      toast({
        title: "Question created",
        description: "The quiz question has been created successfully."
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Creation failed",
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
    }
  });
  
  // Update question mutation
  const updateQuestionMutation = useMutation({
    mutationFn: async ({ id, questionData }: { id: number, questionData: QuestionFormValues }) => {
      const response = await fetch(`/api/platform-admin/quiz-questions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(questionData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update quiz question');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/platform-admin/quiz-questions'] });
      setIsEditDialogOpen(false);
      toast({
        title: "Question updated",
        description: "The quiz question has been updated successfully."
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
    }
  });
  
  // Delete question mutation
  const deleteQuestionMutation = useMutation({
    mutationFn: async (questionId: number) => {
      const response = await fetch(`/api/platform-admin/quiz-questions/${questionId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete quiz question');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/platform-admin/quiz-questions'] });
      setIsDeleteDialogOpen(false);
      toast({
        title: "Question deleted",
        description: "The quiz question has been permanently deleted."
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Deletion failed",
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
    }
  });
  
  // Move question order mutation
  const moveQuestionMutation = useMutation({
    mutationFn: async ({ id, direction }: { id: number, direction: 'up' | 'down' }) => {
      const response = await fetch(`/api/platform-admin/quiz-questions/${id}/move`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ direction })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reorder quiz question');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/platform-admin/quiz-questions'] });
      toast({
        title: "Question reordered",
        description: "The quiz question order has been updated successfully."
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Reordering failed",
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
    }
  });
  
  // Use data from API
  const questionsData = questions || [];
  
  // Filter questions based on search and tab/category
  const filteredQuestions = questionsData.filter(question => {
    const matchesSearch = question.questionText.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeCategory === 'all') return matchesSearch;
    return matchesSearch && question.category === activeCategory;
  });
  
  // Sort questions by order
  const sortedQuestions = [...filteredQuestions].sort((a, b) => a.order - b.order);
  
  // Functions to handle dialogs
  const handleCreateQuestion = () => {
    form.reset({
      questionText: "",
      category: "",
      answerType: "multiple-choice",
      choices: ["", ""],
      order: questionsData.length + 1
    });
    setChoiceInputs(['', '']);
    setIsCreateDialogOpen(true);
  };
  
  const handleEditQuestion = (question: QuizQuestion) => {
    setSelectedQuestion(question);
    form.reset({
      questionText: question.questionText,
      category: question.category,
      answerType: question.answerType,
      choices: question.choices || ["", ""],
      order: question.order
    });
    setChoiceInputs(question.choices || ['', '']);
    setIsEditDialogOpen(true);
  };
  
  const handleDeleteQuestion = (question: QuizQuestion) => {
    setSelectedQuestion(question);
    setIsDeleteDialogOpen(true);
  };
  
  const handleMoveQuestion = (id: number, direction: 'up' | 'down') => {
    moveQuestionMutation.mutate({ id, direction });
  };
  
  const confirmDeleteQuestion = () => {
    if (selectedQuestion) {
      deleteQuestionMutation.mutate(selectedQuestion.id);
    }
  };
  
  const onCreateSubmit = (data: QuestionFormValues) => {
    // Filter out empty choices
    if (data.answerType === 'multiple-choice') {
      data.choices = choiceInputs.filter(choice => choice.trim() !== '');
      
      if (data.choices.length < 2) {
        toast({
          variant: "destructive",
          title: "Validation error",
          description: "Multiple choice questions require at least 2 options"
        });
        return;
      }
    } else {
      // For non-multiple-choice questions, set choices to undefined
      data.choices = undefined;
    }
    
    createQuestionMutation.mutate(data);
  };
  
  const onEditSubmit = (data: QuestionFormValues) => {
    if (!selectedQuestion) return;
    
    // Filter out empty choices
    if (data.answerType === 'multiple-choice') {
      data.choices = choiceInputs.filter(choice => choice.trim() !== '');
      
      if (data.choices.length < 2) {
        toast({
          variant: "destructive",
          title: "Validation error",
          description: "Multiple choice questions require at least 2 options"
        });
        return;
      }
    } else {
      // For non-multiple-choice questions, set choices to undefined
      data.choices = undefined;
    }
    
    updateQuestionMutation.mutate({ id: selectedQuestion.id, questionData: data });
  };
  
  const addChoiceInput = () => {
    setChoiceInputs([...choiceInputs, '']);
  };
  
  const removeChoiceInput = (index: number) => {
    if (choiceInputs.length <= 2) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Multiple choice questions require at least 2 options"
      });
      return;
    }
    
    const newChoices = [...choiceInputs];
    newChoices.splice(index, 1);
    setChoiceInputs(newChoices);
  };
  
  const updateChoiceInput = (index: number, value: string) => {
    const newChoices = [...choiceInputs];
    newChoices[index] = value;
    setChoiceInputs(newChoices);
  };
  
  // Helper function to get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'academic':
        return <GraduationCap className="h-4 w-4" />;
      case 'environment':
        return <School className="h-4 w-4" />;
      case 'extracurricular':
        return <Dumbbell className="h-4 w-4" />;
      case 'financial':
        return <FileQuestion className="h-4 w-4" />;
      case 'arts':
        return <PaintBucket className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };
  
  // Categories for the form
  const categories = [
    { value: "academic", label: "Academic" },
    { value: "environment", label: "Environment" },
    { value: "extracurricular", label: "Extracurricular" },
    { value: "financial", label: "Financial" },
    { value: "arts", label: "Arts and Culture" }
  ];
  
  // Answer types for the form
  const answerTypes = [
    { value: "multiple-choice", label: "Multiple Choice" },
    { value: "slider", label: "Slider" },
    { value: "text", label: "Text Input" }
  ];
  
  return (
    <>
      <Helmet>
        <title>Quiz Management | Platform Admin</title>
      </Helmet>
      <PlatformAdminLayout>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Quiz Management</h2>
              <p className="text-muted-foreground">
                Manage quiz questions for personalized school matching
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button onClick={handleCreateQuestion}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Question
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search questions..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Categories</CardTitle>
                <CardDescription>
                  Filter questions by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <button
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                      activeCategory === 'all' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                    }`}
                    onClick={() => setActiveCategory('all')}
                  >
                    <BookOpen className="h-4 w-4" />
                    All Categories
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.value}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                        activeCategory === category.value ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                      }`}
                      onClick={() => setActiveCategory(category.value)}
                    >
                      {getCategoryIcon(category.value)}
                      {category.label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle className="text-lg">Quiz Questions</CardTitle>
                <CardDescription>
                  {activeCategory === 'all' 
                    ? 'All quiz questions' 
                    : `Quiz questions in the ${activeCategory} category`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sortedQuestions.length === 0 ? (
                  <div className="text-center py-6">
                    <FileQuestion className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No questions found</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={handleCreateQuestion}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add a Question
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sortedQuestions.map((question, index) => (
                      <Card key={question.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="capitalize">
                                  {getCategoryIcon(question.category)}
                                  <span className="ml-1">{question.category}</span>
                                </Badge>
                                <Badge variant="outline">
                                  Order: {question.order}
                                </Badge>
                                <Badge variant="outline" className="capitalize">
                                  {question.answerType}
                                </Badge>
                              </div>
                              <p className="font-medium">{question.questionText}</p>
                              
                              {question.answerType === 'multiple-choice' && question.choices && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                                  {question.choices.map((choice, i) => (
                                    <div 
                                      key={i} 
                                      className="bg-muted text-muted-foreground text-sm px-3 py-2 rounded-md"
                                    >
                                      {choice}
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              {question.answerType === 'slider' && (
                                <div className="mt-4 px-2">
                                  <Slider 
                                    defaultValue={[3]} 
                                    max={5} 
                                    step={1}
                                    disabled 
                                  />
                                </div>
                              )}
                            </div>
                            
                            <div className="flex flex-col gap-1 ml-4">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleEditQuestion(question)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="text-red-500"
                                onClick={() => handleDeleteQuestion(question)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                disabled={index === 0}
                                onClick={() => handleMoveQuestion(question.id, 'up')}
                              >
                                <MoveUp className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                disabled={index === sortedQuestions.length - 1}
                                onClick={() => handleMoveQuestion(question.id, 'down')}
                              >
                                <MoveDown className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Create Question Dialog */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Create New Quiz Question</DialogTitle>
                <DialogDescription>
                  Add a new question to the personalized school matching quiz.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onCreateSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="questionText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Question Text</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter the question text..." 
                            className="min-h-20"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category.value} value={category.value}>
                                  <div className="flex items-center gap-2">
                                    {getCategoryIcon(category.value)}
                                    {category.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="answerType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Answer Type</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              // If changing to multiple-choice, ensure we have default choices
                              if (value === 'multiple-choice' && choiceInputs.length < 2) {
                                setChoiceInputs(['', '']);
                              }
                            }}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select answer type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {answerTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="order"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Display Order</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={1}
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            Position in the quiz flow
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {form.watch('answerType') === 'multiple-choice' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Answer Choices</Label>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={addChoiceInput}
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          Add Choice
                        </Button>
                      </div>
                      
                      {choiceInputs.map((choice, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            value={choice}
                            onChange={(e) => updateChoiceInput(index, e.target.value)}
                            placeholder={`Choice ${index + 1}`}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeChoiceInput(index)}
                            disabled={choiceInputs.length <= 2}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      
                      {choiceInputs.length < 2 && (
                        <p className="text-sm text-destructive">
                          Multiple choice questions require at least 2 options
                        </p>
                      )}
                    </div>
                  )}
                  
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Create Question</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          
          {/* Edit Question Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Edit Quiz Question</DialogTitle>
                <DialogDescription>
                  Update the existing quiz question.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="questionText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Question Text</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter the question text..." 
                            className="min-h-20"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category.value} value={category.value}>
                                  <div className="flex items-center gap-2">
                                    {getCategoryIcon(category.value)}
                                    {category.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="answerType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Answer Type</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              // If changing to multiple-choice, ensure we have default choices
                              if (value === 'multiple-choice' && choiceInputs.length < 2) {
                                setChoiceInputs(['', '']);
                              }
                            }}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select answer type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {answerTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="order"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Display Order</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={1}
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            Position in the quiz flow
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {form.watch('answerType') === 'multiple-choice' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Answer Choices</Label>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={addChoiceInput}
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          Add Choice
                        </Button>
                      </div>
                      
                      <ScrollArea className="h-[180px]">
                        <div className="space-y-2 pr-4">
                          {choiceInputs.map((choice, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <Input
                                value={choice}
                                onChange={(e) => updateChoiceInput(index, e.target.value)}
                                placeholder={`Choice ${index + 1}`}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeChoiceInput(index)}
                                disabled={choiceInputs.length <= 2}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      
                      {choiceInputs.length < 2 && (
                        <p className="text-sm text-destructive">
                          Multiple choice questions require at least 2 options
                        </p>
                      )}
                    </div>
                  )}
                  
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsEditDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Save Changes</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          
          {/* Delete Question Dialog */}
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete this quiz question
                  and may affect existing quiz flows.
                </AlertDialogDescription>
              </AlertDialogHeader>
              {selectedQuestion && (
                <div className="bg-muted p-3 rounded-md">
                  <p className="font-medium text-sm">{selectedQuestion.questionText}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className="capitalize">
                      {selectedQuestion.category}
                    </Badge>
                    <Badge variant="outline">
                      Order: {selectedQuestion.order}
                    </Badge>
                  </div>
                </div>
              )}
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  className="bg-destructive text-destructive-foreground"
                  onClick={confirmDeleteQuestion}
                >
                  <Ban className="mr-2 h-4 w-4" />
                  Delete Question
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </PlatformAdminLayout>
    </>
  );
};

export default QuizManagement;