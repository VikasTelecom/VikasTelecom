# Forgot Password Feature - Setup Guide

The forgot password feature has been successfully implemented! Here's what was added and how to set it up.

## What Was Added

### Backend Changes
1. **User Model** (`src/models/User.js`) - Added two new fields:
   - `resetPasswordToken` - Stores hashed reset token
   - `resetPasswordExpire` - Stores token expiration time (30 minutes)

2. **Auth Controller** (`src/controllers/authController.js`) - Added two new methods:
   - `forgotPassword` - Generates reset token and sends email
   - `resetPassword` - Verifies token and updates password

3. **Email Utility** (`src/utils/email.js`) - New file for:
   - Configuring email transporter (Gmail or SMTP)
   - Sending password reset emails with HTML template

4. **Auth Routes** (`src/routes/authRoutes.js`) - Added two endpoints:
   - `POST /api/auth/forgot-password` - Request password reset
   - `POST /api/auth/reset-password/:token` - Reset password with token

5. **Dependencies** - Installed `nodemailer` package

### Frontend Changes
1. **ForgotPassword Page** (`src/pages/ForgotPassword.tsx`) - New page for:
   - Entering email address
   - Sending reset request
   - Success confirmation message

2. **ResetPassword Page** (`src/pages/ResetPassword.tsx`) - New page for:
   - Entering new password
   - Confirming password
   - Resetting password with token

3. **Routes** (`src/App.tsx`) - Added:
   - `/forgot-password` route
   - `/reset-password/:token` route

4. **Login Page** - Already has "Forgot password?" link

## Setup Instructions

### Step 1: Configure Email in `.env` File

Create or update your `.env` file in the backend folder. You have two options:

#### Option A: Using Gmail
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@vikastelecom.com
FRONTEND_URL=http://localhost:5173
```

**How to get Gmail app password:**
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Windows Computer" (or your device)
3. Google will generate a 16-character app password
4. Use this password in `EMAIL_PASSWORD`

#### Option B: Using Custom SMTP Server (SendGrid, AWS SES, etc.)
```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=vikastelecomnew2026@gmail.com
SMTP_PASSWORD=swbq exom prpz sudw
EMAIL_FROM=noreply@vikastelecom.com
FRONTEND_URL=http://localhost:5173
```

### Step 2: Update Frontend URL

Make sure `FRONTEND_URL` is set correctly in `.env` so the password reset links point to the right domain:
```env
FRONTEND_URL=http://localhost:5173  # For development
FRONTEND_URL=https://yourdomain.com # For production
```

### Step 3: Test the Feature

1. Start both backend and frontend:
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

2. Go to http://localhost:5173/login
3. Click "Forgot password?" link
4. Enter your email address
5. Check your email for the reset link
6. Click the link and enter a new password
7. You should be redirected to login with the new password

## How It Works

1. **User submits email** → Backend generates a unique token and saves it to the database
2. **Email sent** → User receives an email with a password reset link (valid for 30 minutes)
3. **User clicks link** → Frontend extracts token from URL and displays reset password form
4. **User enters new password** → Backend validates token, updates password, and returns new auth token
5. **User logged in** → Automatic redirect to login page or dashboard

## Security Features

- ✓ Tokens are hashed in database
- ✓ Tokens expire after 30 minutes
- ✓ Email existence not revealed (security best practice)
- ✓ Password must be at least 6 characters
- ✓ Passwords are bcrypt hashed
- ✓ Token cleared after use

## Environment Variables Reference

```env
# Email Service (required)
EMAIL_SERVICE=gmail                    # gmail or omit for custom SMTP
EMAIL_USER=your-email@gmail.com        # Email address
EMAIL_PASSWORD=your-app-password       # Gmail app password or SMTP password
EMAIL_FROM=noreply@vikastelecom.com   # Sender email address

# SMTP Configuration (use if not using Gmail)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-password

# Frontend (required)
FRONTEND_URL=http://localhost:5173    # Base URL for reset link
```

## Troubleshooting

### Email not sending?
- Check `.env` variables are correct
- Verify email credentials
- For Gmail: Make sure app password is enabled
- Check backend logs for error messages

### Reset link not working?
- Verify `FRONTEND_URL` in `.env` matches your frontend URL
- Check token hasn't expired (30 minute limit)
- Ensure database connection is working

### Password reset fails?
- Check passwords match
- Ensure password is at least 6 characters
- Verify database has the token saved

## Files Modified

- `backend/src/models/User.js` - Added reset token fields
- `backend/src/controllers/authController.js` - Added forgot/reset functions
- `backend/src/routes/authRoutes.js` - Added new routes
- `backend/.env.example` - Added email configuration examples
- `frontend/src/App.tsx` - Added routes
- Created `backend/src/utils/email.js` - Email utility
- Created `frontend/src/pages/ForgotPassword.tsx` - Forgot password page
- Created `frontend/src/pages/ResetPassword.tsx` - Reset password page

## Next Steps (Optional)

1. **Add email verification** - Send verification emails on signup
2. **Add password change** - Let authenticated users change their password
3. **Add email templates** - Create more professional HTML templates
4. **Add rate limiting** - Prevent spam by limiting reset requests
5. **Add SMS option** - Send reset codes via SMS

Enjoy your new forgot password feature! 🎉
