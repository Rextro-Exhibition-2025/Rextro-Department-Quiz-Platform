# School Quiz Platform - Frontend

A modern, interactive quiz platform built with Next.js 15, featuring separate authentication systems for students and administrators.

## 🚀 Features

- **Student Login**: Traditional form-based authentication for quiz access
- **Admin Login**: Google OAuth authentication for question management
- **Interactive Quiz**: Full-screen quiz experience with real-time scoring
- **Leaderboard**: School rankings and individual scores
- **Question Management**: Admin panel for adding/editing quiz questions
- **Responsive Design**: Works on all devices

## 🛠 Tech Stack

- **Next.js 15** with TypeScript
- **Tailwind CSS** for styling
- **NextAuth.js** with Google OAuth
- **Lucide React** for icons

## 🔧 Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration

Create `.env.local` file:

```bash
# Admin Email Access (comma separated)
ADMIN_EMAILS=your-email@gmail.com
```
### 3. Run Development Server
```bash
npm run dev
```

## 🔐 Authentication

### Student Access
- **Route**: `/login`
- **Method**: Student ID + Password + School selection
- **Access**: Quiz and leaderboard

### Admin Access
- **Route**: `/admin-access`
- **Method**: Google OAuth only
- **Setup**: Add your email to `ADMIN_EMAILS` in `.env.local`
- **Access**: Question management panel

**Example admin setup:**
```bash
# Single admin
ADMIN_EMAILS=admin@gmail.com

# Multiple admins
ADMIN_EMAILS=admin@school.edu,teacher@gmail.com
```

## 📁 Project Structure

```
frontend/
├── app/
│   ├── admin/login/          # Admin Google OAuth
│   ├── add-question/         # Question management (protected)
│   ├── login/               # Student login
│   ├── quiz/                # Quiz interface
│   ├── leaderboard/         # Results and rankings
│   └── api/auth/            # NextAuth.js routes
├── components/              # Reusable components
└── middleware.ts           # Route protection
```

## 🚀 Available Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm start           # Production server
npm run lint        # Code linting
```

## 🎨 Color Theme

- **Primary Orange**: `#df7500`
- **Dark Red**: `#651321`

## 🐛 Troubleshooting

**"Access Denied" on admin login:**
- Verify your email is in `ADMIN_EMAILS`
- Check Google OAuth credentials

**Environment issues:**
- Ensure `.env.local` is in frontend root
- Restart development server after changes

##  Support

For issues, check the troubleshooting section or contact the development team.
