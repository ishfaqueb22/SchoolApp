// This is a stub service replacing the OpenAI implementation
// We've removed GPT-4 as requested

export class OpenAIService {
  private isConfigured: boolean;
  
  constructor(apiKey: string) {
    this.isConfigured = false;
    console.log("OpenAI service has been disabled as requested.");
  }
  
  /**
   * Generate a school description based on provided information
   */
  async generateSchoolDescription(schoolInfo: {
    name: string;
    type: string;
    curriculumType: string;
    gradeRange: string;
    location: string;
    features?: string[];
    establishedYear?: string;
    classSize?: string;
    categories?: { name: string; description: string }[];
  }): Promise<string> {
    return "AI description generation with OpenAI GPT-4 has been disabled. Please write your own description or contact the administrator for assistance.";
  }
  
  /**
   * Analyze a school description for quality and suggestions
   */
  async analyzeSchoolDescription(description: string): Promise<{
    quality: number;
    suggestions: string[];
    keywords: string[];
  }> {
    return {
      quality: 0,
      suggestions: ["AI analysis with OpenAI GPT-4 has been disabled. Please review the description manually."],
      keywords: []
    };
  }
}

// Create and export a singleton instance with an empty API key
// We've disabled the OpenAI API key requirement as GPT-4 has been removed
console.log("OpenAI GPT-4 integration has been disabled as requested");
export const openaiService = new OpenAIService("");