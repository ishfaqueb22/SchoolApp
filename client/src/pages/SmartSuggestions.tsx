import React from 'react';
import { Bot } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import AIChat from '@/components/home/AIChat';

const SmartSuggestions = () => {
  return (
    <PageLayout>
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Smart School Suggestions</h1>
          <p className="text-muted-foreground mt-2">
            Get AI-powered school recommendations based on your preferences
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="rounded-lg overflow-hidden border shadow-sm">
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
        </div>
      </div>
    </PageLayout>
  );
};

export default SmartSuggestions;