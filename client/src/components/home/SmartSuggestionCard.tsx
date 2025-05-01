import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import AIChat from "./AIChat";
import { Bot, Zap } from "lucide-react";

const SmartSuggestionCard = () => {
  const [chatStarted, setChatStarted] = useState(false);
  
  const startChat = () => {
    setChatStarted(true);
  };

  return (
    <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-xl overflow-hidden shadow-lg">
      <div className="px-8 py-12 md:px-12 text-center md:text-left">
        <h2 className="text-3xl font-bold text-white mb-4">
          AI-Powered School Suggestions
        </h2>
        <div className="md:flex md:items-start md:gap-10">
          <div className="w-full md:w-1/2">
            <p className="text-primary-100 mb-6">
              Our AI-powered matching system helps you find schools perfectly aligned with your 
              child's unique learning style, interests, and your family preferences.
            </p>
            <div className="mb-8">
              <Link href="/smart-suggestions">
                <Button
                  variant="secondary" 
                  size="lg"
                  className="bg-white hover:bg-gray-50 text-primary-700 shadow-lg"
                >
                  <Zap className="h-5 w-5 mr-2" />
                  Try Smart Suggestions
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="w-full md:w-1/2 mt-8 md:mt-0">
            <div className="bg-white rounded-lg p-5 shadow-lg border border-white/20">
              {!chatStarted ? (
                <>
                  <div className="flex items-center mb-4">
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <Bot className="h-6 w-6 text-primary-700" />
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">SmartMatch Assistant</div>
                      <div className="text-xs text-gray-500">Powered by Gemini AI</div>
                    </div>
                  </div>
                  <div className="bg-gray-100 rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-700">
                      Hello! I can help find the perfect school for your child based on their 
                      interests, learning style, and your preferences. Would you like to start?
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 bg-primary-100 hover:bg-primary-200 text-primary-800 border-0"
                      onClick={startChat}
                    >
                      Yes, let's get started
                    </Button>
                    <Link href="/smart-suggestions" className="flex-1">
                      <Button
                        variant="outline"
                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 border-0"
                      >
                        Try full AI assistant
                      </Button>
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                        <Bot className="h-5 w-5 text-primary-700" />
                      </div>
                      <div className="ml-2">
                        <div className="text-sm font-medium text-gray-900">SmartMatch Assistant</div>
                        <div className="text-xs text-gray-500">Powered by Gemini AI</div>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setChatStarted(false)}
                      className="text-xs"
                    >
                      Restart
                    </Button>
                  </div>
                  <AIChat />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartSuggestionCard;