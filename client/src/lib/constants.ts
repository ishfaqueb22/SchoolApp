import { CategoryType, FAQ, Testimonial } from "./types";

export const SCHOOL_TYPES = [
  { value: "cambridge", label: "Cambridge" },
  { value: "stem", label: "STEM" },
  { value: "arts", label: "Arts Focus" },
  { value: "international", label: "International" },
  { value: "matric", label: "Matric/Federal" },
  { value: "ib", label: "IB" },
  { value: "islamiat", label: "Islamic Education" },
  { value: "montessori", label: "Montessori" }
];

export const GRADE_LEVELS = [
  { value: "preschool", label: "Playgroup/Montessori" },
  { value: "elementary", label: "Primary (KG-5)" },
  { value: "middle", label: "Middle (6-8)" },
  { value: "high", label: "High (9-10)" },
  { value: "college", label: "College (11-12)" }
];

export const LOCATIONS = [
  { value: "karachi", label: "Karachi" },
  { value: "lahore", label: "Lahore" },
  { value: "islamabad", label: "Islamabad" },
  { value: "rawalpindi", label: "Rawalpindi" },
  { value: "faisalabad", label: "Faisalabad" },
  { value: "peshawar", label: "Peshawar" },
  { value: "multan", label: "Multan" },
  { value: "quetta", label: "Quetta" }
];

export const FEATURES = [
  { value: "language", label: "Languages", description: "Schools offering multiple language courses beyond English and Urdu" },
  { value: "science_lab", label: "Science Lab", description: "Fully equipped science laboratories for practical experiments" },
  { value: "computer_lab", label: "Computer Lab", description: "Modern computer facilities for technology education" },
  { value: "library", label: "Library", description: "Well-stocked library with extensive reading materials" },
  { value: "robotics", label: "Robotics", description: "Specialized robotics and engineering programs" },
  { value: "coding", label: "Coding", description: "Computer programming and coding curriculum" },
  { value: "music", label: "Music", description: "Music education and performance opportunities" },
  { value: "sports", label: "Sports Facilities", description: "Comprehensive sports grounds and equipment" },
  { value: "swimming", label: "Swimming Pool", description: "Swimming instruction and facilities" },
  { value: "cafeteria", label: "Cafeteria", description: "On-campus food service and dining areas" },
  { value: "transport", label: "Transportation", description: "School bus service for student commuting" },
  { value: "ac", label: "Air Conditioning", description: "Climate-controlled classrooms and facilities" },
  { value: "special_needs", label: "Special Needs Support", description: "Resources for students with special educational needs" },
  { value: "mosque", label: "Prayer Area/Mosque", description: "Dedicated space for religious observance" }
];

export const CATEGORIES: CategoryType[] = [
  {
    id: 1,
    name: "Cambridge",
    description: "Schools offering the Cambridge Assessment International Education curriculum with O/A Level qualifications.",
    image: "https://images.unsplash.com/photo-1509062522246-3755977927d7",
    count: 38,
    color: "primary"
  },
  {
    id: 2,
    name: "STEM",
    description: "Schools with curriculum emphasis on Science, Technology, Engineering and Mathematics.",
    image: "https://images.unsplash.com/photo-1581078426770-6d336e5de7bf",
    count: 42,
    color: "blue"
  },
  {
    id: 3,
    name: "Matric/Federal",
    description: "Schools following Pakistan's national Matriculation or Federal Board curriculum.",
    image: "https://images.unsplash.com/photo-1598386651573-9232cc0c2d6c",
    count: 53,
    color: "purple"
  },
  {
    id: 4,
    name: "International",
    description: "Schools offering international curricula including IB, American, and British systems.",
    image: "https://images.unsplash.com/photo-1571260899304-425eee4c7efd",
    count: 25,
    color: "green"
  }
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    name: "Ahmed K.",
    role: "Father of two primary students",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e",
    rating: 5,
    comment: "\"SmartSchool Finder helped us discover a perfect Cambridge school in DHA Karachi that we didn't even know existed. The comparison tool made our decision so much easier!\""
  },
  {
    id: 2,
    name: "Sana M.",
    role: "Mother of a middle school student",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
    rating: 5,
    comment: "\"The AI matching quiz recommended a STEM-focused school in Lahore that was perfect for my daughter who loves science. The detailed profiles and campus photos saved us so much time!\""
  },
  {
    id: 3,
    name: "Faisal A.",
    role: "Father of a high school student",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
    rating: 4.5,
    comment: "\"We were relocating from Karachi to Islamabad and needed to find a school quickly. SmartSchool Finder made the process so much less stressful. We found a great arts program for our creative son!\""
  }
];

export const FAQS: FAQ[] = [
  {
    id: 1,
    question: "How does SmartSchool Finder work?",
    answer: "SmartSchool Finder uses your preferences, location data, and our comprehensive database of schools across Pakistan to match you with schools that best fit your needs. You can browse schools, compare them side by side, and connect directly with admissions offices."
  },
  {
    id: 2,
    question: "Are all major cities in Pakistan covered?",
    answer: "Yes, we cover all major cities including Karachi, Lahore, Islamabad, Rawalpindi, Peshawar, Quetta, Faisalabad, Multan and many other areas. We are continuously expanding our database to include more schools from smaller cities and towns."
  },
  {
    id: 3,
    question: "Does SmartSchool Finder include information about fee structures?",
    answer: "Yes, we provide fee ranges for most schools to give you an idea of the investment required. However, we always recommend confirming the exact fee structure directly with schools as they may vary based on grade level, additional facilities, and can change annually."
  },
  {
    id: 4,
    question: "Is SmartSchool Finder free to use?",
    answer: "Basic features like school search, profiles, and comparisons are completely free. We offer premium features for families who need additional assistance, such as personalized consultation, priority application support, and enhanced comparison tools starting at PKR 5,000."
  },
  {
    id: 5,
    question: "Can I schedule school tours through SmartSchool Finder?",
    answer: "Yes, for many partner schools in major cities, you can schedule tours directly through our platform. For other schools, we provide contact information and guidance on setting up visits. We also offer virtual tours for some schools so you can get a feel for the campus before visiting in person."
  }
];
