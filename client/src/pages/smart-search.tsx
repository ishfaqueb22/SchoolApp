import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageLayout from '@/components/layout/PageLayout';
import { Bot, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AIChat from '@/components/home/AIChat';

const SmartSearch: React.FC = () => {
  const [mainTab, setMainTab] = useState('search');

  return (
    <PageLayout>
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Smart School Search</h1>
          <p className="text-muted-foreground mt-2">
            Find the perfect school with our AI-powered search technology
          </p>
        </div>
        
        <Tabs value={mainTab} onValueChange={setMainTab} className="w-full max-w-6xl mx-auto">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search">Smart Search</TabsTrigger>
            <TabsTrigger value="suggestions">Smart Suggestions</TabsTrigger>
          </TabsList>
          
          {/* Smart Search Tab */}
          <TabsContent value="search">
            <div className="rounded-lg overflow-hidden border shadow-sm mt-6">
              <div className="p-4 bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <Bot className="h-5 w-5 text-primary" />
                  <h3 className="font-medium">Smart School AI Assistant</h3>
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded-full">Gemini AI</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Chat with our AI assistant to get personalized school recommendations and answers to your education-related questions.
                </p>
              </div>
              <div className="h-[500px]">
                <AIChat />
              </div>
            </div>
          </TabsContent>
          
          {/* Smart Suggestions Tab */}
          <TabsContent value="suggestions">
            <div className="w-full max-w-4xl mx-auto mt-6">
              <div className="bg-primary-50 rounded-xl p-8 text-center">
                <h3 className="text-2xl font-semibold mb-3">SmartMatch Quiz</h3>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                  Our comprehensive quiz will help you find the perfect school based on your unique preferences and requirements. 
                  Answer a few questions and get personalized school recommendations.
                </p>
                <Button 
                  className="px-8"
                  size="lg"
                  onClick={() => window.location.href = '/quiz'}
                >
                  <ArrowRight className="mr-2 h-5 w-5" />
                  Start SmartMatch Quiz
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default SmartSearch;