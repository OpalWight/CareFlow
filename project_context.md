# Project Context: CNA Learning Hub

This document outlines the technical design and architecture of the CNA Learning Hub application, a full-stack project designed to help Certified Nursing Assistant (CNA) students practice their skills.

## 1. Overall Architecture

The application follows a classic client-server architecture:

-   **Frontend:** A single-page application (SPA) built with **React** and **Vite**. It is responsible for the user interface, client-side state management, and interaction with the backend.
-   **Backend:** A **Node.js** server using the **Express** framework. It handles business logic, user authentication, database interactions, and communication with external AI services.
-   **Database:** **MongoDB** is used as the primary data store, managed with the **Mongoose** ODM.
-   **AI Integration:** **Google's Gemini API** is used for the AI-powered chat simulations and the Retrieval-Augmented Generation (RAG) system.

---

## 2. Backend System

The backend is a monolithic Node.js/Express application responsible for the core logic of the platform.

### 2.1. Core Technologies

-   **Framework:** Express.js
-   **Database:** MongoDB with Mongoose
-   **Authentication:** JSON Web Tokens (JWT) stored in secure, HTTP-only cookies.
-   **Environment Management:** `dotenv` is used to manage environment variables for different environments (development vs. production).

### 2.2. Subsystems

#### a. Authentication and Authorization

-   **Dual Authentication Methods:** The system supports both traditional email/password registration and Google OAuth 2.0.
    -   **Email/Password:** Uses `bcryptjs` for password hashing. Routes are protected with rate limiting to prevent brute-force attacks.
    -   **Google OAuth:** The backend handles the entire OAuth flow, exchanging the authorization code for an access token, fetching user data from Google, and then creating or linking the user account in the database.
-   **JWT-based Sessions:** Upon successful login, a JWT is generated (`utils/createToken.js`) and set as an **HTTP-only cookie**. This is a critical security measure to prevent XSS attacks from stealing user tokens.
-   **Middleware (`middleware/authMiddleware.js`):** A central middleware is used to protect routes. It extracts the JWT from the `authToken` cookie, verifies its signature, and attaches the authenticated user's data to the `req` object. This makes the user's identity available to all protected endpoints.

#### b. API Routing (`routes/`)

The API is organized into modular route files, each handling a specific domain:

-   `auth.js`: Handles email/password registration, login, and logout.
-   `oauth.js`: Manages the Google OAuth callback, token verification, and user profile management (update, delete).
-   `chat.js`: Powers the AI patient simulation. It has endpoints to start a session and send messages.
-   `progress.js`: Tracks user progress for each skill, including scores, completed steps, and time spent.
-   `rag.js`: Exposes the RAG system for verifying student actions in real-time.
-   `knowledgeRoutes.js`: Provides CRUD operations for managing the knowledge base documents used by the RAG system (admin-only).

#### c. AI Chat Simulation (`controllers/chatController.js`)

This is the core of the interactive learning experience.

-   **Session Management:** When a user starts a chat (`/chat/start`), a new `ChatSession` document is created in MongoDB, linking the user to a specific skill scenario.
-   **AI Interaction:** The backend communicates with the **Google Gemini API**. It constructs a detailed system prompt that instructs the AI to act as a patient based on a predefined scenario.
-   **Real-time Evaluation:** For every message the student sends, the backend performs an evaluation using another call to the Gemini API. It checks if the student's message is relevant to the CNA skill and if it meets any of the learning objectives for that skill. This allows for dynamic feedback and progress tracking.
-   **Evaluation Modes:** The system supports different difficulty levels ("broad" vs. "specific"), which changes the strictness of the AI's evaluation.

#### d. Retrieval-Augmented Generation (RAG) System (`services/ragVerificationService.js`, `services/knowledgeBase.js`)

This system provides real-time, knowledge-grounded feedback for the interactive skill simulations.

-   **Knowledge Base:** The knowledge base is built on **Pinecone**, a vector database. CNA skill documents (procedures, rationales, critical steps) are chunked, converted into vector embeddings using a Google embedding model, and stored in Pinecone.
-   **Verification Flow:** When a student performs an action in the frontend simulation (e.g., "drags soap to the sink"), the frontend sends this action to the backend's RAG API (`/api/rag/verify-step`).
-   **Real-time Analysis:** The RAG service embeds the user's action into a vector and queries the Pinecone database to find the most relevant knowledge snippets. These snippets, along with the user's action, are then sent to the Gemini API with a prompt asking it to verify if the action was correct.
-   **Result:** The system returns a detailed verification result, including whether the step was correct, a score, and a rationale for the decision.

#### e. Database Models (`models/`)

Mongoose schemas define the structure of the data stored in MongoDB:

-   `User.js`: Stores user information, including authentication details (Google ID, hashed password), role, and personal info.
-   `ChatSession.js`: Records the entire history of a chat simulation, including all messages and completed objectives.
-   `UserProgress.js`: Tracks a user's performance on a per-skill basis, aggregating data from both chat and interactive simulations.
-   `KnowledgeDocument.js`: Defines the structure for the documents that feed the RAG system's knowledge base.
-   `Scenario.js`: Stores the details for each patient simulation scenario.

---

## 3. Frontend System

The frontend is a modern React SPA that provides a dynamic and interactive user experience.

### 3.1. Core Technologies

-   **Framework:** React
-   **Build Tool:** Vite
-   **Routing:** `react-router-dom`
-   **API Communication:** `axios` and native `fetch`
-   **Drag and Drop:** `@dnd-kit` for interactive skill simulations.

### 3.2. Subsystems

#### a. Application Structure and Routing (`App.jsx`)

-   **Centralized Routing:** The `App.jsx` file defines all the application's routes using `react-router-dom`.
-   **Route Protection:** The application uses custom wrapper components, `ProtectedRoute.jsx` and `PublicRoute.jsx`, to manage access control.
    -   `ProtectedRoute`: Ensures that only authenticated users can access certain pages (e.g., the learner home, settings). If an unauthenticated user tries to access these, they are redirected to the sign-up page.
    -   `PublicRoute`: Prevents authenticated users from accessing pages like the landing page or login page, redirecting them to their dashboard if they are already logged in.
-   **Global State (`api/AuthContext.jsx`):** The entire application is wrapped in an `AuthProvider`. This context provides global access to the user's authentication state (`isAuthenticated`, `user` object) and functions for logging in, logging out, and checking the session status.

#### b. Authentication Flow

-   **Session Initialization:** When the app loads, the `AuthProvider` calls the backend's `/oauth/verify` endpoint. Because the frontend requests are configured with `credentials: 'include'`, the browser automatically sends the secure `authToken` cookie. If the cookie is valid, the backend responds with the user's data, and the frontend updates its state to reflect that the user is logged in.
-   **Login:** The login page redirects the user to the backend's Google OAuth endpoint. After the user authenticates with Google, the backend redirects them back to a special `/auth-callback` route on the frontend with a temporary token. This callback handler exchanges the temporary token for a session cookie and then redirects the user to their dashboard.
-   **Logout:** The logout function makes a request to the backend's `/auth/logout` endpoint, which clears the HTTP-only cookie, effectively ending the session.

#### c. Interactive Components

-   **Chat Page (`pages/ChatPage.jsx`):** This component manages the state of a chat simulation. It calls the `chatApi` service to start sessions and send messages, and it displays the conversation history. It also integrates with browser APIs for text-to-speech and speech recognition to enhance accessibility.
-   **Interactive Scenarios (`components/interactive/InteractiveScenarioPage.jsx`):** This is one of the most complex components.
    -   It uses the **`@dnd-kit` library** to create a drag-and-drop interface where users can gather virtual supplies and perform skill steps in a simulated patient room.
    -   Each user action (like dropping a supply on a target) triggers a call to the backend's RAG API to get real-time feedback.
    -   The component manages the state of the scenario, including which supplies have been collected and which steps have been completed.
-   **Progress Tracking (`api/progressService.js`):** The frontend uses this service to communicate with the backend's `/progress` endpoints. After a user completes a simulation or a chat session, the frontend sends the results (score, time, etc.) to the backend to be saved.

#### d. State Management

-   **Authentication:** Global authentication state is managed by `AuthContext`.
-   **Local Component State:** Most other state is managed locally within the components using React hooks like `useState` and `useEffect`. This keeps the state management simple and co-located with the components that use it.
