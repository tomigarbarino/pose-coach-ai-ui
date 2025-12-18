# PoseCoach AI UI

_Automatically synced with your [v0.app](https://v0.app) deployments_

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/tomigarbarinos-projects/v0-pose-coach-ai-ui)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/crjAEBZpSTp)
[![Tests](https://img.shields.io/badge/tests-passing-brightgreen?style=for-the-badge)](https://github.com)

## Overview

AI-powered pose coach application with real-time pose detection using TensorFlow.js and PoseNet. Features advanced architecture with Singleton pattern, Strategy pattern for pose analysis, and comprehensive test coverage.

### Key Features

- 📸 Real-time pose detection with camera
- 🎯 Multiple bodybuilding poses support (Front Double Bicep, Lat Spread, Side Chest, etc.)
- 📊 Detailed feedback and scoring system
- 📈 Progress tracking and history
- 🌐 Multi-language support (EN/ES)
- 🎨 Modern UI with Tailwind CSS and Radix UI
- ✅ **Full TDD coverage with Jest + React Testing Library**

## 🧪 Testing

This project follows **Test-Driven Development (TDD)** best practices.

### Test Scripts

```bash
# Run all tests
pnpm test

# Run tests in watch mode (for development)
pnpm test:watch

# Generate coverage report
pnpm test:coverage
```

### Test Coverage

- ✅ **Services**: PoseDetectorService (Singleton pattern)
- ✅ **Utils**: Geometry calculations, Canvas drawing
- ✅ **Analysis**: Pose-specific strategies (Front Double Bicep)
- ✅ **Storage**: LocalStorage utilities

### Test Results

```
Test Suites: 5 passed, 5 total
Tests:       35 passed, 35 total
Snapshots:   0 total
```

📖 **[Complete Testing Guide](README.TEST.md)**

## 🚀 Getting Started

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Run linter
pnpm lint

# Run tests
pnpm test
```

## 🏗️ Architecture

The project follows clean architecture principles with clear separation of concerns:

- **Services**: Singleton pattern for PoseNet model management
- **Utils**: Pure functions for geometry and canvas operations
- **Strategies**: Strategy pattern for pose-specific analysis
- **Components**: Reusable React components with TypeScript

📖 **[Architecture Documentation](ARCHITECTURE.md)**

## Deployment

Your project is live at:

**[https://vercel.com/tomigarbarinos-projects/v0-pose-coach-ai-ui](https://vercel.com/tomigarbarinos-projects/v0-pose-coach-ai-ui)**

## Build your app

Continue building your app on:

**[https://v0.app/chat/crjAEBZpSTp](https://v0.app/chat/crjAEBZpSTp)**

## 📚 Documentation

- [Testing Guide](README.TEST.md) - Complete testing documentation
- [Architecture](ARCHITECTURE.md) - System design and patterns

## 🛠️ Tech Stack

- **Framework**: Next.js 16 with Turbopack
- **Language**: TypeScript 5.9
- **UI**: React 19, Tailwind CSS, Radix UI
- **ML**: TensorFlow.js 4.22, PoseNet 2.2
- **Testing**: Jest 29, React Testing Library
- **Package Manager**: pnpm

4. Vercel deploys the latest version from this repository
