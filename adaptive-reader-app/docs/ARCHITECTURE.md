# Architectural Overview & File Structure Documentation

This document maintains a clear record of our application structure, specifically detailing the purpose and responsibility of each directory and file.

## 📂 src/app/
**Purpose:** App-level configuration and initialization wrappers.
- `App.tsx`: The main root component of the application, used to load top-level logic.
- `routes.tsx`: Contains the navigation structure and router definitions (e.g., using React Navigation or Expo Router).
- `providers.tsx`: Wraps the application in necessary context providers (themes, global state, telemetry, settings).

## 📂 src/components/
**Purpose:** Reusable, stateless or semi-stateful UI components.

### Reader/
- `ReaderView.tsx`: The main orchestrator for the reading interface. Connects the document to the adaptive text renderer.
- `Paragraph.tsx`: Represents a single block of text, managing local sentence rendering.
- `AdaptiveText.tsx`: Computes font sizes, line heights, and spacing dynamically based on the adaptation engine.
- `ScrollIndicator.tsx`: Visual feedback indicating reading progress based on scroll velocity and position.

### UI/
- `FadeContainer.tsx`: Provides smooth visual transitions for elements entering or leaving the screen.
- `MinimalNavbar.tsx`: Unobtrusive navigation bar that hides during reading to minimize distractions.
- `UploadDropzone.tsx`: Interface for users to upload new documents (e.g., PDFs, EPUBs, text files).

### Review/
- `ConceptGraph.tsx`: Visualizes relationships between concepts extracted from the text.
- `ReviewSheet.tsx`: A modal or bottom sheet summarizing key takeaways after a reading session.

## 📂 src/hooks/
**Purpose:** Custom React hooks that encapsulate core presentation logic and bridge the components to the engines.
- `useTelemetry.ts`: Captures user interactions (scrolling, taps, pauses) to feed into the TelemetryEngine.
- `useScrollVelocity.ts`: Specifically calculates how fast a user is scrolling to determine reading speed.
- `useReadingSession.ts`: Manages the lifecycle of a reading session (start, pause, resume, finish).
- `useAdaptation.ts`: Subscribes to the AdaptationEngine to trigger UI re-renders when text layout needs adjustment.
- `useEyeStrain.ts`: Monitors session duration and scrolling patterns to recommend breaks and reduce visual fatigue.

## 📂 src/engines/
**Purpose:** Core system logic that runs independently of React UI components. This is the "brain" of the app.
- `telemetryEngine.ts`: Processes raw event data from `useTelemetry` to derive user behavior metrics.
- `adaptationEngine.ts`: Takes telemetry data and decides *how* text should change (e.g., increase spacing if reading slows).
- `persistenceEngine.ts`: Handles offline storage, caching documents, and syncing session data to a remote server.
- `cognateEngine.ts`: Natural language processing logic that identifies concepts, keywords, and text complexity.
- `documentParser.ts`: Converts uploaded files (EPUB, PDF, TXT) into a standardized internal JSON document format for the reader.

## 📂 src/context/
**Purpose:** Global React Contexts for state that must be accessed deeply within the component tree.
- `ReaderContext.tsx`: Holds the current active Document, current paragraph, and progression state.
- `TelemetryContext.tsx`: Provides a global dispatcher for interaction events.
- `SettingsContext.tsx`: User preferences (default themes, baseline font sizes, accessibility toggles).

## 📂 src/store/
**Purpose:** Centralized state management for complex, rapidly changing state (e.g., using Zustand or Redux).
- `readerStore.ts`: A Zustand store for real-time reader state, optimizing re-renders better than Context for high-frequency updates (like scroll positions).

## 📂 src/types/
**Purpose:** TypeScript types and interfaces sharing definitions across the application.
- `telemetry.types.ts`: Typings for user events, sessions, and metrics.
- `reader.types.ts`: Typings for documents, paragraphs, and chapters.
- `adaptation.types.ts`: Typings for layout parameters, visual adjustments, and thresholds.

## 📂 src/utils/
**Purpose:** Pure, stateless helper functions.
- `debounce.ts`: Delays function execution until after a specified interval has elapsed since the last call.
- `throttle.ts`: Ensures a function is called at most once in a specified time period (vital for scroll events).
- `textUtils.ts`: String manipulation helpers (word counting, sentence splitting).

## 📂 src/styles/
**Purpose:** Global styles and variables (especially important if using Tailwind or custom CSS, though less common in pure Native).
- `globals.css`: Base styles, CSS reset (for web targets), and root variables.
- `reader.css`: Specific typographic classes applied to the reader components.

## 📂 src/assets/
- `fonts/`: Directory for custom typefaces crucial for the adaptive reading experience.

## 📂 src/pages/ (or Screens)
**Purpose:** Top-level route components that assemble distinct workflows.
- `Home.tsx`: Dashboard showing recent documents, reading statistics.
- `ReaderPage.tsx`: The immersive reading mode assembling the reader components and hooks.
- `ReviewPage.tsx`: Post-reading interface summarizing the document using the review components.

## 🛠 Project Root
- `main.tsx` (or `index.ts` for Expo App entry): Bootstraps the React root and injects the App provider.
- `package.json`: Dependency list and scripts.
- `tsconfig.json`: TypeScript compiler rules.
- `vite.config.ts`: (If targeting web) Vite compiler/bundler settings.
