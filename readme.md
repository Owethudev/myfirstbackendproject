# SNPLPORT

SNPLPORT is a full-stack community platform built with React, TypeScript, Node.js, Express, and MongoDB. It allows users to register, verify their email, sign in, create and discover community projects, share upcoming events, manage profiles, and interact with an admin moderation dashboard.

This project was built by Owethu Jezile as a full-stack learning and portfolio application that combines authentication, real-world API design, email workflows, and a polished frontend experience.

## Overview

SNPLPORT brings together three core experiences:

- A secure authentication system for users
- A community feed for projects and portfolio-style posts
- An event-sharing experience for community updates and happenings

The app is designed to feel modern and responsive while keeping the backend organized and scalable.

## Key Features

### Authentication and Account Security

- User registration with validation
- Email verification flow
- Login with JWT-based authentication
- Password reset via email
- Protected routes for authenticated and admin users
- Rate limiting for login, signup, forgot-password, and general API traffic

### Community Feed

- Create project posts with name, description, and portfolio link
- View all project posts in a dynamic feed
- Search posts by name, description, portfolio, or author
- Paginated loading for better performance
- Responsive UI with feed layout switching

### Events Feed

- Create and view community events
- Display event name, location, theme, and time
- Browse events in a dedicated section

### User Profile Management

- Update profile information such as username and email
- Persist user sessions locally in the browser
- View profile details through a drawer-style interface

### Admin Dashboard

- View platform statistics
- Manage users and account status
- Promote or suspend users
- Review reported posts
- Delete inappropriate content
- Access audit logs for admin oversight

### Audit and Monitoring

- Audit trail logging for key actions
- Structured backend logging for maintainability
- Error-aware responses for clearer API behavior

## Tech Stack

### Frontend

- React 19
- TypeScript
- Vite
- React Router DOM
- Framer Motion
- Lucide React
- Tailwind CSS

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT for authentication
- bcrypt for password hashing
- nodemailer for email delivery
- express-rate-limit for request protection

## Project Structure

```text
myfirstbackendproject/
├── backend/
│   ├── src/
│   │   ├── app.js
│   │   ├── index.js
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
├── frontend/
│   └── myfullstack/
│       ├── src/
│       │   ├── components/
│       │   ├── api.ts
│       │   ├── App.tsx
│       │   └── types.ts
│       └── package.json
└── README.md
```

## Environment Variables

Create a `.env` file in the backend directory with the following values:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173
API_MAIL_KEY=your_mail_provider_api_key
EMAIL_FROM="SNPLPORT <no-reply@example.com>"
```

> If your mail provider is not configured, the app will still run, but email delivery features may be limited.

## Installation

### 1. Install root dependencies

```bash
npm install
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Install frontend dependencies

```bash
cd ../frontend/myfullstack
npm install
```

## Running the App

### Start the backend

```bash
cd backend
npm run dev
```

The backend will run on:

```text
http://localhost:8000
```

### Start the frontend

```bash
cd frontend/myfullstack
npm run dev
```

The frontend will run on:

```text
http://localhost:5173
```

## API Highlights

### Auth Endpoints

- `POST /api/v1/users/register`
- `GET /api/v1/users/verify/:token`
- `POST /api/v1/users/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

### Posts

- `POST /api/v1/posts/create`
- `GET /api/v1/posts/getPosts`
- `GET /api/v1/posts/reported` _(admin)_
- `PATCH /api/v1/posts/review/:id` _(admin)_
- `PATCH /api/v1/posts/update/:id`
- `DELETE /api/v1/posts/delete/:id`

### Events

- `POST /api/v1/events/create`
- `GET /api/v1/events/getEvents`
- `DELETE /api/v1/events/delete/:id`

### Admin and User Management

- `GET /api/v1/users/stats` _(admin)_
- `GET /api/v1/users/list` _(admin)_
- `PATCH /api/v1/users/status/:id` _(admin)_
- `PATCH /api/v1/users/role/:id` _(admin)_
- `PATCH /api/v1/users/update`
- `DELETE /api/v1/users/delete`

## Security Notes

The backend includes several protective measures:

- JWT-based authentication
- Password hashing with bcrypt
- Email verification before login
- Input validation for authentication flows
- Rate limiting for sensitive endpoints
- Admin-only access for moderation features

## Future Improvements

Possible enhancements for the next iteration include:

- Real-time notifications
- Comments and likes for posts
- Image uploads for profiles and posts
- Better moderation workflows
- Search improvements and analytics dashboards

## Credits

Built by Owethu Jezile.
