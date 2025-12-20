# Authentication Setup

## Features

✅ **User Authentication** - Login/Register with email and password
✅ **Protected Routes** - All pages require authentication
✅ **Session Management** - JWT-based sessions with NextAuth.js
✅ **User Management** - Admin and User roles
✅ **Secure Passwords** - Bcrypt password hashing

## Default Admin User

A default admin user has been created for you:

- **Email**: `admin@example.com`
- **Password**: `password123`

⚠️ **Important**: Change this password after your first login in production!

## Creating New Users

### Method 1: Via Web Interface
1. Go to `/auth/register`
2. Fill in the registration form
3. Click "Create Account"

### Method 2: Via Command Line
```bash
npm run create-user <email> <password> [name]
```

Example:
```bash
npm run create-user user@example.com mypassword "John Doe"
```

## Pages

- `/auth/login` - Login page
- `/auth/register` - Registration page
- All other pages require authentication

## Environment Variables

Make sure these are set in `.env.local`:

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

To generate a secure secret:
```bash
openssl rand -base64 32
```

## How It Works

1. **Middleware Protection**: All routes (except `/auth/*`) are protected by middleware
2. **Login Flow**: User credentials are verified against the database
3. **Session**: JWT token is stored in a secure HTTP-only cookie
4. **Logout**: Session is cleared and user is redirected to login page

## User Roles

- **USER**: Regular user with access to all features
- **ADMIN**: Administrator with full access (future: add admin-only features)

## Security Features

- ✅ Password hashing with bcrypt (10 rounds)
- ✅ JWT session tokens
- ✅ HTTP-only cookies
- ✅ CSRF protection (built-in with NextAuth.js)
- ✅ Middleware route protection
