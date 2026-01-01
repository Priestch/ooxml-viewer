# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Open Office XML Viewer is a Tauri + Vue 3 desktop application that allows users to view, edit, and export Microsoft Office documents (.docx, .xlsx, .pptx). The application also works as a web application using browser APIs. It displays the internal XML structure of Office Open XML files in a navigable tree view with a tabbed interface for editing multiple parts simultaneously.

**Demo**: https://priestch.github.io/ooxml-viewer/

## Common Commands

```bash
# Development
pnpm dev              # Start Vite dev server (web mode)
pnpm tauri dev        # Start Tauri desktop app with hot reload

# Building
pnpm build            # Build web version to dist/
pnpm tauri build      # Build desktop binaries for current platform
pnpm serve            # Preview production build locally

# Code Quality
pnpm fmt              # Format code with Prettier
```

**Important**: Use `pnpm` as the package manager (not npm or yarn).

## Architecture

### Platform Abstraction

The application runs in two modes:

- **Desktop (Tauri)**: Uses native file system APIs via `@tauri-apps/api` (accessed through `src/service.js`)
- **Web**: Uses browser File API with fallback implementations

The mode is detected via the `window.__TAURI__` flag. When running in web mode, the `fake-tauri-apps.js` file provides stub implementations of Tauri APIs.

### Application Flow

1. **File Loading** (`App.vue` → `Home.vue`):

   - Desktop: Listens for Tauri `tauri://file-open` events or file dialog
   - Web: Uses file input element
   - Recent files are stored in localStorage (desktop) or sessionStorage (web)

2. **File Processing** (`service.js`):

   - Files are read as `ArrayBuffer`
   - Parsed using `openxml.OpenXmlPackage` from the `openxml` library
   - Package parts are organized into a tree structure via `ooxml-utils.js`

3. **Document View** (`Document.vue`):

   - Displays package parts as a navigable tree (left panel)
   - Tabbed interface for viewing/editing multiple parts (right panel)
   - Tabs show modified status (red dot badge) when content is edited

4. **Part Rendering** (`PackagePart.vue`):

   - Routes to appropriate component based on content type
   - XML parts: `Editor.vue` (CodeMirror 6 with XML language support)
   - Image parts: `ImageViewer.vue`
   - SVG parts: `ImageViewer.vue` with inline SVG rendering

5. **Editing & Export**:
   - CodeMirror provides XML syntax highlighting, search, and formatting
   - Changes are tracked per-tab
   - Export rebuilds the Office file with modified parts

### Key Components

**Views**:

- `src/views/Home.vue` - Welcome modal with file selection
- `src/views/Document.vue` - Main document viewer with tree and tabs

**Components**:

- `src/components/Editor.vue` - CodeMirror 6 XML editor with search, formatting, and One Dark theme
- `src/components/ImageViewer.vue` - Image viewer with base64/src URL support
- `src/components/PackagePart.vue` - Dynamic component router for different part types

**Services & Utilities**:

- `src/service.js` - Platform-specific file operations (Tauri vs web)
- `src/ooxml-utils.js` - Tree structure generation for package parts
- `src/utils.js` - XML formatting with vkbeautify
- `src/hooks/useRecentFiles.js` - Recent file storage management
- `src/hooks/useFileUtils.js` - File operation utilities (path parsing, content detection)

### Technology Stack

- **Frontend**: Vue 3 (Composition API with `<script setup>`)
- **Routing**: Vue Router 4 (routes: `/` for Home, `/doc` for Document)
- **UI Library**: Naive UI components
- **Code Editor**: CodeMirror 6 with XML language support
- **Build Tool**: Vite 4
- **Desktop**: Tauri 1.x (configured in `src-tauri/tauri.conf.json`)
- **Styling**: SCSS with scoped styles
- **Icons**: `@vicons/carbon`, `@vicons/material`, `@vicons/antd`

## Important Patterns

### Vue 3 Patterns

- Use `<script setup>` syntax consistently
- Reactive state with `ref()` and `computed()`
- Lifecycle hooks: `onMounted`, `watch`, `watchEffect`
- Props are down, events are up (standard Vue pattern)

### File Handling

- Office files are ZIP archives containing XML and media parts
- Use `ArrayBuffer` for binary file data
- Create `URL.createObjectURL()` for images, remember to `revokeObjectURL()` on cleanup
- Content type detection: check part path or content for XML vs images

### Platform Detection

```javascript
// Check if running in Tauri desktop mode
const isTauri = window.__TAURI__ !== undefined;
```

### Storage Strategy

- Desktop: `localStorage` for persistent recent files
- Web: `sessionStorage` for recent files (cleared on browser close)
- Both use `useRecentFiles` composable

### Code Style

- Prettier configured with 99 character line width
- SCSS over CSS for component styling
- Use `<style scoped>` in Vue components

### Tauri Configuration

- Dev server runs on `http://127.0.0.1:1420`
- Built output must be in `dist/` directory
- Window defaults to 800x600, resizable
- CSP allows blob:, data:, filesystem:, ws:, wss:, http:, https:, tauri: sources
- File system scope: `$HOME/**`

## Testing

No test framework is currently configured. When adding tests, consider Vitest for unit testing and Playwright for E2E testing.

## Building for Release

The `.github/workflows/publish.yml` workflow handles multi-platform builds:

- Creates macOS, Linux, and Windows binaries
- Releases to GitHub Releases

The `.github/workflows/doc.yaml` workflow deploys to GitHub Pages (404 branch).
