# Outreach Email Generator: Implementation Plan

This document outlines the architecture, logic, and UI/UX strategy for the **Outreach Email Generator**, a specialized internal tool for generating cold email sequences for pool companies.

## 1. Project Overview
The "Outreach Email Generator" is a template-driven tool designed to streamline the creation of a 4-email outreach sequence. It uses structured inputs to produce consistent, professional, and low-pressure German emails, avoiding AI-style "freewriting" in favor of deterministic logic.

### Core Value Proposition
- **Consistency**: High-quality, professional German emails.
- **Speed**: Rapid generation based on specific "issue types."
- **Convenience**: One-click copy, export options, and state persistence.

---

## 2. Technical Stack
- **Core**: Vite + React + TypeScript
- **Styling**: Vanilla CSS (Modern, premium feel)
- **State Management**: React Hooks + LocalStorage sync
- **Architecture**: Logic-first, separating template definitions from UI components.

---

## 3. UI/UX Strategy
A **premium, clean, and modern** aesthetic is mandatory.

- **Layout**: Clear card-and-section based design.
- **Aesthetics**: Sleek typography (Inter/Outfit), subtle gradients, deep shadows, and professional spacing.
- **Feedback**: Immediate preview row above outputs reflecting current input state.
- **Interactions**: Smooth transitions, hover effects on CTA buttons, and clear "Copied!" feedback.
- **Persistence**: All inputs are saved to `localStorage` to prevent data loss on refresh.

---

## 4. Logic & Content Modules

### A. Greeting Logic Matrix
| Sequence Step | Formal | Informal + Contact Name | Informal (No Name) |
| :--- | :--- | :--- | :--- |
| **Outreach** | Sehr geehrte Damen und Herren, | Hi [Name], | Hallo, |
| **Follow-up 1** | Hallo, | Hi [Name], | Hallo, |
| **Follow-up 2** | (Short direct opener) | (Short direct opener) | (Short direct opener) |
| **Follow-up 3** | (N/A) | Hallo [Name], | Hallo, |

### B. Issue-Type Modules
Each "Issue Type" (e.g., `missing_pool_calculator`, `broken_link`) will consist of three specific text segments:
1. **Observation**: What was noticed on the website.
2. **Consequence**: Why this is a problem for business conversion.
3. **Preview Line**: A teaser of a proposed solution or "sketch."

### C. Sequence Templates
- **Outreach**: Greeting + Observation + Consequence + Preview + CTA + Sender.
- **Follow-up 1**: Visitor intent focus + Preview offer.
- **Follow-up 2**: Short check-in + Specific issue-based reminder.
- **Follow-up 3**: "Closing the loop" + Last call for the example.

---

## 5. Implementation Phases

### Phase 1: Setup & Project Initialization
- [x] Initialize Vite/React project with TypeScript.
- [x] Establish directory structure (`components/`, `logic/`, `styles/`).
- [x] Define global CSS (Tokens for colors, spacing, and shadows).

### Phase 2: Logic Engine Development
- [x] Define `IssueType` and `Template` interface.
- [x] Implement greeting and closing logic functions.
- [x] Build the core generator function that maps inputs to 4-step sequences.

### Phase 3: Form & Persistence
- [x] Build the main form component with all 8 specified inputs.
- [x] Implement `useLocalStorage` hook for state persistence.
- [x] Add the "Example Data" pre-fill functionality.

### Phase 4: Sequence Rendering & UI
- [x] Create the "Preview Row" summarizing current settings.
- [x] Build the "Email Card" component with:
    - [x] Editable `textarea`.
    - [x] Real-time character count.
    - [x] "Copy" button.
- [x] Implement "Regenerate" to reset manual edits.

### Phase 5: Export & Final Polish
- [x] Build the "Combined Sequence" view at the bottom.
- [x] Implement "Export as TXT" and "Export as JSON" utilities.
- [x] Final visual review: typography, shadows, and responsiveness.

---

## 6. Directory Structure
```text
/src
  /components
    EmailCard.tsx        # Individual email result
    FormSection.tsx      # Sidebar/Top form for inputs
    PreviewBar.tsx       # Summary row
    Layout.tsx           # Global app shell
  /logic
    templates.ts         # Email templates & Issue modules
    sequenceGenerator.ts  # Core generation functions
    exportUtils.ts       # TXT/JSON generation
  /styles
    globals.css          # Design system & tokens
    App.css              # Main layout styles
  types.ts               # Shared TypeScript interfaces
  hooks.ts               # useLocalStorage, etc.
```

## 7. Immediate Next Steps
1.  Initialize the project using `npx create-vite@latest`.
2.  Apply the base design system in `globals.css`.
3.  Define the structured template logic in `src/logic/templates.ts`.
