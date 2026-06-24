```markdown
# myuno Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches the core development patterns and conventions used in the `myuno` TypeScript codebase. You'll learn how to structure files, write imports and exports, follow commit conventions, and organize tests. This guide also provides commands and step-by-step workflows to streamline your development process.

## Coding Conventions

### File Naming
- Use **PascalCase** for file names.
  - Example: `UserProfile.ts`, `GameEngine.ts`

### Import Style
- Use **alias imports** to reference modules.
  - Example:
    ```typescript
    import { UserService } from 'services/UserService';
    ```

### Export Style
- Use **mixed exports**: both named and default exports are present.
  - Example:
    ```typescript
    // Named export
    export function calculateScore() { ... }

    // Default export
    export default class GameEngine { ... }
    ```

### Commit Messages
- Use **conventional commits** with the `feat` prefix for new features.
  - Example:
    ```
    feat: add user authentication to GameEngine
    ```

## Workflows

### Feature Development
**Trigger:** When adding a new feature  
**Command:** `/feature-development`

1. Create a new file using PascalCase for the feature.
2. Implement the feature using TypeScript.
3. Use alias imports for dependencies.
4. Export your functions/classes using named or default exports as appropriate.
5. Write or update corresponding test files (`*.test.*`).
6. Commit your changes with a `feat:` prefix and a descriptive message.

### Testing
**Trigger:** When validating code changes  
**Command:** `/run-tests`

1. Locate or create test files matching the `*.test.*` pattern.
2. Write test cases for new or updated code.
3. Run the test suite using your preferred test runner.
4. Ensure all tests pass before merging changes.

## Testing Patterns

- Test files follow the `*.test.*` naming convention (e.g., `UserService.test.ts`).
- The specific testing framework is not detected; use your preferred TypeScript-compatible test runner (e.g., Jest, Mocha).
- Example test file:
  ```typescript
  import { calculateScore } from './GameEngine';

  test('calculates score correctly', () => {
    expect(calculateScore([1, 2, 3])).toBe(6);
  });
  ```

## Commands
| Command              | Purpose                                  |
|----------------------|------------------------------------------|
| /feature-development | Guide for adding a new feature           |
| /run-tests           | Steps for running and validating tests   |
```