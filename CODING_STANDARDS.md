# Project Coding Standards & Guidelines

This document outlines the mandatory development standards and conventions for the project codebase.

---

### 1. English Function Comments (JSDoc format)
- Every function, hook, and major utility must include concise English comments describing:
  - **Purpose**: A short 1-line description of what the function does.
  - **@param (Input)**: Name, type, and brief explanation of inputs.
  - **@returns (Output)**: Return type and what is returned.
- Example:
  ```javascript
  /**
   * Filters a list of movies based on specified category identifier.
   * @param {Array<Object>} movies - Array of movie objects.
   * @param {string} categoryId - Identifier of category (e.g. 'series', 'single').
   * @returns {Array<Object>} Filtered movie list.
   */
  export const filterMoviesByCategory = (movies, categoryId) => { ... };
  ```

---

### 2. Single Responsibility & Function Decomposition
- Do not write massive monolithic functions or chain endless expressions from top to bottom.
- Split UI rendering and business logic into small, testable, and reusable helper functions.
- Keep components focused purely on presentation; delegate data transformation to helper functions.

---

### 3. Config Over Hardcoding (Prioritize Environment Variables)
- Never hardcode API endpoints, fallback text, pagination limits, or URLs directly in UI code.
- Centralize all configurations in `src/config/` and reference environment variables via `process.env.NEXT_PUBLIC_*`.
- Provide sensible defaults through configuration objects instead of in-line strings.

---

### 4. Zero Code Smells & Zero Dead Code
- Avoid N+1 API fetching anti-patterns (e.g., looping `fetch` requests inside `.map()`).
- Remove unused imports, dead variables, and legacy commented-out code.
- Prevent infinite re-renders by properly declaring dependencies in `useEffect`.

---

### 5. Atomic & Frequent Commits
- Commit code sequentially and incrementally. Do not batch everything into a single massive commit at the end.
- Use Conventional Commits with concise, clear English messages:
  - `feat(...)`: New feature or UI section
  - `refactor(...)`: Code restructuring without behavioral regression
  - `fix(...)`: Bug fix
  - `docs(...)`: Documentation updates
