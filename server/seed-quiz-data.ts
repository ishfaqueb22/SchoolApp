import { IStorage } from './storage';

export async function seedQuizData(storage: IStorage) {
  console.log("Starting quiz data seeding...");
  
  // Check if quiz questions already exist
  const existingQuestions = await storage.getQuizQuestions();
  if (existingQuestions.length > 0) {
    console.log(`Database already has ${existingQuestions.length} quiz questions. Skipping quiz question seeding.`);
    return;
  }
  
  // Sample quiz questions
  const quizQuestions = [
    {
      questionText: "What type of school are you looking for?",
      choices: ["International", "Montessori", "STEM-focused", "Arts-focused", "Traditional"],
      category: "school_type",
      order: 1,
      answerType: "multiple",
    },
    {
      questionText: "Which curriculum are you interested in?",
      choices: ["Cambridge", "International Baccalaureate (IB)", "Pakistani National Curriculum", "American Curriculum", "British Curriculum"],
      category: "curriculum",
      order: 2,
      answerType: "multiple",
    },
    {
      questionText: "What location type do you prefer?",
      choices: ["Urban area", "Suburban area", "Rural area", "Near public transportation", "Close to residential areas"],
      category: "location",
      order: 3,
      answerType: "multiple",
    },
    {
      questionText: "What special facilities are important to you?",
      choices: ["Advanced technology labs", "Sports facilities", "Arts studios", "Science labs", "Library and resource center", "Special needs support"],
      category: "features",
      order: 4,
      answerType: "multiple",
    },
    {
      questionText: "What extracurricular activities are you looking for?",
      choices: ["Sports programs", "Arts and music", "Debate and public speaking", "Community service", "STEM clubs", "Language clubs"],
      category: "extracurricular",
      order: 5,
      answerType: "multiple",
    },
    {
      questionText: "What is your budget range for school fees?",
      choices: ["Economy (under 10,000 PKR/month)", "Standard (10,000-25,000 PKR/month)", "Premium (25,000-50,000 PKR/month)", "Elite (50,000+ PKR/month)", "Need financial aid options"],
      category: "budget",
      order: 6,
      answerType: "single",
    },
  ];
  
  // Add quiz questions to the storage
  for (const question of quizQuestions) {
    await storage.createQuizQuestion(question);
  }
  
  console.log(`Added ${quizQuestions.length} quiz questions successfully.`);
}