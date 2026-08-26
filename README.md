# Smart Job Application Tracker

## Overview
Smart Job Application Tracker is a responsive, web-based productivity dashboard designed to help job seekers track and manage their job applications and interview pipeline efficiently. The application is built using standard HTML5, CSS3, and Vanilla JavaScript, requiring zero external dependencies or frameworks.

## Features
- **Dashboard Statistics**: Real-time counter cards showing Total Applications, Applied, Interview, Selected, and Rejected metrics calculated from the full application dataset.
- **Add Job Application**: Intuitive form to log new job details including company, role, location, salary, date, status, job URL, and notes.
- **Edit Application**: Seamlessly populates existing job data into the form to update details in-place without creating duplicates.
- **Delete Application**: Prompts for confirmation before removing job applications from state and storage.
- **Search**: Instant case-insensitive search across company name, job role, and location as you type.
- **Status Filtering**: Filter application cards by status (`Applied`, `Interview`, `Selected`, `Rejected`, or `All`).
- **Combined Search & Filtering**: Simultaneously search keywords while filtering by specific application status.
- **Application Cards**: Clean dynamic cards displaying application details, external job link buttons, and edit/delete actions.
- **Form Validation**: Strict validation for required fields, numeric/text salary formatting, valid HTTP/HTTPS URLs, and past/present application dates.
- **LocalStorage Persistence**: Automatically saves application records and theme settings across browser sessions.
- **Empty State Handling**: Contextual feedback when no applications exist or when search/filter queries yield zero results.
- **Toast Notifications**: Non-intrusive, auto-dismissing toast alerts for CRUD actions and form validation errors.
- **Dark/Light Mode**: Toggleable dark theme preference stored in browser memory.
- **Responsive Design**: Mobile-friendly, tablet-optimized, and desktop-spacious layout with accessible focus states.

## Tech Stack
- **HTML5**: Semantic document structure and input elements.
- **CSS3**: Custom CSS custom properties (variables), Flexbox, CSS Grid, animations, and media queries.
- **Vanilla JavaScript**: ES6+ JavaScript for data state, DOM manipulation, event listeners, and array processing.
- **Browser LocalStorage**: Persistent client-side browser storage.

## Application Statuses
The tracker supports four application pipeline statuses:
- **Applied**: Initial stage after submitting a job application.
- **Interview**: Active interview stage (screening, technical, or hiring manager rounds).
- **Selected**: Job offer received or accepted.
- **Rejected**: Application closed or un-selected.

## Data Persistence
The application uses browser `localStorage` to retain data without requiring a backend server:
- `jobApplications`: Stores the array of job objects in JSON format.
- `jobTrackerTheme`: Remembers theme choice (`dark` or `light`).

If no prior data is found upon initial load, 3 sample applications are loaded to demonstrate functionality.

## Project Structure

```
projectJob/
├── index.html
├── README.md
├── css/
│   └── style.css
└── js/
    └── script.js
```

## How to Run
1. Download or clone the project folder.
2. Navigate into the `projectJob/` directory.
3. Open `index.html` directly in any web browser.

*(Optional)* You can also serve `index.html` using a local development server like VS Code Live Server or Python `http.server`.

## How It Works
- **Application Data**: An array of job objects (`jobs`) serves as the single in-memory source of truth.
- **Rendering**: `renderJobs()` generates dynamic HTML cards from array data and sanitizes text inputs using an `escapeHTML()` function to prevent XSS.
- **CRUD Operations**: Handled via standard array operations (`unshift`, `find`, `filter`) and DOM event listeners.
- **Search & Filter**: `filterAndRenderJobs()` filters the in-memory dataset dynamically without modifying original saved application data.
- **Statistics**: `updateStatistics()` aggregates overall totals directly from the master array so statistics remain accurate during search/filtering.
- **Theme Switching**: Toggles the `.dark-mode` class on `document.body` and updates button labels and local storage.

## Validation
- **Company Name**: Required (non-empty).
- **Job Role**: Required (non-empty).
- **Location**: Required (non-empty).
- **Salary**: Required (supports numbers or formats like `"8 LPA"`, `"₹800,000"`, `"$120,000 / year"`).
- **Application Date**: Required (future dates are rejected).
- **Status**: Required (must be one of `Applied`, `Interview`, `Selected`, `Rejected`).
- **Job URL**: Optional (must be a valid `http://` or `https://` URL if provided).
- **Notes**: Optional.

## Responsive Design
- **Desktop (1100px+)**: Spacious 5-column dashboard statistics grid, 2-column form grid, and horizontal control bar.
- **Tablet (max 900px)**: 3-column statistics grid, single-column form grid, and wrapped controls.
- **Mobile (max 600px)**: 2-column statistics grid, stacked header navigation, and full-width buttons.

## Future Improvements
- Backend database integration (e.g., PostgreSQL or MongoDB)
- User authentication and multi-user support
- Cloud synchronization across devices
- Export data to CSV / JSON format
- Interview reminder notifications and calendar integration
- Resume / cover letter document attachment

## Author
Sahil
