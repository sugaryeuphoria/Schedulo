# Schedulo - Shift Manager

A modern, full-featured shift management application built with React and Firebase. Schedulo enables employees to manage their schedules and request shift swaps, while providing managers with comprehensive oversight and control of the entire team's schedule.

> **🎉 NEW FEATURES AVAILABLE!** See [QUICK_START.md](./QUICK_START.md) and [NEW_FEATURES_GUIDE.md](./NEW_FEATURES_GUIDE.md) for the latest updates including Store Calendar, Heat Maps, and Real-time Analytics!

**Table of Contents**

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Architecture](#architecture)
- [Key Components](#key-components)
- [Data Models](#data-models)
- [Firebase Collections](#firebase-collections)
- [Firebase Implementation](#firebase-implementation)
- [Diagnostic & Testing Tools](#diagnostic--testing-tools)
- [Authentication & Authorization](#authentication--authorization)
- [Development Guide](#development-guide)
- [Deployment](#deployment)

---

## Overview

Schedulo is a shift scheduling application designed to streamline how organizations manage employee shifts. The app supports two primary user roles:

- **Employees**: Can view their assigned shifts, request shift swaps with colleagues, and respond to swap requests from other employees
- **Managers**: Can create and manage shifts for all employees, view activity logs, and monitor shift distribution across the team

The application features real-time updates using Firebase Firestore, a beautiful UI built with shadcn/ui and Tailwind CSS, and a responsive design that works on desktop and mobile devices.

---

## Features

### Employee Features

- **Shift Calendar**: Visual calendar displaying assigned shifts with color-coded shift types (Day, Afternoon, Night)
- **Shift Swap Requests**: Initiate shift swap requests with other employees
- **Swap Management**: View pending swap requests and accept/decline them
- **Activity Tracking**: See recent activity related to shift changes and swaps
- **Quick Stats**: Dashboard showing shift count, pending swaps, and next scheduled shift
- **Real-time Updates**: Instant notifications when shifts or swap requests change

### Manager Features ⭐ **NEWLY ENHANCED**

- **🗓️ Store-Wide Calendar View**: Beautiful grid showing all employees and dates with drag-and-drop scheduling
- **🔥 Availability Heat Map**: Color-coded visualization of employee workload distribution
- **📊 Real-Time Analytics**: Interactive charts showing shift distribution, trends, and statistics
- **🎯 Drag & Drop Scheduling**: Instantly move shifts between employees and dates
- **⚠️ Conflict Detection**: Automatic warnings for overlapping shifts and scheduling issues
- **Comprehensive Dashboard**: Overview of team metrics including total employees, shifts, and activity logs
- **Quick Shift Assignment**: Click `+` in calendar cells to quickly add shifts with pre-filled data
- **Shift Management**: View all shifts and delete/modify them as needed
- **Employee Overview**: See all employees and their shift count at a glance
- **Activity Logs**: Complete audit trail of all shift-related actions
- **Database Initialization**: Quick setup tool to seed sample data

### Cross-functional Features

- **Authentication**: Simple email/password-based authentication with pre-configured test accounts
- **Real-time Sync**: All data updates are reflected across all connected clients instantly
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Tutorial System**: Interactive tutorial for new users to understand the app
- **Toast Notifications**: Non-intrusive alerts for user actions and errors

---

## Technology Stack

### Frontend

- **React 18.3**: Modern UI library with hooks
- **TypeScript 5.8**: Type-safe JavaScript for better development experience
- **Vite 5.4**: Lightning-fast build tool and development server
- **React Router 6.30**: Client-side routing
- **TailwindCSS 3.4**: Utility-first CSS framework for styling
- **Shadcn/ui 1.0+**: High-quality React components built on Radix UI
- **Lucide React 0.462**: Beautiful, consistent icon library
- **React Hook Form 7.61**: Performant and flexible form validation
- **Zod 3.25**: TypeScript-first schema validation
- **Recharts 2.15**: Composable charting library
- **date-fns 3.6**: Modern date utility library
- **Sonner 1.7**: Toast notification library

### Backend & Database

- **Firebase 12.5**: Real-time database and authentication
- **Firestore**: Cloud-hosted NoSQL database for data persistence
- **Real-time Listeners**: Firebase onSnapshot for real-time data synchronization

### Development Tools

- **ESLint 9.32**: Code quality and linting
- **TypeScript ESLint**: Type-aware linting rules
- **PostCSS 8.5**: CSS transformation
- **Autoprefixer**: Vendor prefix automation
- **Tailwind CSS Animate**: Animation utilities for Tailwind
- **React Query 5.83**: Server state management and caching

---

## Project Structure

```
apple-shift-manager/
├── src/
│   ├── pages/                      # Page components (routes)
│   │   ├── Index.tsx              # Main entry point with auth & role routing
│   │   ├── EmployeeDashboard.tsx  # Employee shift management interface
│   │   ├── ManagerDashboard.tsx   # Manager control panel
│   │   ├── Tutorial.tsx            # Interactive tutorial for users
│   │   └── NotFound.tsx            # 404 page
│   │
│   ├── components/                 # Reusable React components
│   │   ├── AuthForm.tsx           # Login form component
│   │   ├── ShiftCalendar.tsx      # Visual calendar for shifts
│   │   ├── ShiftSwapModal.tsx     # Modal for requesting shift swaps
│   │   ├── CreateShiftModal.tsx   # Modal for creating shifts (manager)
│   │   ├── ConflictsSidebar.tsx   # Sidebar showing swap requests
│   │   ├── LoadingSpinner.tsx     # Loading state indicator
│   │   ├── TutorialStepper.tsx    # Tutorial component
│   │   ├── NavLink.tsx            # Navigation link component
│   │   └── ui/                    # Shadcn/ui component library
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── input.tsx
│   │       ├── badge.tsx
│   │       ├── calendar.tsx
│   │       ├── tabs.tsx
│   │       ├── form.tsx
│   │       └── [30+ more UI components]
│   │
│   ├── lib/                        # Utility functions and services
│   │   ├── firebase.ts            # Firebase initialization
│   │   ├── firebaseService.ts     # CRUD operations for all collections
│   │   ├── seedFirebase.ts        # Database initialization with sample data
│   │   └── utils.ts               # Helper utilities
│   │
│   ├── hooks/                      # Custom React hooks
│   │   ├── use-toast.ts           # Toast notification hook
│   │   └── use-mobile.tsx         # Mobile detection hook
│   │
│   ├── types/                      # TypeScript type definitions
│   │   └── shift.ts               # Data models (Shift, User, SwapRequest, etc.)
│   │
│   ├── data/                       # Mock/sample data
│   │   └── mockData.ts            # Test credentials and sample data
│   │
│   ├── App.tsx                     # Root component with providers and routing
│   ├── main.tsx                    # Application entry point
│   ├── index.css                   # Global styles
│   └── App.css                     # App-specific styles
│
├── public/                         # Static assets
│   └── robots.txt
│
├── Configuration files
├── package.json                    # Dependencies and scripts
├── tsconfig.json                   # TypeScript configuration
├── tsconfig.app.json              # App-specific TS config
├── tsconfig.node.json             # Node-specific TS config
├── vite.config.ts                 # Vite build configuration
├── tailwind.config.ts             # Tailwind CSS configuration
├── postcss.config.js              # PostCSS configuration
├── eslint.config.js               # ESLint rules
└── components.json                # Shadcn/ui components manifest
```

---

## Getting Started

### Prerequisites

- **Node.js** (v16 or higher) and **npm/bun** installed
- A **Firebase project** with Firestore database enabled
- Firebase credentials for your project

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd apple-shift-manager
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   bun install
   ```

3. **Configure Firebase**

   - Update `src/lib/firebase.ts` with your Firebase project credentials
   - Ensure your Firestore database is initialized

4. **Start the development server**

   ```bash
   npm run dev
   # or
   bun run dev
   ```

   The app will be available at `http://localhost:8080`

5. **Initialize Sample Data**
   - Go to `http://localhost:8080/diagnostic`
   - Click **"Generate & Seed Shifts"** to create balanced shifts
   - This generates 80 shifts (5 per day) across 16 days with fair distribution

### Shift Generation Algorithm

The app uses a **balanced random shift generation algorithm** that ensures:

- **Daily Constraints**: Each day has exactly 2 day shifts, 2 afternoon shifts, and 1 night shift
- **Employee Fairness**: Each employee gets at most 1 shift per day, with random distribution
- **No Conflicts**: Automatic detection prevents double-booking
- **Fair Distribution**: Over 16 days, shifts are randomly distributed ensuring all employees work similar amounts

**Process**:

1. For each day (Nov 15-30, 2024):
   - Shuffle employees randomly
   - Assign first 2 → Day shift (08:00-16:00)
   - Assign next 2 → Afternoon shift (16:00-00:00)
   - Assign next 1 → Night shift (00:00-08:00)
   - Last 3 employees → Off
2. Delete existing shifts and reseed with new schedule
3. Display validation summary showing constraint compliance

**Implementation**: See `src/lib/shiftGenerator.ts` for the algorithm.

### Test Credentials

After seeding the database, use these credentials to log in:

**Manager Account:**

- Email: `manager@test.com`
- Password: `manager123`

**Employee Accounts:**

- Email: `alice@test.com` / Password: `alice123`
- Email: `bob@test.com` / Password: `bob123`
- Email: `carol@test.com` / Password: `carol123`
- Email: `david@test.com` / Password: `david123`

---

## Architecture

### Application Flow

```
App (Root)
├── QueryClientProvider (React Query for state management)
├── TooltipProvider (Radix UI context)
├── BrowserRouter (Client-side routing)
│   └── Routes
│       ├── "/" → Index (Auth + Role Router)
│       │   ├── EmployeeDashboard (if role === 'employee')
│       │   └── ManagerDashboard (if role === 'manager')
│       ├── "/tutorial" → Tutorial
│       └── "*" → NotFound
└── Toast/Notification System
```

### Data Flow

1. **Authentication**: User logs in via AuthForm
2. **Role Detection**: App determines user role (employee/manager)
3. **Real-time Subscriptions**: Firebase listeners are set up for relevant collections
4. **State Management**: React state holds shifts, swaps, and activity logs
5. **User Actions**: Shift swaps, creations, and deletions trigger Firestore updates
6. **Real-time Sync**: All connected clients receive updates instantly

---

## Key Components

### Pages

#### **Index.tsx**

- Main entry point and authentication handler
- Routes users to appropriate dashboard based on role
- Handles database initialization and seeding
- Loads all users for authentication

#### **EmployeeDashboard.tsx**

- Displays employee's assigned shifts in a calendar view
- Manages shift swap requests and responses
- Shows pending swaps in sidebar
- Real-time sync with Firestore shifts and swap requests

#### **ManagerDashboard.tsx**

- Comprehensive manager control panel with tabs:
  - **Overview**: Shift distribution, quick actions, and key metrics
  - **Employees**: List of all employees with shift counts
  - **Shifts**: All shifts with delete functionality
  - **Activity Log**: Audit trail of all actions

#### **Tutorial.tsx**

- Step-by-step guide for new users
- Interactive tutorial stepper component
- Explains key features and workflows

### Components

#### **ShiftCalendar.tsx**

- Displays shifts in a grid calendar format
- Color-coded by shift type (day/afternoon/night)
- Supports swap request initiation
- Responsive grid layout

#### **ShiftSwapModal.tsx**

- Modal dialog for requesting shift swaps
- Shows shift details and available employees
- Allows selection of target employee
- Form validation and confirmation

#### **CreateShiftModal.tsx**

- Manager tool for creating new shifts
- Employee selection dropdown
- Date, time, and shift type inputs
- Form validation with Zod

#### **ConflictsSidebar.tsx**

- Displays pending swap requests for employees
- Shows which employee requested the swap
- Quick accept/decline buttons
- Real-time updates of swap status

#### **AuthForm.tsx**

- Simple, clean login interface
- Email and password inputs
- Error message display
- Responsive design

#### **LoadingSpinner.tsx**

- Animated loading indicator
- Used during data fetching
- Consistent across all pages

---

## Data Models

### User

```typescript
interface User {
  id: string; // Firebase document ID
  email: string; // User's email address
  name: string; // Display name
  role: "employee" | "manager"; // User role
}
```

### Shift

```typescript
interface Shift {
  id: string; // Firebase document ID
  employeeId: string; // Reference to employee
  employeeName: string; // Employee's display name
  date: string; // ISO date string (YYYY-MM-DD)
  type: "day" | "afternoon" | "night"; // Shift type
  startTime: string; // Start time (HH:MM)
  endTime: string; // End time (HH:MM)
}
```

### SwapRequest

```typescript
interface SwapRequest {
  id: string; // Firebase document ID
  fromEmployeeId: string; // Employee requesting swap
  fromEmployeeName: string;
  toEmployeeId: string; // Employee receiving request
  toEmployeeName: string;
  shiftId: string; // Shift to be swapped
  shift: Shift; // Full shift object
  status: "pending" | "accepted" | "declined";
  createdAt: string; // ISO timestamp
}
```

### ActivityLog

```typescript
interface ActivityLog {
  id: string; // Firebase document ID
  type:
    | "shift_created"
    | "shift_updated"
    | "shift_deleted"
    | "swap_requested"
    | "swap_accepted"
    | "swap_declined";
  description: string; // Human-readable action description
  userId: string; // User who performed action
  userName: string; // User's display name
  timestamp: string; // ISO timestamp
  details?: any; // Additional metadata
}
```

### Conflict

```typescript
interface Conflict {
  id: string; // Firebase document ID
  employeeId: string; // Employee with conflict
  employeeName: string;
  date: string; // Date of conflict
  shifts: Shift[]; // Conflicting shifts
  type: "double-booking" | "overlap"; // Type of conflict
}
```

---

## Firebase Implementation

For comprehensive documentation on how the Firebase backend is implemented, including detailed explanations of the swap feature, shifts database schema, real-time listeners, and CRUD operations, see **[FIREBASE_IMPLEMENTATION.md](./FIREBASE_IMPLEMENTATION.md)**.

### Key Points

- **Swap Feature**: Complete workflow from request creation to acceptance with real-time notifications
- **Shifts Database**: Shift assignments using a consistent short ID format (lowercase employee first name)
- **Real-time Listeners**: Automatic UI updates via Firestore `onSnapshot` subscriptions
- **Employee ID Format**: Critical convention using short IDs ("john", "emma") instead of Firebase document IDs
- **CRUD Operations**: All database operations with TypeScript examples
- **Error Handling**: Validation and common issues with solutions

---

## Firebase Collections

The app uses four main Firestore collections:

### 1. **users**

Stores user account information and roles

- Document ID: auto-generated
- Fields: email, name, role

### 2. **shifts**

Stores all shift assignments

- Document ID: auto-generated
- Fields: employeeId, employeeName, date, type, startTime, endTime
- Indexed by: employeeId, date

### 3. **swapRequests**

Tracks all shift swap requests

- Document ID: auto-generated
- Fields: fromEmployeeId, toEmployeeId, shiftId, shift object, status, createdAt
- Indexed by: toEmployeeId (for employees to see requests directed at them)

### 4. **activityLogs**

Audit trail of all system actions

- Document ID: auto-generated
- Fields: type, description, userId, userName, timestamp, details
- Indexed by: timestamp (for recent activity queries)

---

## Diagnostic & Testing Tools

The app includes a comprehensive diagnostic page accessible at `/diagnostic` for testing, validation, and database management:

### Key Features

**1. Generate & Seed Shifts**

- Creates balanced shift schedules across multiple days
- Ensures fair distribution of shift types (day, afternoon, night)
- Validates constraints and prevents conflicts
- Displays summary of generated shifts

**2. Inspect Data**

- View all documents in each collection (users, shifts, swaps, logs)
- Real-time inspection of database state
- Verify data format consistency
- Check employee ID formats

**3. Test Swaps**

- Create swap requests between employees
- Accept or decline swap requests
- Verify shift ownership transfers
- Test real-time listener updates

**4. Swap Feature Test**

- End-to-end validation of swap functionality
- Checks data format consistency
- Verifies employee ID matching between shifts and swaps
- Generates detailed test report
- Identifies format mismatches before they cause issues

**5. Clean Swaps**

- Delete all swap requests to reset database
- Useful for starting fresh or fixing corrupted data
- Includes logging of deletion operation

### How to Use

1. During development, navigate to `http://localhost:8080/diagnostic`
2. Use "Generate & Seed Shifts" to initialize test data
3. Use "Inspect Data" to verify database state
4. Use "Swap Feature Test" to validate the swap system
5. Use "Clean Swaps" if database needs reset

### Purpose

The diagnostic tools are essential for:

- **Development**: Quick data setup and testing
- **Debugging**: Identify data format issues and consistency problems
- **Validation**: Ensure swap feature works end-to-end
- **Database Management**: Clean and reset collections as needed
- **Testing**: Comprehensive verification before deployment

⚠️ **Note**: The diagnostic page should only be used in development. In production, implement proper admin controls and remove direct database manipulation access.

---

## Authentication & Authorization

### Authentication Flow

1. **Login Form**: Users enter email and password
2. **Credential Validation**: Checked against test credentials in `mockData.ts`
3. **User Lookup**: Find matching user in Firestore `users` collection
4. **Role Assignment**: Load user data with role (manager/employee)
5. **Persistent State**: User state managed in React component state

### Authorization

- **Role-based Access**: Index component routes to different dashboards based on user role
- **Employee Features**: Only available on EmployeeDashboard
- **Manager Features**: Only available on ManagerDashboard
- **Data Filtering**: Firestore queries filter data based on current user's role

### Current Implementation

⚠️ **Note**: This app uses simple credential-based authentication for development. For production, implement:

- Firebase Authentication with email/password provider
- Secure password hashing
- Session management
- JWT tokens

---

## Development Guide

### Adding a New Feature

1. **Define Types**: Add new interfaces to `src/types/shift.ts`
2. **Create Firestore Service**: Add CRUD operations in `src/lib/firebaseService.ts`
3. **Build Components**: Create UI components in `src/components/`
4. **Add Page Route**: Add route to `src/App.tsx` if it's a new page
5. **Add Real-time Sync**: Set up Firebase listeners with `subscribeToXyz` functions
6. **Test**: Use test credentials to verify functionality

### Available Scripts

```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Build in development mode
npm run build:dev

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Code Style

- **TypeScript**: Strict mode enabled
- **Naming**: PascalCase for components, camelCase for functions
- **Components**: Functional components with hooks
- **State**: React hooks (useState, useEffect, useContext)
- **Styling**: Tailwind CSS classes with shadcn/ui components

### Styling with Tailwind CSS

The project uses Tailwind CSS with the following customizations:

- Extended color palette (primary, secondary, accent, success, warning)
- Custom animations via `tailwindcss-animate`
- Responsive breakpoints: sm, md, lg, xl, 2xl
- Dark mode support via `next-themes`

---

## Deployment

### Build for Production

```bash
npm run build
```

This creates an optimized build in the `dist/` directory.

### Deployment Options

#### **Vercel** (Recommended)

1. Connect your GitHub repository to Vercel
2. Vercel automatically detects Vite configuration
3. Set environment variables for Firebase credentials
4. Deploy with a single push

#### **Firebase Hosting**

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Initialize Firebase: `firebase init hosting`
3. Build the project: `npm run build`
4. Deploy: `firebase deploy`

#### **Other Platforms**

- **Netlify**: Connect repo, set build command to `npm run build`
- **AWS Amplify**: Similar to Vercel, connect GitHub repo
- **Traditional VPS**: Build locally and copy `dist/` folder to server

### Environment Variables

Create a `.env` file with your Firebase configuration:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

---

## Related Documentation

- **[FIREBASE_IMPLEMENTATION.md](./FIREBASE_IMPLEMENTATION.md)** - Complete Firebase architecture, schemas, and implementation details
- **[QUICK_START.md](./QUICK_START.md)** - Quick start guide for new developers
- **[NEW_FEATURES_GUIDE.md](./NEW_FEATURES_GUIDE.md)** - Documentation of newly added features

---

## Future Enhancements

Potential features for future development:

- **Conflict Detection**: Automatic detection of double-booked shifts
- **Shift Trading**: More sophisticated swap algorithm with counter-offers
- **Notifications**: Email/SMS alerts for new swap requests
- **Reporting**: Advanced analytics and shift reports
- **Shift Templates**: Pre-defined recurring shift patterns
- **Availability Calendar**: Employees mark their availability
- **Time Tracking**: Track actual vs. scheduled hours
- **Mobile App**: Native iOS/Android applications
- **Multi-team Support**: Manage multiple teams/locations
- **Shift Constraints**: Define employee-specific shift restrictions
- **Seniority Preferences**: Seniority-based shift assignment
- **Audit Reports**: Detailed audit logs with export functionality

---

## Troubleshooting

### Database Not Initializing

- Ensure Firebase project has Firestore database enabled
- Check Firebase credentials in `src/lib/firebase.ts`
- Verify Firestore rules allow read/write operations

### Real-time Updates Not Working

- Confirm Firebase listeners are properly set up
- Check browser console for Firebase errors
- Verify internet connectivity

### Build Errors

- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf dist && npm run build`
- Check TypeScript errors: `npx tsc --noEmit`

### Login Issues

- Ensure database has been seeded
- Check test credentials match those in `mockData.ts`
- Verify user exists in Firestore `users` collection

### Swap Requests Not Appearing

- Verify employee ID format is consistent (short IDs like "sarah", not Firebase IDs)
- Use diagnostic page to inspect swap request data
- Check that `toEmployeeId` in swaps matches `employeeId` in shifts
- Run "Swap Feature Test" to identify format mismatches

---

## Contributors & License

@Copyright2025

---

**Last Updated**: November 2025
