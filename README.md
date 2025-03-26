# MERN Notes App

A full-stack note management application with user authentication, role-based access control, and comprehensive CRUD operations.

## Project Overview

This MERN (MongoDB, Express, React, Node.js) application provides a complete solution for note management with advanced features:

- **User Authentication**: Complete JWT-based auth system with registration, login, and password reset
- **Role-Based Access Control**: Different permission levels for users, editors, and admins
- **Note Management**: Create, read, update, and delete notes with tagging functionality
- **Responsive UI**: Mobile-friendly interface built with React and styled with Tailwind CSS
- **Performance Optimized**: Redis caching on backend and API caching on frontend

## Project Structure

```
mern-notes-app/
├── backend/                 # Server-side code
│   ├── config/              # Configuration files
│   ├── controllers/         # API endpoint logic
│   ├── middleware/          # Request processing middleware
│   ├── models/              # MongoDB schema definitions
│   ├── routes/              # API route definitions
│   ├── scripts/             # Utility scripts
│   ├── .env                 # Environment variables (not in version control)
│   ├── server.js            # Main application entry point
│   └── ...
│
├── frontend/                # Client-side code
│   ├── public/              # Static assets
│   ├── src/                 # Source code
│   │   ├── api/             # API integration
│   │   ├── assets/          # Images and static resources
│   │   ├── components/      # Reusable components
│   │   ├── context/         # React context providers
│   │   ├── features/        # Feature-specific modules
│   │   ├── hooks/           # Custom React hooks
│   │   ├── pages/           # Application pages
│   │   ├── tests/           # Test files
│   │   ├── utils/           # Utility functions
│   │   ├── App.jsx          # Main application component
│   │   └── main.jsx         # Application entry point
│   ├── index.html           # HTML entry point
│   └── ...
│
├── data/                    # Sample database data
│   ├── notesdb.notes.json
│   ├── notesdb.users.json
│   └── ...
│
└── docs/                    # Documentation files
    └── ...
```

## Setup and Installation

### Backend Setup

1. **Install dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment variables**:
   Create a `.env` file in the backend directory with required configuration (see config/envCheck.js)

3. **Start the server**:
   - Development mode: `npm run dev`
   - Production mode: `npm start`

### Frontend Setup

1. **Install dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment variables**:
   Create a `.env` file with `VITE_API_URL=http://localhost:5000/api` (or your API URL)

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   This will launch the application on `http://localhost:5173`

4. **Build for production**:
   ```bash
   npm run build
   ```

## Testing

### Backend Testing
- Use Postman, Insomnia, or Thunder Client to test API endpoints
- For automated testing, use Jest with Supertest

### Frontend Testing
- Component testing with Vitest: `npm test`
- End-to-end testing with Cypress
- Manual testing with the built-in DebugPanel component

## Development Tools

### Recommended IDEs
- **Visual Studio Code**: Lightweight with excellent extensions for both Node.js and React
- **WebStorm**: Full-featured IDE with advanced support for the entire stack
- **Sublime Text/Atom**: Lightweight alternatives with appropriate plugins

### VS Code Extensions
- ESLint for code quality
- Prettier for code formatting
- Tailwind CSS IntelliSense (frontend)
- MongoDB for VS Code (backend)
- Thunder Client for API testing (backend)
- ES7+ React snippets (frontend)

## Deployment and Version Control

### GitHub Workflow

1. **Initialize repository** (first time only):
   ```bash
   git init
   git remote add origin https://github.com/sisovin/mern-notes-app.git
   git branch -M main
   ```

2. **Regular workflow**:
   ```bash
   git status
   git add .
   git commit -m "Add feature: [description]"
   git push -u origin main
   ```

3. **Best practices**:
   - Use feature branches for development
   - Pull before pushing to avoid conflicts
   - Write meaningful commit messages
   - Keep sensitive data (like `.env` files) out of version control
```