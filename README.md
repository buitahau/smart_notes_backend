# Backend - Hono API

Node.js backend with Hono framework and Drizzle ORM for database operations.

## Structure

- `src/` - Application source code
- `src/database/` - Database configuration and schema
- `src/database/migrations/` - Database migrations for Neon PostgreSQL
- `src/database/schema/` - Drizzle ORM schemas
- `src/routes/` - API route handlers
- `src/controllers/` - Business logic controllers
- `src/middleware/` - Custom middleware functions
- `src/services/` - Service layer for business logic
- `src/ai/` - AI-related functionality
- `utils/` - Utility functions and helpers

## Tech Stack

- **Framework**: Hono
- **Database**: Neon (PostgreSQL) with Drizzle ORM
- **Authentication**: Supabase Auth
- **Server**: @hono/node-server for Node.js compatibility

## Environment Setup

### Environment Variables

Add the following to your `.env` file:

```env
DATABASE_URL="your_neon_database_connection_string"
SUPABASE_URL="your_supabase_url"
SUPABASE_ANON_KEY="your_supabase_anon_key"
PORT=3000
```

### Database Setup with Drizzle ORM

#### Running Migrations

1. **Generate migrations** (when you change the schema):
   ```bash
   npx drizzle-kit generate
   ```

2. **Run migrations**:
   ```bash
   npx drizzle-kit migrate
   ```

#### Apply Changes

1. **Run**:
   ```bash
   npx drizzle-kit push
   ```

#### Schema Configuration

- Schema files are located in `src/database/schema/`
- Migration files are generated in `src/database/migrations/`
- Configuration is in `drizzle.config.ts`

#### Example Schema

The `notes` table schema includes:
- `id`: Primary key (text)
- `title`: Note title (required)
- `content`: Note content (required)
- `createdAt`: Creation timestamp with timezone
- `dateAt`: Update timestamp with timezone

## Development

```bash
cd backend
npm install
npm run dev
```

The server will start on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/validate` - Token validation

### Notes
- `GET /api/notes` - Get all notes for authenticated user
- `POST /api/notes` - Create a new note
- `GET /api/notes/:id` - Get note by ID
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note

### Query
- `POST /api/query` - Query notes with AI-powered search

### Indexes
- `GET /api/indexes/create` - Create vector index
- `GET /api/indexes/create-metadata` - Create metadata index
- `POST /api/indexes/delete` - Delete index
- `GET /api/indexes/list-metadata` - List metadata indexes

## Key Features

- **Modern Framework**: Built with Hono for better performance and TypeScript support
- **Authentication**: JWT-based authentication with Supabase
- **AI Integration**: OpenRouter API integration for intelligent note querying
- **Database**: PostgreSQL with Neon cloud hosting
- **ORM**: Drizzle ORM for type-safe database operations
- **Middleware**: Custom authentication and CORS middleware
- **Logging**: Built-in request logging

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run start` - Start production server
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

## Migration from Express

This backend has been successfully migrated from Express.js to Hono framework. Key improvements:
- Better performance and smaller bundle size
- Improved TypeScript support
- Modern middleware system
- Simplified routing syntax
- Built-in CORS and logging middleware

## Registration Flow
**1. User submits registration info → Backend**

The user enters their email and other required information in the extension or UI.
The client sends this data to the backend’s /api/register endpoint.

**2. Backend registers with IAM → receives IAM user ID**

The backend sends a request to the IAM service to create a new identity record.
IAM returns an iam_user_id upon success.

**3. Backend stores the user as PendingVerification**

The backend creates a user record in its database with:

status = PendingVerification

iam_id = <IAM user ID>

any other initial fields (email, profile info, metadata)

**4. IAM sends the verification email**

IAM generates a verification email and sends it to the user.
The email contains a verification link managed by IAM.

**5. User clicks IAM’s email verification link**

When the user clicks the verification link, IAM receives the request and starts the verification process.

**6. IAM confirms verification internally**

IAM validates the email verification token and marks the user as verified inside IAM.

**7. IAM redirects the user to your backend with a short-lived JWT**

After verification, IAM redirects the user's browser to your backend’s confirmation endpoint, e.g. /auth/iam/callback, and includes:

a short-lived, signed JWT containing user identity claims (e.g., iam_user_id, email)

**8. Backend verifies the token signature and expiry**

The backend validates:

the JWT’s signature (using IAM’s public key)

token expiry

integrity of claims

If valid, the backend proceeds.

**9. Backend activates the user and initializes default settings**

The backend:

sets status = Active

generates default resources/settings (e.g., preferences, onboarding data)

logs the activation event for auditing

**10. Backend redirects the user to the final “Welcome” UI**

After activation, the backend redirects the user to a success screen such as:

/welcome

or the extension/UI home page

The user is now fully registered and activated.

## SSO Registration Flow
**1. User chooses "Continue with Google/Facebook" on your web page**

**2. Frontend redirects user to IAM’s SSO endpoint**

**3. Google/Facebook authenticates the user**

**4. IAM verifies the identity and creates an IAM user**

**5. IAM redirects user to your backend with a short-lived JWT**

**7. Backend creates a new user if not exist**

**8.Activates the user and initializes default settings**

### Sequence Diagram
    autonumber

    participant User

    participant Extension

    participant LandingPage as Landing Page (Web)

    participant BE as Backend

    participant Supabase
    
    participant DB as App Database

    %% ========== PART 1: USER REGISTERS VIA LANDING PAGE (SSO) ==========
    User ->> LandingPage: Click "Continue with Google/Facebook"
    LandingPage ->> Supabase: Redirect to SSO Provider
    Supabase ->> Google/Facebook: Authenticate User
    Google/Facebook ->> Supabase: Return Auth Token
    Supabase ->> Supabase: Create/Update user in auth.users
    Supabase -->> LandingPage: Redirect with session(access_token)

    LandingPage ->> BE: Send Supabase access_token
    BE ->> Supabase: Validate access_token via /auth/v1/user
    Supabase -->> BE: Return user metadata

    BE ->> DB: Create/update app user (Active)
    BE -->> LandingPage: Return app session token
    LandingPage ->> User: User logged in on Web

    %% ========== PART 2: USER LOGIN IN EXTENSION (OTP METHOD) ==========
    User ->> Extension: Enter email

    Extension ->> BE: /auth/request-otp (email)
    BE ->> Supabase: Call /auth/v1/otp (send OTP)
    Supabase -->> User: Email OTP

    User ->> Extension: Enter OTP
    Extension ->> BE: /auth/verify-otp (email + otp)
    BE ->> Supabase: Call /auth/v1/verify (email + otp)
    Supabase -->> BE: Return supabase access_token

    %% ========== PART 3: BACKEND ACTIVATION + SESSION CREATION ==========
    BE ->> Supabase: /auth/v1/user (verify token)
    Supabase -->> BE: Return user identity

    BE ->> DB: Create/update app user (Active)
    BE ->> BE: Generate app session token
    BE -->> Extension: Return app session token

    Extension ->> Extension: Save token in chrome.storage
    Extension ->> User: Logged in inside extension

    %% ========== PART 4: USING AUTHENTICATED APIS ==========
    Extension ->> BE: API call with app session token
    BE ->> DB: Validate session + fetch user data
    BE -->> Extension: Return API response