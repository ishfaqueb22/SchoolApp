import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendIcon, RefreshCw, Bot } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Interface for message objects in the chat
interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

// Props interface
interface AIChatProps {
  onClose?: () => void;
}

const AIChat = ({ onClose }: AIChatProps) => {
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi there! I'm SmartMatch Assistant, powered by Gemini AI. I can help you find the perfect school for your child with real-time school data access. Ask me about schools by location, curriculum type, or specific school names - I'll provide up-to-date information from our database. What kind of educational environment are you looking for?",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Scroll to the bottom of messages when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    // Add user message to the chat
    const userMessage: Message = {
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Call the AI API
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: userMessage.content,
          context: {
            // The server will enhance this with real data from the database
            chatHistory: messages.map(msg => ({
              role: msg.role,
              content: msg.content
            })).slice(-10), // Send the last 10 messages for context
            userPreferences: {}, // This could be populated from saved user preferences if needed
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response from AI assistant");
      }

      const data = await response.json();

      // Add assistant response to chat
      const assistantMessage: Message = {
        role: "assistant",
        content: data.response,
        timestamp: data.timestamp || new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error fetching AI response:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to get response from our AI assistant. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle key press (Enter to send)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Reset the chat
  const handleReset = () => {
    setMessages([
      {
        role: "assistant",
        content: "Hi there! I'm SmartMatch Assistant, powered by Gemini AI. I can help you find the perfect school for your child with real-time school data access. Ask me about schools by location, curriculum type, or specific school names - I'll provide up-to-date information from our database. What kind of educational environment are you looking for?",
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 max-h-80">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === "user"
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {message.role === "assistant" && (
                <div className="flex items-center mb-1">
                  <Bot size={16} className="mr-1" />
                  <span className="text-xs font-semibold">SmartMatch Assistant</span>
                </div>
              )}
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <div
                className={`text-xs mt-1 ${
                  message.role === "user" ? "text-primary-100" : "text-gray-500"
                }`}
              >
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t p-3">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleReset}
            title="Reset conversation"
          >
            <RefreshCw size={18} />
          </Button>
          <Textarea
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 resize-none"
            rows={1}
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            size="icon"
          >
            <SendIcon size={18} />
          </Button>
        </div>
        <div className="mt-2 text-xs text-gray-500 text-center">
          {isLoading ? (
            <div className="flex items-center justify-center">
              <RefreshCw size={14} className="animate-spin mr-1" />
              Thinking...
            </div>
          ) : (
            "Ask about specific schools, locations, curriculum types, or educational approaches"
          )}
        </div>
      </div>
    </div>
  );
};

export default AIChat;