# AGENTS Instructions

## Project
Small Wins Journal (Daily Achievement Tracker) is a React Native (Expo) app that helps users record and reflect on small daily achievements. The app promotes positive productivity and mental wellness through simple daily journaling.

## Core Requirements
- Use Expo Router with file-based routing (the `app` directory).
- Provide these screens:
  - Splash: App name "Small Wins Journal" and subtitle "Celebrate Your Daily Progress".
  - Login: Name input and a Continue button.
  - Dashboard: Greeting, input to add a win, Add Win button, and today's total wins.
  - Wins List: Use `FlatList` to show all recorded wins with description and date.
  - Profile: Show stats (name, total wins, wins this week, most productive day).
- Use `useState` and `useEffect` where appropriate.
- Use `FlatList` for the wins list.

## Data Shape
A win item should follow this structure:
- `id: string`
- `text: string`
- `date: string` (example: "March 16, 2026")

## UX Goals
- Simple, clean, student-friendly UI.
- Positive, motivational tone.
- Focus on "small wins" rather than big goals.

## Guardrails
- Keep dependencies minimal unless explicitly requested.
- Prefer local state and simple data flow for midterm scope.
- Preserve Expo Router conventions and the existing folder structure.
