# SmartSchool Finder - Setup Guide

This guide will help you set up the SmartSchool Finder project on your local PC.

## Prerequisites

- Node.js (v18 or later)
- PostgreSQL database
- Git

## Setup Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd smartschool-finder
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

1. Create a `.env` file in the root directory based on the provided `.env.example`:

```bash
cp .env.example .env
```

2. Open the `.env` file and update the following variables:

   - `DATABASE_URL`: Your PostgreSQL connection string
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `GEMINI_API_KEY`: Your Google Gemini API key (optional)
   - `SESSION_SECRET`: A secure random string for session encryption

Example DATABASE_URL format:
```
DATABASE_URL=postgresql://username:password@localhost:5432/databasename
```

### 4. Set Up the Database

1. Create a PostgreSQL database:

```bash
createdb smartschool_finder
```

2. Push the database schema:

```bash
npm run db:push
```

### 5. Start the Development Server

```bash
npm run dev
```

The application should now be running on [http://localhost:5000](http://localhost:5000).

## Common Issues and Solutions

### Database Connection Issues

- Ensure PostgreSQL is running on your machine
- Verify that the database credentials in your `.env` file are correct
- Check if the specified database exists

### API Key Issues

- Make sure you have valid API keys for OpenAI
- If you see authentication errors, double-check the API keys
- Sometimes API services have rate limits; watch for related error messages

### Port Already in Use

If port 5000 is already in use, modify the `PORT` environment variable in your `.env` file.

## Project Structure

- `client/`: Frontend React application
- `server/`: Backend Express API
- `shared/`: Shared types and schemas used by both client and server

## Using the Application

Once running, you can:

1. Create a user account
2. Log in to the system
3. Explore schools, add new schools, or manage existing ones based on your role
4. Use the interactive map to locate schools
5. Use the AI-powered features for recommendations

## Additional Resources

- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)
- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)