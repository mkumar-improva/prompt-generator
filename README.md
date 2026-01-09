# Prompt Generator

A powerful web application for uploading Excel files, filtering data, and generating AI-powered prompts using Google's Gemini AI.

## Features

- 📊 **Excel File Upload & Parsing**: Upload .xlsx/.xls files and automatically parse them into interactive tables
- 🔍 **Multiple Filters**: Apply filters on any column to quickly find relevant data
- 🤖 **AI Prompt Generation**: Generate prompts for each row using Gemini AI
- ✏️ **Template Editor**: Create and manage custom prompt templates with variable substitution
- 💾 **SQLite Database**: Store templates, Excel data, and generated prompts locally
- 🎨 **Beautiful UI**: Modern, responsive design with dark mode support
- ⚡ **Built with Next.js**: Fast, server-side rendered React application

## Tech Stack

- **Frontend**: Next.js 16 with TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: SQLite with better-sqlite3
- **AI**: Google Gemini AI
- **Excel Parsing**: xlsx library

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Gemini API key (optional, for AI features)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/mkumar-improva/prompt-generator.git
cd prompt-generator
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables (optional):
```bash
cp .env.example .env
```

Edit `.env` and add your Gemini API key:
```
GEMINI_API_KEY=your_api_key_here
```

Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey).

> **Note**: The app will work without an API key, but AI generation will not be available.

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### 1. Upload Excel File

Click the upload button and select an Excel file (.xlsx or .xls). The data will be parsed and displayed in a table.

### 2. Apply Filters

Use the filter inputs above each column to narrow down your data. Filters work with partial matches and are case-insensitive.

### 3. Edit Prompt Templates

- Select an existing template from the dropdown
- Edit the template name and content
- Use `{{data}}` to include all row data
- Use `{{columnName}}` to include specific column values
- Click "Update Template" to save changes
- Click "Create New Template" to create a new template

### 4. Generate Prompts

Click the "Generate" button on any row to create a prompt. The system will:
- Format the template with the row's data
- Send it to Gemini AI (if configured)
- Display both the formatted prompt and AI-generated response

## Project Structure

```
prompt-generator/
├── app/
│   ├── api/
│   │   ├── generate/      # AI prompt generation endpoint
│   │   ├── templates/     # Template CRUD operations
│   │   └── upload/        # Excel file upload and retrieval
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main application page
├── lib/
│   └── db.ts              # Database initialization and utilities
├── data/                  # SQLite database (auto-created)
├── .env.example           # Environment variables template
└── package.json
```

## API Endpoints

- `POST /api/upload` - Upload Excel file
- `GET /api/upload` - Get latest uploaded data
- `GET /api/templates` - Get all templates
- `POST /api/templates` - Create new template
- `PUT /api/templates` - Update existing template
- `POST /api/generate` - Generate prompt with AI

## Database Schema

### prompt_templates
- id (INTEGER PRIMARY KEY)
- name (TEXT)
- template (TEXT)
- created_at (DATETIME)
- updated_at (DATETIME)

### excel_data
- id (INTEGER PRIMARY KEY)
- filename (TEXT)
- data (TEXT JSON)
- uploaded_at (DATETIME)

### generated_prompts
- id (INTEGER PRIMARY KEY)
- row_data (TEXT JSON)
- template_id (INTEGER)
- prompt (TEXT)
- generated_at (DATETIME)

## Building for Production

```bash
npm run build
npm start
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
