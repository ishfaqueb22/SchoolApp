#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function generateSessionSecret() {
  return crypto.randomBytes(64).toString('hex');
}

async function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function setupLocalEnvironment() {
  console.log('🚀 Setting up SmartSchool Finder for local development...');
  
  // Check if .env already exists
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const overwrite = await askQuestion('.env file already exists. Overwrite? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Setup cancelled. Existing .env file kept.');
      rl.close();
      return;
    }
  }
  
  // Get database details
  console.log('\n📊 Database Configuration:');
  const dbUser = await askQuestion('PostgreSQL username (default: postgres): ') || 'postgres';
  const dbPassword = await askQuestion('PostgreSQL password: ');
  const dbHost = await askQuestion('PostgreSQL host (default: localhost): ') || 'localhost';
  const dbPort = await askQuestion('PostgreSQL port (default: 5432): ') || '5432';
  const dbName = await askQuestion('PostgreSQL database name (default: smartschool_finder): ') || 'smartschool_finder';
  
  // Get API keys
  console.log('\n🔑 API Keys:');
  const openaiKey = await askQuestion('OpenAI API Key: ');
  const geminiKey = await askQuestion('Gemini API Key (optional): ');
  
  // Generate session secret
  const sessionSecret = generateSessionSecret();
  
  // Create .env file
  const envContent = `# Database Configuration
DATABASE_URL=postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}

# AI Service API Keys
OPENAI_API_KEY=${openaiKey}
GEMINI_API_KEY=${geminiKey}

# Authentication
SESSION_SECRET=${sessionSecret}

# Server Configuration
PORT=5000
NODE_ENV=development
`;

  fs.writeFileSync(envPath, envContent);
  console.log('\n✅ .env file created successfully!');
  
  // Ask if the user wants to create the database
  const createDb = await askQuestion('\nCreate database tables? This will run npm run db:push (y/N): ');
  if (createDb.toLowerCase() === 'y') {
    try {
      console.log('\n🔧 Setting up database tables...');
      execSync('npm run db:push', { stdio: 'inherit' });
      console.log('✅ Database tables created successfully!');
    } catch (error) {
      console.error('❌ Error creating database tables:', error.message);
    }
  }
  
  console.log('\n🎉 Setup complete! You can now run the application with:');
  console.log('npm run dev');
  
  rl.close();
}

setupLocalEnvironment().catch(err => {
  console.error('Error during setup:', err);
  rl.close();
});