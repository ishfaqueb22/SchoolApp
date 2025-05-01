# SmartSchool Finder

A premium full-stack web application for finding and comparing schools in Pakistan with modern UI/UX design.

## Overview

SmartSchool Finder helps Pakistani parents discover, compare and connect with the best educational institutions for their children. The platform features an intuitive, modern interface with comprehensive school listings, detailed profiles, comparison tools, and direct inquiry capabilities.

## Features

### For Parents & Students
- **School Discovery**: Browse schools with powerful filtering by location, type, curriculum and more
- **Detailed School Profiles**: View comprehensive information about each institution
- **School Comparison**: Compare multiple schools side-by-side for better decision making
- **Save & Bookmark**: Save favorite schools for later reference
- **Direct Inquiries**: Contact schools directly through the platform
- **Reviews & Ratings**: Read and submit reviews of educational institutions

### For School Administrators
- **School Profile Management**: Maintain accurate and updated school information
- **Faculty Management**: Add, edit, and showcase teaching staff and their qualifications
- **Content Publishing**: Post announcements, news, and upcoming events
- **Inquiry Management**: Respond to admission inquiries from potential students
- **Multi-Campus Support**: Manage information for multiple branches of the same institution

## Technology Stack

### Frontend
- React with TypeScript
- Vite for fast development and building
- TanStack Query for data fetching
- ShadcnUI + Tailwind CSS for UI components
- Wouter for routing

### Backend
- Express.js server
- PostgreSQL database with Drizzle ORM
- Session-based authentication
- Role-based access control

## Getting Started

### Prerequisites
- Node.js (v18 or later)
- PostgreSQL database

### Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Start the development server: `npm run dev`

### Database Setup
The application uses PostgreSQL with Drizzle ORM for data management:
- Database schema is defined in `shared/schema.ts`
- Run `npm run db:push` to set up or update the database schema
- Initial seed data is loaded automatically on first run

## User Roles

### Regular Users
- Browse schools
- Compare institutions
- Save favorites
- Submit inquiries and reviews

### School Administrators
- Manage school profile information
- Update faculty information
- Post announcements and events
- Respond to inquiries

### Platform Administrators
- Manage all schools and users
- Approve school listings
- Monitor platform activity
- Configure system settings