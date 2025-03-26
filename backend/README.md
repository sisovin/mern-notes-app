# MERN Notes App - Backend

## 1. Backend Overview

This backend application serves as the server-side component of the MERN Notes App, providing a robust API for note management, user authentication, and authorization. Built with Node.js and Express, it connects to MongoDB for data persistence and implements Redis for caching to enhance performance. The application follows a structured architecture with comprehensive security features including JWT authentication, role-based access control, and permission validation.

Key features include:
- Complete user authentication system with JWT
- CRUD operations for notes with tagging functionality
- Role-based access control system
- Admin dashboard statistics
- Redis caching for improved performance
- Environment-based configuration

## 2. Backend Project Structure

The backend follows a modular structure for maintainability and scalability:

```
mern-notes-app/
│── backend/
    │
    ├── config/                  # Configuration files
    │   ├── checkDbStatus.js     # Database connection status check
    │   ├── db.js                # MongoDB connection setup
    │   ├── envCheck.js          # Environment variables validation
    │   ├── loadEnv.js           # Environment loading utility
    │   ├── redisClient.js       # Redis client configuration
    │   └── tokens.js            # JWT token management
    │
    ├── controllers/             # API endpoint logic
    │   ├── adminStatsController.js   # Admin dashboard statistics
    │   ├── authController.js         # Authentication operations
    │   ├── noteDetailsController.js  # Note details operations
    │   ├── notesController.js        # Notes CRUD operations
    │   ├── permissionsController.js  # Permission management
    │   ├── roleController.js         # Role management
    │   ├── tagController.js          # Tags operations
    │   └── userController.js         # User management
    │
    ├── middleware/              # Request processing middleware
    │   ├── adminMiddleware.js          # Admin access control
    │   ├── authMiddleware.js           # Authentication verification
    │   ├── checkPermissionMiddleware.js # Permission validation
    │   ├── roleMiddleware.js           # Role-based access control
    │   ├── validateObjectId.js         # MongoDB ObjectId validation
    │   └── validationMiddleware.js     # Request data validation
    │
    ├── models/                  # MongoDB schema definitions
    │   ├── Note.js              # Note schema definition
    │   ├── NoteDetail.js        # NoteDetail schema definition
    │   ├── Permission.js        # Permission schema definition
    │   ├── RefreshToken.js      # RefreshToken schema definition
    │   ├── Role.js              # Role schema definition
    │   ├── Tag.js               # Tag schema definition
    │   ├── Token.js             # Token schema definition
    │   └── User.js              # User schema definition
    │
    ├── routes/                  # API route definitions
    |   ├── adminStatsRoutes.js         # Admin dashboard routes
    |   ├── authRoutes.js              # Authentication routes
    |   ├── noteDetailsRoutes.js        # Note details routes
    |   ├── notesRoutes.js             # Notes CRUD routes
    |   ├── permissionsRoutes.js        # Permission management routes
    |   ├── roleRoutes.js               # Role management routes
    |   ├── systemRoutes.js             # System routes
    |   ├── tagRoutes.js                # Tags operations routes
    |   └── userRoutes.js               # User management routes
    │
    ├── scripts/                 # Utility scripts
    |   ├── cleanupTagData.js          # Script to clean up tag data
    |   └── createSampleData.js       # Script to create sample data
    |   ├── generateEnv.js          # Script to generate .env file
    |   ├── initRoles.js                # Script to initialize roles
    |   ├── migrateToRoleModel.js # Script to migrate to role model
    |   ├── setAdmin.js                # Script to set admin role
    |   ├── test-db.js                # Test database script
    |   ├── testDbConnection.js # Test database connection script
    |   ├── updateAdminBio.js # Script to update admin bio
    |   ├── updateRoles.js # Script to update roles
    |   └── upsertRole.js # Script to upsert roles
    │
    ├── .env                     # Environment variables (not in version control)
    ├── .gitignore               # Git ignore rules
    ├── package-lock.json       # NPM lock file
    ├── package.json             # Node.js dependencies and scripts
    ├── README.md                # Backend documentation
    └── server.js                # Main application entry point
```

This structure follows MVC-like principles, separating concerns for better code organization and maintainability.

## 3. How the Backend Runs and API Endpoint Test Tools

### Running the Backend

1. Install dependencies:
   ```
   npm install
   ```

2. Set up environment variables by creating a `.env` file based on the required configuration (see config/envCheck.js)

3. Start the server:
   - Development mode: `npm run dev`
   - Production mode: `npm start`

### API Endpoint Testing Tools

To test the API endpoints, you can use:

1. **Postman**: Create a collection of requests for each endpoint, including authentication headers and request bodies.

2. **Insomnia**: Similar to Postman, provides a clean interface for testing REST APIs.

3. **curl**: Command-line tool for making HTTP requests directly from the terminal.

4. **Thunder Client**: VS Code extension providing a lightweight GUI for API testing within your development environment.

5. **Jest + Supertest**: For automated testing, create test suites using Jest with Supertest to simulate HTTP requests.

## 4. Choosing an IDE

For optimal development experience with this Node.js backend, consider:

1. **Visual Studio Code (VS Code)**
   - Recommended extensions:
     - ESLint for code quality
     - Prettier for code formatting
     - REST Client for API testing
     - MongoDB for VS Code for database management
     - Thunder Client for API testing

2. **WebStorm**
   - Full-featured IDE with built-in Node.js support
   - Advanced code completion and analysis
   - Integrated terminal and debugging

3. **Sublime Text**
   - Lightweight option with Node.js plugins available
   - Fast performance for large projects

4. **Atom**
   - Customizable editor with good Node.js support through packages

VS Code is generally recommended for its balance of features, performance, and extensive plugin ecosystem tailored for Node.js/Express development.

## 5. How to Push into GitHub Account

### First-Time Setup

1. Initialize Git repository (if not already done):
   ```
   git init
   ```

2. Add your GitHub repository as remote:
   ```
   git remote add origin https://github.com/yourusername/mern-notes-app.git
   ```

3. Create main branch (if using main instead of master):
   ```
   git branch -M main
   ```

### Regular Workflow

1. Check status of your changes:
   ```
   git status
   ```

2. Add files to staging:
   ```
   git add .
   ```

3. Commit changes with a descriptive message:
   ```
   git commit -m "Add feature: [description]"
   ```

4. Push to GitHub:
   ```
   git push -u origin main
   ```

### Best Practices

1. **Use branches** for new features or bug fixes:
   ```
   git checkout -b feature/new-feature-name
   ```

2. **Pull before pushing** to avoid conflicts:
   ```
   git pull origin main
   ```

3. **Use meaningful commit messages** that describe what changes were made and why.

4. **Include `.env` in your `.gitignore`** to prevent exposing sensitive information.

5. **Consider using GitHub Actions** for continuous integration/deployment workflows.

