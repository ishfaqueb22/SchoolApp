import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "./db";
import { schools } from "@shared/schema";
import { eq, like, and, or, desc, sql } from "drizzle-orm";

// Define a simple cache to avoid duplicate requests
const responseCache = new Map<string, string>();
// Cache timeout in milliseconds (5 minutes)
const CACHE_TIMEOUT = 5 * 60 * 1000;

export class AIService {
  private genAI!: GoogleGenerativeAI; // Use definite assignment assertion
  private apiKey: string;
  private isConfigured: boolean;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.isConfigured = apiKey ? true : false;
    
    if (this.isConfigured) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }
  
  /**
   * Get a response from Gemini model with enhanced database access
   */
  async getResponse(prompt: string, contextData?: any): Promise<string> {
    try {
      // Check if API key is available
      if (!this.isConfigured) {
        return "I'm not fully configured yet. Please contact the site administrator to set up the AI assistant.";
      }
      
      // Process the prompt to detect specific school-related queries
      const schoolQueryInfo = await this.detectSchoolQuery(prompt);
      
      // If school-related query detected, get real-time data from database
      if (schoolQueryInfo.isSchoolQuery) {
        console.log("School-related query detected:", schoolQueryInfo);
        
        // Get specific school data if requested
        const enhancedContextData = { ...contextData };
        
        // Look for schools based on extracted criteria from the query
        if (schoolQueryInfo.criteria.length > 0) {
          const specificSchools = await this.getSchoolsByCriteria(schoolQueryInfo.criteria);
          if (specificSchools.length > 0) {
            console.log(`Found ${specificSchools.length} matching schools for criteria:`, schoolQueryInfo.criteria);
            enhancedContextData.specificSchoolMatches = specificSchools;
          }
        }
        
        // Get specific school by name if mentioned
        if (schoolQueryInfo.schoolName) {
          const schoolByName = await this.getSchoolByName(schoolQueryInfo.schoolName);
          if (schoolByName) {
            console.log(`Found specific school by name: ${schoolQueryInfo.schoolName}`);
            enhancedContextData.requestedSchool = schoolByName;
          }
        }
        
        // If location data is included, get schools in that location
        if (schoolQueryInfo.location) {
          const schoolsByLocation = await this.getSchoolsByLocation(schoolQueryInfo.location);
          if (schoolsByLocation.length > 0) {
            console.log(`Found ${schoolsByLocation.length} schools in location: ${schoolQueryInfo.location}`);
            enhancedContextData.schoolsInLocation = schoolsByLocation;
          }
        }
        
        // If curriculum is mentioned, get schools with that curriculum
        if (schoolQueryInfo.curriculum) {
          const schoolsByCurriculum = await this.getSchoolsByCurriculum(schoolQueryInfo.curriculum);
          if (schoolsByCurriculum.length > 0) {
            console.log(`Found ${schoolsByCurriculum.length} schools with curriculum: ${schoolQueryInfo.curriculum}`);
            enhancedContextData.schoolsWithCurriculum = schoolsByCurriculum;
          }
        }
        
        // Use the enhanced context data for the prompt
        contextData = enhancedContextData;
      }
      
      // Cache management with timestamp
      const now = Date.now();
      const cacheKey = JSON.stringify({ prompt, contextData });
      
      if (responseCache.has(cacheKey)) {
        const cachedData = responseCache.get(cacheKey);
        if (cachedData) {
          const [timestamp, response] = cachedData.split('|||||');
          
          // Check if cache is still valid
          if (now - parseInt(timestamp) < CACHE_TIMEOUT) {
            console.log("Using cached response for prompt");
            return response;
          }
          
          // Cache expired, remove it
          responseCache.delete(cacheKey);
        }
      }
      
      // Prepare the prompt with context data if available
      let fullPrompt = prompt;
      if (contextData) {
        fullPrompt = this.buildPromptWithContext(prompt, contextData);
      }
      
      try {
        // Use a helper to run the model
        const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
        
        // Generate content
        const result = await model.generateContent(fullPrompt);
        const response = result.response.text();
        
        // Cache the response with timestamp
        responseCache.set(cacheKey, `${now}|||||${response}`);
        
        return response;
      } catch (apiError) {
        console.error("Error calling Gemini API:", apiError);
        
        // Provide a more helpful fallback response with real-time contextual information
        let fallbackResponse = "I'm sorry, I'm having trouble processing your request right now. ";
        
        if (contextData && contextData.specificSchoolMatches) {
          const schoolNames = contextData.specificSchoolMatches.map((s: any) => s.name).slice(0, 3);
          fallbackResponse += `Based on your query, these schools might be relevant: ${schoolNames.join(', ')}. `;
        } else if (contextData && contextData.schoolTypes) {
          fallbackResponse += `You can explore schools of these types: ${contextData.schoolTypes.join(', ')}. `;
        }
        
        if (contextData && contextData.curriculums) {
          fallbackResponse += `We have information about these curricula: ${contextData.curriculums.join(', ')}. `;
        }
        
        fallbackResponse += "Please try the SmartMatch quiz instead or contact support for assistance.";
        return fallbackResponse;
      }
    } catch (error) {
      console.error("Error in AI service:", error);
      return "I'm sorry, I'm having trouble processing your request right now. Please try again later.";
    }
  }
  
  /**
   * Detect if a prompt is asking about schools and extract criteria
   */
  private async detectSchoolQuery(prompt: string): Promise<{
    isSchoolQuery: boolean;
    criteria: string[];
    schoolName?: string;
    location?: string;
    curriculum?: string;
  }> {
    const lowercasePrompt = prompt.toLowerCase();
    
    // Check for school-related keywords
    const schoolKeywords = ['school', 'education', 'academy', 'institute', 'college', 'curriculum', 'campus'];
    const isSchoolQuery = schoolKeywords.some(keyword => lowercasePrompt.includes(keyword));
    
    if (!isSchoolQuery) {
      return { isSchoolQuery: false, criteria: [] };
    }
    
    // Extract criteria from the prompt
    const criteria: string[] = [];
    
    // Check for specific location
    const locationMatch = lowercasePrompt.match(/in\s+([a-z\s]+?)(?:\s+with|\s+that|\s+which|\s+offering|\?|$)/i);
    const location = locationMatch ? locationMatch[1].trim() : undefined;
    if (location) {
      criteria.push(`location:${location}`);
    }
    
    // Check for curriculum types
    const curriculumKeywords = [
      'international baccalaureate', 'ib', 'montessori', 'waldorf', 'stem', 
      'traditional', 'progressive', 'american', 'british', 'cambridge'
    ];
    
    let curriculumType: string | undefined;
    for (const curriculum of curriculumKeywords) {
      if (lowercasePrompt.includes(curriculum)) {
        curriculumType = curriculum;
        criteria.push(`curriculum:${curriculum}`);
        break;
      }
    }
    
    // Check for specific school name
    // Look for proper nouns that might be school names
    const possibleSchoolNames = lowercasePrompt.match(/(?:about|information on|tell me about)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:school|academy|institute|college)/i);
    const schoolName = possibleSchoolNames ? possibleSchoolNames[1].trim() : undefined;
    
    return {
      isSchoolQuery,
      criteria,
      schoolName,
      location,
      curriculum: curriculumType
    };
  }
  
  /**
   * Analyze quiz results and provide personalized recommendations
   */
  async analyzeQuizResults(quizData: {
    preferences: {
      schoolType: string[];
      curriculum: string[];
      location: string[];
      features: string[];
      extracurricular: string[];
      budget: string;
    };
    matchedSchools: {
      id: number;
      name: string;
      type: string;
      location: string;
      curriculumType: string;
      matchScore: number;
      matchFactors: string[];
      features?: string[];
      gradeRange?: string;
      hasFinancialAid?: boolean;
      classSize?: string;
      rating?: number;
    }[];
    userId?: number | null;
  }): Promise<{
    insights: string;
    recommendations: {
      title: string;
      description: string;
    }[];
    nextSteps: string[];
    personalizedAdvice: string;
  }> {
    console.log("====== AI ANALYSIS PROCESS STARTED ======");
    console.log("Preferences:", JSON.stringify(quizData.preferences));
    console.log("Number of matched schools:", quizData.matchedSchools.length);
    console.log("User ID:", quizData.userId || "Anonymous (using session tracking)");
    
    try {
      if (!this.isConfigured) {
        return {
          insights: "AI analysis is not available at this time.",
          recommendations: [],
          nextSteps: ["Contact our support team for personalized assistance"],
          personalizedAdvice: "Please contact our educational advisors for personalized guidance."
        };
      }

      // Create a detailed prompt for the AI
      const prompt = this.buildQuizAnalysisPrompt(quizData);
      
      try {
        // Use Gemini to analyze the results
        const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
        
        // Request structured format
        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1024,
          },
        });
        
        const response = result.response.text();
        
        // Parse the response - the model should return JSON but might not
        try {
          // Try to parse as JSON, but first check if it's wrapped in markdown code block ```json ... ```
          let textToParse = response;
          
          // Check if response is wrapped in a markdown JSON code block
          if (response.includes('```json')) {
            console.log("Detected markdown JSON code block, extracting JSON content");
            const jsonMatch = response.match(/```json\s*([^`]*)\s*```/);
            if (jsonMatch && jsonMatch[1]) {
              textToParse = jsonMatch[1].trim();
              console.log("Extracted JSON from markdown:", textToParse.substring(0, 100) + "...");
            }
          }
          
          const parsed = JSON.parse(textToParse);
          return {
            insights: parsed.insights || "Analysis completed successfully.",
            recommendations: parsed.recommendations || [],
            nextSteps: parsed.nextSteps || [],
            personalizedAdvice: parsed.personalizedAdvice || ""
          };
        } catch (parseError) {
          // If not valid JSON, extract insights manually with a basic fallback
          console.error("Error parsing AI response:", parseError);
          
          // Extract sections by headers if possible
          const insights = this.extractSection(response, "Insights:", "Recommendations:") || 
                          "Based on your preferences, we've analyzed suitable educational options.";
          
          const recommendationsText = this.extractSection(response, "Recommendations:", "Next Steps:") || "";
          const recommendations = recommendationsText.split('\n')
            .filter(line => line.trim().length > 0)
            .map(line => {
              return {
                title: line.split(':')[0] || "Recommendation",
                description: line.split(':').slice(1).join(':').trim() || line.trim()
              };
            });
          
          const nextStepsText = this.extractSection(response, "Next Steps:", "Personalized Advice:") || "";
          const nextSteps = nextStepsText.split('\n')
            .filter(line => line.trim().length > 0 && line.includes('-'))
            .map(line => line.replace(/^-\s*/, '').trim());
          
          const personalizedAdvice = this.extractSection(response, "Personalized Advice:", null) || 
                                    "We recommend exploring the matched schools and contacting them directly for more information.";
          
          return {
            insights,
            recommendations: recommendations.length ? recommendations : [{ 
              title: "Explore Matched Schools", 
              description: "Visit the school profiles to learn more about their programs and offerings." 
            }],
            nextSteps: nextSteps.length ? nextSteps : ["Schedule visits to your top matched schools"],
            personalizedAdvice
          };
        }
      } catch (apiError) {
        console.error("Error calling Gemini API for quiz analysis:", apiError);
        return {
          insights: "We've matched schools based on your preferences, but couldn't generate a detailed analysis at this time.",
          recommendations: [
            { 
              title: "Explore Your Top Matches", 
              description: "The schools we've recommended align with your educational priorities." 
            }
          ],
          nextSteps: [
            "Review the detailed profiles of your matched schools",
            "Contact schools directly for more information",
            "Schedule visits to see the campuses in person"
          ],
          personalizedAdvice: "Focus on schools that match your most important criteria, such as location, curriculum type, and special programs."
        };
      }
    } catch (error) {
      console.error("Error in AI quiz analysis service:", error);
      return {
        insights: "School matching completed successfully.",
        recommendations: [],
        nextSteps: [],
        personalizedAdvice: ""
      };
    }
  }
  
  /**
   * Extract a section from AI text response
   */
  private extractSection(text: string, startMarker: string, endMarker: string | null): string {
    const startIndex = text.indexOf(startMarker);
    if (startIndex === -1) return "";
    
    const actualStartIndex = startIndex + startMarker.length;
    
    if (endMarker === null) {
      return text.substring(actualStartIndex).trim();
    }
    
    const endIndex = text.indexOf(endMarker, actualStartIndex);
    if (endIndex === -1) {
      return text.substring(actualStartIndex).trim();
    }
    
    return text.substring(actualStartIndex, endIndex).trim();
  }
  
  /**
   * Build a specialized prompt for quiz analysis
   */
  private buildQuizAnalysisPrompt(quizData: any): string {
    const { preferences, matchedSchools } = quizData;
    
    // Extract the preferences in a readable format
    const schoolTypes = preferences.schoolType.length > 0 
      ? preferences.schoolType.join(', ') 
      : "Any school type";
    
    const curriculums = preferences.curriculum.length > 0 
      ? preferences.curriculum.join(', ') 
      : "Any curriculum";
    
    const locations = preferences.location.length > 0 
      ? preferences.location.join(', ') 
      : "Any location";
    
    const features = preferences.features.length > 0 
      ? preferences.features.join(', ') 
      : "No specific features";
    
    const extracurriculars = preferences.extracurricular.length > 0 
      ? preferences.extracurricular.join(', ') 
      : "No specific extracurricular preferences";
    
    const budget = preferences.budget || "No budget specified";
    
    // Create matched schools information
    const schoolsInfo = matchedSchools.map((school: any, index: number) => {
      return `
School ${index + 1}: ${school.name}
- Type: ${school.type || "Not specified"}
- Curriculum: ${school.curriculumType || "Not specified"}
- Location: ${school.location || "Not specified"}
- Match Score: ${(school.matchScore * 10).toFixed(0)}%
- Match Factors: ${school.matchFactors.join(', ')}
- Features: ${school.features?.join(', ') || "Not specified"}
- Financial Aid: ${school.hasFinancialAid ? "Available" : "Not specified"}
${school.rating ? `- Rating: ${school.rating}/5` : ""}
`;
    }).join('\n');
    
    // Build the full prompt
    return `You are a sophisticated educational advisor for SmartSchool Finder. Analyze the following quiz results and provide personalized insights and recommendations.

User Preferences:
- School Types: ${schoolTypes}
- Curriculum Types: ${curriculums}
- Locations: ${locations}
- Desired Features: ${features}
- Extracurricular Activities: ${extracurriculars}
- Budget: ${budget}

Matched Schools:
${schoolsInfo}

Based on this information, provide a comprehensive analysis in JSON format with the following structure:
{
  "insights": "A paragraph summarizing key insights about the user's preferences and how they align with the matched schools",
  "recommendations": [
    {
      "title": "A short recommendation title",
      "description": "A concise, specific recommendation based on the preferences and matches"
    },
    // 2-3 more recommendations
  ],
  "nextSteps": [
    "Concrete action item for the user to take",
    "Another practical next step",
    // 2-3 actionable next steps
  ],
  "personalizedAdvice": "Personalized advice paragraph specifically tailored to this user's educational priorities"
}

Make your analysis specific to the actual preferences and matched schools. Focus on being practical, actionable, and educational. Highlight any important factors the user should consider when making their decision.`;
  }
  
  /**
   * Build a prompt with context data for more targeted responses
   */
  /**
   * Get schools by specified criteria extracted from user query
   */
  private async getSchoolsByCriteria(criteria: string[]): Promise<any[]> {
    try {
      // For each criteria, build a query condition
      const whereConditions = [];
      
      for (const criterion of criteria) {
        const [key, value] = criterion.split(':');
        
        if (key === 'location') {
          whereConditions.push(sql`LOWER(${schools.location}) LIKE ${`%${value.toLowerCase()}%`}`);
        } else if (key === 'curriculum') {
          whereConditions.push(sql`LOWER(${schools.curriculumType}) LIKE ${`%${value.toLowerCase()}%`}`);
        }
      }
      
      // If we have whereConditions, execute the query
      if (whereConditions.length > 0) {
        // Combine all conditions with OR
        const combinedCondition = or(...whereConditions);
        
        // Execute query
        const results = await db
          .select()
          .from(schools)
          .where(combinedCondition)
          .limit(10);
          
        return results;
      }
      
      return [];
    } catch (error) {
      console.error("Error getting schools by criteria:", error);
      return [];
    }
  }
  
  /**
   * Get a school by name (fuzzy match)
   */
  private async getSchoolByName(name: string): Promise<any> {
    try {
      // Try to find a school by name using fuzzy matching
      const results = await db
        .select()
        .from(schools)
        .where(sql`LOWER(${schools.name}) LIKE ${`%${name.toLowerCase()}%`}`)
        .limit(1);
        
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error("Error getting school by name:", error);
      return null;
    }
  }
  
  /**
   * Get schools by location (fuzzy match)
   */
  private async getSchoolsByLocation(location: string): Promise<any[]> {
    try {
      // Find schools in the specified location
      const results = await db
        .select()
        .from(schools)
        .where(sql`LOWER(${schools.location}) LIKE ${`%${location.toLowerCase()}%`}`)
        .limit(5);
        
      return results;
    } catch (error) {
      console.error("Error getting schools by location:", error);
      return [];
    }
  }
  
  /**
   * Get schools by curriculum type (fuzzy match)
   */
  private async getSchoolsByCurriculum(curriculum: string): Promise<any[]> {
    try {
      // Find schools with the specified curriculum
      const results = await db
        .select()
        .from(schools)
        .where(sql`LOWER(${schools.curriculumType}) LIKE ${`%${curriculum.toLowerCase()}%`}`)
        .limit(5);
        
      return results;
    } catch (error) {
      console.error("Error getting schools by curriculum:", error);
      return [];
    }
  }
  
  /**
   * Build a prompt with enhanced context data for more targeted responses
   */
  private buildPromptWithContext(prompt: string, contextData: any): string {
    let fullPrompt = `You are an educational advisor for SmartSchool Finder, a platform that helps parents find the best schools for their children. 
    
Context information:
`;
    
    // Add specific school data if available
    if (contextData.requestedSchool) {
      const school = contextData.requestedSchool;
      
      fullPrompt += `
You have specific information about the requested school:
School Name: ${school.name}
Location: ${school.location || 'Not specified'}
Type: ${school.type || 'Not specified'}
Curriculum: ${school.curriculumType || 'Not specified'}
Rating: ${school.rating || 'Not rated'}/5
${school.description ? `Description: ${school.description}` : ''}
${school.features ? `Features: ${school.features.join(', ')}` : ''}
${school.hasFinancialAid ? 'Financial Aid: Available' : ''}
${school.established_year ? `Established: ${school.established_year}` : ''}
${school.tuition_range ? `Tuition Range: ${school.tuition_range}` : ''}
${school.class_size ? `Class Size: ${school.class_size}` : ''}
${school.grade_range ? `Grade Range: ${school.grade_range}` : ''}

This is real-time information about the school from our database.
`;
    }
    
    // Add matched schools by criteria if available
    if (contextData.specificSchoolMatches && contextData.specificSchoolMatches.length > 0) {
      fullPrompt += `\nSchools matching the criteria in the query:\n`;
      
      contextData.specificSchoolMatches.slice(0, 3).forEach((school: any, index: number) => {
        fullPrompt += `
School ${index + 1}: ${school.name}
- Location: ${school.location || 'Not specified'}
- Type: ${school.type || 'Not specified'}
- Curriculum: ${school.curriculumType || 'Not specified'}
- Rating: ${school.rating || 'Not rated'}/5
${school.features ? `- Features: ${school.features.join(', ')}` : ''}
${school.hasFinancialAid ? '- Financial Aid: Available' : ''}
`;
      });
      
      if (contextData.specificSchoolMatches.length > 3) {
        fullPrompt += `\n(${contextData.specificSchoolMatches.length - 3} more schools match these criteria)\n`;
      }
    }
    
    // Add location-specific schools if available
    if (contextData.schoolsInLocation && contextData.schoolsInLocation.length > 0) {
      const location = contextData.schoolsInLocation[0].location;
      fullPrompt += `\nSchools available in ${location}:\n`;
      
      contextData.schoolsInLocation.slice(0, 3).forEach((school: any, index: number) => {
        fullPrompt += `- ${school.name} (${school.type || 'General'}, Rating: ${school.rating || 'Not rated'}/5)\n`;
      });
      
      if (contextData.schoolsInLocation.length > 3) {
        fullPrompt += `(${contextData.schoolsInLocation.length - 3} more schools in this location)\n`;
      }
    }
    
    // Add curriculum-specific schools if available
    if (contextData.schoolsWithCurriculum && contextData.schoolsWithCurriculum.length > 0) {
      const curriculum = contextData.schoolsWithCurriculum[0].curriculumType;
      fullPrompt += `\nSchools offering ${curriculum} curriculum:\n`;
      
      contextData.schoolsWithCurriculum.slice(0, 3).forEach((school: any, index: number) => {
        fullPrompt += `- ${school.name} (${school.location || 'Location not specified'}, Rating: ${school.rating || 'Not rated'}/5)\n`;
      });
      
      if (contextData.schoolsWithCurriculum.length > 3) {
        fullPrompt += `(${contextData.schoolsWithCurriculum.length - 3} more schools with this curriculum)\n`;
      }
    }
    
    // Add general context data
    if (contextData.schoolTypes) {
      fullPrompt += `\nAvailable school types: ${contextData.schoolTypes.join(', ')}. `;
    }
    
    if (contextData.locations) {
      fullPrompt += `\nAvailable locations: ${contextData.locations.join(', ')}. `;
    }
    
    if (contextData.curriculums) {
      fullPrompt += `\nAvailable curriculums: ${contextData.curriculums.join(', ')}. `;
    }
    
    fullPrompt += `\n\nUser query: ${prompt}
    
Please provide helpful advice about educational options based on the user's query and the real-time school data provided. Focus on being supportive and guiding them toward making informed decisions about schools. 

If they ask about specific schools, provide detailed information from our database. If they ask about schools in a specific location or with certain curriculum, highlight the real schools we have that match those criteria. Be very specific with your recommendations based on the actual school data provided.`;
    
    return fullPrompt;
  }
}

// Create and export a singleton instance with the API key
const API_KEY = process.env.GEMINI_API_KEY || "AIzaSyB6MfcrHaPJFNYfcPflwenv-WUj-WdQBJc";
if (!API_KEY) {
  console.error("GEMINI_API_KEY environment variable is not set");
}
export const aiService = new AIService(API_KEY); 