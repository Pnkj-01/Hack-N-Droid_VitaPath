# SafeCity App: Flow and Features

## Introduction
SafeCity is a safety-focused navigation application designed to help users reach their destination safely while providing real-time safety scores, emergency alerts, and intuitive navigation features.

## App Overview

The application consists of these core functionalities:

- User Authentication
- Safety Score Display
- Navigation and Route Tracking
- Emergency Mode Activation
- Menu and User Interaction

## Application Flow

### 1. User Authentication

#### Initial Screen
- App starts with a login screen
- Users provide email and password
- Successful login leads to main dashboard

#### Technical Details
- Uses `LoginForm` component with state management
- State: `isAuthenticated`

### 2. Main Dashboard

The main interface includes:

- **Top Bar**
  - Menu button
  - Emergency button
- **Map Area**
  - Current location display
- **Navigation Interface**
  - Safety score
  - Route progress
  - Navigation controls

#### Components
- `MenuSidebar`
- `EmergencyOverlay`
- `Navigation Interface`

### 3. Safety Score System

- Real-time safety assessments via `calculateSafetyScore()`
- Score Range: 80-100%
- State: `safetyScore`

### 4. Navigation and Route Tracking

#### Features
- Start Navigation button initiates tracking
- Progress tracking (0-100%)
- Real-time map updates

#### Technical Implementation
- Progress Bar for navigation status
- Map Display for route visualization
- States: `isTracking`, `routeProgress`
- Progress updates via `useEffect` hook

### 5. Emergency Mode

#### Activation
- Triggered via red alert button
- Notifies emergency services
- Displays alert overlay

#### Deactivation
- Via Deactivate button
- State: `emergencyMode`
- Component: `EmergencyOverlay`

### 6. Menu Sidebar

#### Features
- Toggle menu visibility
- Display user information
- Show current safety score
- Logout functionality
- State: `showMenu`

## Component Architecture

### Core Components

1. `LoginForm`
   - User authentication
   - Login form fields

2. `MenuSidebar`
   - Navigation options
   - Logout functionality

3. `EmergencyOverlay`
   - Emergency activation UI
   - Alert display

4. `Navigation Interface`
   - Route progress
   - Navigation controls

5. `Map Area`
   - Map visualization
   - Location details

## State Management

| State | Description |
|-------|-------------|
| `isAuthenticated` | User login status |
| `showMenu` | Menu visibility |
| `emergencyMode` | Emergency status |
| `isTracking` | Navigation status |
| `routeProgress` | Route completion % |
| `safetyScore` | Current safety rating |

## Planned Enhancements

1. Map API integration
2. Persistent authentication
3. Enhanced safety algorithms
4. Push notification system

## Development Guidelines

- Follow component architecture strictly
- Maintain state management patterns
- Prioritize safety features
- Ensure real-time updates

