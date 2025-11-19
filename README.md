# TexMind Editor

TexMind Editor is a modern, high-performance Markdown and LaTeX editor built with React and Vite. It provides a seamless split-view writing experience designed for students, researchers, and developers who need to draft technical documents with real-time mathematical rendering.

## Features

- **Real-time Preview**: Instant rendering of Markdown text and LaTeX equations via KaTeX.
- **Split-View Interface**: Write on the left, see the result on the right.
- **LaTeX Support**: Full support for block math (`$$...$$`, `\[...\]`) and inline math (`$...$`, `\(...\)`).
- **Syntax Highlighting**: The editor highlights Markdown syntax and LaTeX commands for better readability using PrismJS.
- **Live Error Detection**: A sophisticated Heads-Up Display (HUD) monitors your LaTeX syntax in real-time, alerting you to errors (like unclosed braces) or warnings without interrupting your workflow.
- **Synchronized Scrolling**: Keeps the editor and preview panes aligned as you scroll through long documents.
- **Local Persistence**: Your work is automatically saved to your browser's local storage, ensuring that your text is cached and restored exactly where you left off even if you close and reopen the website.
- **Responsive Design**: The layout adapts automatically, offering a tabbed interface on mobile devices and a split view on desktops.

## Tech Stack

- **Frontend**: React 19, TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Rendering**: 
  - `react-markdown` for Markdown parsing
  - `remark-math` & `rehype-katex` for Math processing
  - `katex` for fast math rendering
- **Editor**: `react-simple-code-editor` with custom grammar

## Installation & Running

Follow these steps to run the project locally.

### Prerequisites
- Node.js (v18+ recommended)
- npm

### Setup

1. **Install Dependencies**
   Navigate to the project folder and run:
   ```bash
   npm install
   ```

2. **Run Development Server**
   Start the local server:
   ```bash
   npm run dev
   ```

3. **Open in Browser**
   Navigate to `http://localhost:3000` in your web browser.

## Usage Guide

### Writing Math
TexMind supports standard LaTeX delimiters:

**Inline Math:**
```latex
The quadratic formula is $-b \pm \sqrt{b^2 - 4ac} \over 2a$.
```

**Block Math:**
```latex
$$
\sum_{i=1}^{n} i = \frac{n(n+1)}{2}
$$
```

### Validation HUD
If you make a syntax error (e.g., `\frac{1}{2` without the closing brace), a floating panel will appear in the bottom-right corner of the editor. 
- Click the panel to expand it and see the error details.
- Click any issue in the list to jump directly to that line in the editor.

### Interface Controls
- **View Modes**: Use the buttons in the header (on mobile) to switch between Edit and Preview. On desktop, the split view is active by default.
- **Sync Scroll**: Toggle the "Sync" button in the header to lock or unlock the scroll position between the editor and preview panes.

## Project Structure

- **`components/`**: Contains UI elements like `Editor`, `Preview`, `Header`, and the Validation HUD.
- **`services/`**: Contains logic for LaTeX validation.
- **`App.tsx`**: Handles the main layout, state management (split view, scroll sync), and local storage persistence.
