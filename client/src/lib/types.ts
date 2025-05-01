export interface Campus {
  id: number;
  schoolId: number;
  name: string;
  location: string;
  address: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  imageUrl?: string;
  isMainCampus: boolean;
  facilities?: string[];
  studentCount?: number;
  establishedYear?: string;
  createdAt: string;
}

export interface School {
  id: number;
  name: string;
  description: string;
  location: string;
  address: string;
  type: string; // Montessori, STEM, Arts, International
  imageUrl?: string;
  rating?: number; // out of 50, converted to 0-5 scale in UI
  curriculumType: string;
  gradeRange: string;
  classSize?: string;
  tuitionRange?: string;
  hasFinancialAid?: boolean;
  features?: string[];
  establishedYear?: string; // When the school was established
  coordinates?: {
    lat: number;
    lng: number;
  };
  campuses?: Campus[]; // Array of campus information
  approvalStatus?: string; // 'pending', 'approved', 'rejected'
  verificationStatus?: boolean; // Whether the school is verified by platform admins
  featured?: boolean; // Whether the school is featured
}

export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: 'user' | 'schoolAdmin' | 'platformAdmin';
  createdAt: string;
  avatarUrl: string | null;
  schoolId: number | null;
}

export interface SavedSchool {
  id: number;
  userId: number;
  schoolId: number;
  savedAt: string;
}

export interface Comparison {
  id: number;
  userId: number;
  schoolIds: number[];
  createdAt: string;
}

export interface Review {
  id: number;
  userId: number;
  schoolId: number;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  password: string;
  email: string;
  fullName: string;
}

export interface FilterOptions {
  location?: string;
  curriculum?: string;
  gradeLevel?: string;
  features?: string[];
}

export interface Testimonial {
  id: number;
  name: string;
  role: string;
  avatar: string;
  rating: number;
  comment: string;
}

export interface FAQ {
  id: number;
  question: string;
  answer: string;
}

export interface CategoryType {
  id: number;
  name: string;
  description: string;
  image: string;
  count: number;
  color: string;
}
