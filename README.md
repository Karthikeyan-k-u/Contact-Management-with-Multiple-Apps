# Contact Management with Multiple Apps

A modern contact management web application that brings contacts and multiple communication channels into one unified interface.

The application is designed to help users organize contacts, manage groups, track interactions, maintain follow-ups, and access communication channels such as WhatsApp, Instagram, SMS, email, calls, and messages from a single dashboard.

## Features

### Contact Management

* Add and manage contacts
* View detailed contact information
* Organize contacts efficiently
* Access individual contact details

### Communication Management

Manage and track different communication channels from one application:

* WhatsApp
* Instagram
* SMS
* Email
* Calls
* Messages

### Groups

* Create and manage contact groups
* Organize contacts based on categories
* Easily access grouped contacts

### Interaction Tracking

* Track communication history
* Manage channel-based interactions
* Maintain a centralized interaction log

### Follow-Ups

* Create follow-up activities
* Track pending follow-ups
* Manage communication reminders

### Dashboard

* Centralized overview of contact activities
* Quick access to major application sections
* Clean and responsive dashboard interface

### User Experience

* Responsive interface
* Light and dark theme support
* Toast notifications
* Form validation
* Error boundary handling
* Client-side routing
* Modern component-based architecture

## Tech Stack

| Technology      | Purpose                               |
| --------------- | ------------------------------------- |
| React 19        | Frontend UI                           |
| TypeScript      | Type-safe development                 |
| Vite            | Development and build tool            |
| React Router    | Application routing                   |
| Tailwind CSS    | Styling and responsive UI             |
| React Query     | Client-side data and query management |
| React Hook Form | Form management                       |
| Zod             | Schema validation                     |
| Lucide React    | UI icons                              |
| PostCSS         | CSS processing                        |

The repository's package configuration confirms the React, TypeScript, Vite, Tailwind CSS, React Router, React Query, React Hook Form, Zod, and Lucide React stack.

## Application Structure

```text
Contact-Management-with-Multiple-Apps/
│
├── public/
│
├── src/
│   ├── components/
│   │   ├── common/
│   │   ├── layout/
│   │   └── ui/
│   │
│   ├── context/
│   │   ├── ThemeContext
│   │   └── UserProfileContext
│   │
│   ├── pages/
│   │   ├── DashboardPage
│   │   ├── ContactsPage
│   │   ├── ContactDetailPage
│   │   ├── GroupsPage
│   │   ├── InteractionsPage
│   │   ├── ChannelLogPage
│   │   ├── FollowUpsPage
│   │   └── SettingsPage
│   │
│   ├── App.tsx
│   └── ...
│
├── .env.example
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── README.md
```

The current application routing includes dedicated pages for contacts, groups, messages, calls, emails, SMS, WhatsApp, Instagram, follow-ups, and settings.

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Karthikeyan-k-u/Contact-Management-with-Multiple-Apps.git
```

### 2. Navigate to the Project

```bash
cd Contact-Management-with-Multiple-Apps
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

If the project requires environment-specific configuration, create a `.env` file using the provided example:

```bash
cp .env.example .env
```

Update the required values inside `.env`.

### 5. Start the Development Server

```bash
npm run dev
```

The Vite development server will provide the local URL in the terminal.

## Available Scripts

### Development

```bash
npm run dev
```

Starts the development server.

### Production Build

```bash
npm run build
```

Creates an optimized production build.

### Preview

```bash
npm run preview
```

Runs the production build locally for preview.

### Type Checking

```bash
npm run typecheck
```

Checks the project for TypeScript errors.

These scripts are defined in the repository's `package.json`.

## Application Routes

| Route           | Purpose                |
| --------------- | ---------------------- |
| `/`             | Dashboard              |
| `/contacts`     | Contact management     |
| `/contacts/:id` | Contact details        |
| `/groups`       | Contact groups         |
| `/messages`     | Messages               |
| `/calls`        | Call history           |
| `/emails`       | Email interactions     |
| `/sms`          | SMS interactions       |
| `/whatsapp`     | WhatsApp interactions  |
| `/instagram`    | Instagram interactions |
| `/follow-ups`   | Follow-up management   |
| `/settings`     | Application settings   |

## Architecture

The application follows a component-based React architecture.

Key architectural concepts include:

* Reusable React components
* Context-based state management
* Route-based page organization
* React Query for query management
* React Hook Form for form handling
* Zod for validation
* Error boundaries for application-level error handling
* Theme provider for appearance management
* Toast provider for user feedback

The main application component combines routing, providers, error handling, theme management, user profile management, and query management.

## Design Goals

The project focuses on:

* Centralized contact management
* Multiple communication channels in one interface
* Clean and responsive UI
* Easy navigation
* Organized interaction tracking
* Reusable component architecture
* Type-safe development
* Maintainable frontend structure

## Future Improvements

Possible future enhancements include:

* Backend API integration
* Cloud database synchronization
* User authentication
* Real-time messaging
* Contact import and export
* Advanced search and filtering
* Notification system
* Calendar integration
* Automated follow-up reminders
* Communication analytics
* Mobile application support

## Screenshots

Add application screenshots here to showcase the dashboard, contact management, communication channels, groups, and follow-up pages.

Example:

```markdown
![Dashboard](./public/screenshots/dashboard.png)
![Contacts](./public/screenshots/contacts.png)
![Communication](./public/screenshots/communication.png)
```

## Project Purpose

This project was developed as a practical frontend application to demonstrate how multiple communication and contact-management features can be organized within a single modern web interface.

It also demonstrates the use of React, TypeScript, Vite, Tailwind CSS, routing, state management, form validation, and reusable UI components in a real-world style application.

## Author

**Karthikeyan K U**

Computer Science and Engineering Student
Frontend Developer | UI/UX Designer

### GitHub

https://github.com/Karthikeyan-k-u

## License

This project is available for educational and personal development purposes.