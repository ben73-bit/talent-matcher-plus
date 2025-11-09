# AI Rules for TalentHub Application

This document outlines the core technologies used in the TalentHub application and provides clear guidelines for using specific libraries and frameworks. Adhering to these rules ensures consistency, maintainability, and optimal performance.

## Tech Stack Overview

The TalentHub application is built using a modern web development stack, focusing on performance, developer experience, and scalability.

*   **React**: A declarative, component-based JavaScript library for building user interfaces.
*   **TypeScript**: A superset of JavaScript that adds static typing, enhancing code quality and developer productivity.
*   **Vite**: A fast build tool that provides an instant development server and optimized build process.
*   **Tailwind CSS**: A utility-first CSS framework for rapidly building custom designs directly in your markup.
*   **shadcn/ui**: A collection of re-usable components built with Radix UI and Tailwind CSS, providing a consistent and accessible UI.
*   **React Router DOM**: A library for declarative routing in React applications.
*   **Supabase**: An open-source Firebase alternative providing authentication, a PostgreSQL database, and storage solutions.
*   **Tanstack Query (React Query)**: A powerful library for managing, caching, and synchronizing server state in React.
*   **Framer Motion**: A production-ready motion library for React, enabling fluid animations and gestures.
*   **Lucide React**: A collection of beautiful and customizable open-source icons.
*   **React Hook Form & Zod**: Libraries for efficient form management and schema-based validation.
*   **Sonner**: A modern toast component for displaying notifications.
*   **React Easy Crop**: A component for cropping images with ease.
*   **Date-fns**: A comprehensive utility library for date manipulation.

## Library Usage Rules

To maintain a consistent and efficient codebase, please follow these guidelines when developing new features or modifying existing ones:

*   **UI Components**:
    *   **Always** prioritize `shadcn/ui` components for all UI elements.
    *   If a specific `shadcn/ui` component is not available or requires significant deviation from its intended design, create a **new, custom component** in `src/components/`.
    *   **Never modify** the files within `src/components/ui/` directly.
*   **Styling**:
    *   **Exclusively use Tailwind CSS** for all styling. Apply utility classes directly in your JSX.
    *   Avoid inline styles or separate CSS files, except for global styles defined in `src/index.css`.
*   **State Management**:
    *   For local component state, use React's built-in `useState` and `useReducer` hooks.
    *   For global asynchronous data fetching, caching, and synchronization with the server, use **Tanstack Query (React Query)**.
*   **Routing**:
    *   Use **React Router DOM** for all client-side navigation.
    *   All main application routes should be defined within `src/App.tsx`.
*   **Authentication & Database**:
    *   All authentication, database interactions (CRUD operations), and file storage must be handled using the **Supabase client** configured in `src/integrations/supabase/client.ts`.
*   **Icons**:
    *   Use icons from the **lucide-react** library.
*   **Form Handling**:
    *   Implement forms using **react-hook-form** for state management and validation.
    *   For schema validation, integrate **Zod** with `react-hook-form`.
*   **Animations**:
    *   Utilize **Framer Motion** for all animations, transitions, and interactive gestures.
*   **Toasts/Notifications**:
    *   For ephemeral, non-blocking notifications (e.g., "Item saved successfully"), use **Sonner**.
    *   For more persistent notifications that might require user interaction or display more complex content, use the `shadcn/ui/toast` system.
*   **Image Cropping**:
    *   For any image cropping functionality, use the **react-easy-crop** component.
*   **Date Manipulation**:
    *   For formatting, parsing, and manipulating dates, use **date-fns**.