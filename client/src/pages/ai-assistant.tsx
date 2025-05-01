import { useState } from "react";
import { Helmet } from "react-helmet";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AIChat from "@/components/home/AIChat";
import { Bot, School, Lightbulb, Users, Building, MessageSquare } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const AIAssistantPage = () => {
  const [isChatMaximized, setIsChatMaximized] = useState(false);

  return (
    <>
      <Helmet>
        <title>SmartMatch AI Assistant | SmartSchool Finder</title>
        <meta
          name="description"
          content="Get personalized school recommendations with SmartMatch AI Assistant. Ask questions and get guidance on finding the perfect school for your child."
        />
      </Helmet>

      <div className="flex flex-col min-h-screen">
        <Navbar />

        <main className="flex-grow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8 text-center">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                SmartMatch AI Assistant
              </h1>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Chat with our AI-powered assistant to get personalized school recommendations
                and answers to all your educational questions.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
              <div className={`lg:col-span-${isChatMaximized ? "3" : "2"} bg-white rounded-xl shadow-lg`}>
                <div className="flex items-center justify-between border-b p-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <Bot className="h-6 w-6 text-primary-700" />
                    </div>
                    <div className="ml-3">
                      <div className="font-medium">SmartMatch Assistant</div>
                      <div className="text-xs text-gray-500">Powered by Gemini AI</div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsChatMaximized(!isChatMaximized)}
                  >
                    {isChatMaximized ? "Minimize" : "Maximize"}
                  </Button>
                </div>
                <div className="h-[500px]">
                  <AIChat />
                </div>
              </div>

              {!isChatMaximized && (
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">Ask About</h2>
                    <ul className="space-y-3">
                      <li className="flex items-start">
                        <School className="h-5 w-5 text-primary-600 mr-2 mt-0.5" />
                        <span>School types and curriculums</span>
                      </li>
                      <li className="flex items-start">
                        <Lightbulb className="h-5 w-5 text-primary-600 mr-2 mt-0.5" />
                        <span>Learning approaches and philosophies</span>
                      </li>
                      <li className="flex items-start">
                        <Users className="h-5 w-5 text-primary-600 mr-2 mt-0.5" />
                        <span>Class sizes and teaching methods</span>
                      </li>
                      <li className="flex items-start">
                        <Building className="h-5 w-5 text-primary-600 mr-2 mt-0.5" />
                        <span>Facilities and extracurricular activities</span>
                      </li>
                      <li className="flex items-start">
                        <MessageSquare className="h-5 w-5 text-primary-600 mr-2 mt-0.5" />
                        <span>Admission processes and requirements</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-primary-50 rounded-xl shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">Try Our School Quiz</h2>
                    <p className="text-gray-600 mb-4">
                      Want a more structured approach? Take our SmartMatch Quiz to get
                      personalized school recommendations.
                    </p>
                    <Link href="/quiz">
                      <Button className="w-full">Start Quiz</Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default AIAssistantPage;