/* ==========================================
   SMART JOB APPLICATION TRACKER - APP LOGIC
   ========================================== */

// Constant keys for LocalStorage
const STORAGE_KEY = 'jobApplications';
const THEME_STORAGE_KEY = 'jobTrackerTheme';

// In-memory application state
let jobs = [];
let editingJobId = null; // Tracks current job being edited (null = Add mode)
let toastTimeoutId = null; // Tracks active toast timer for single-toast replacement

// DOM Elements
const applicationsContainer = document.getElementById('applicationsContainer');
const emptyState = document.getElementById('emptyState');
const jobForm = document.getElementById('jobForm');
const submitBtn = document.getElementById('submitBtn');
const cancelBtn = document.getElementById('cancelBtn');
const toastContainer = document.getElementById('toastContainer');
const addJobSection = document.getElementById('add-job');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const themeToggleBtn = document.getElementById('themeToggleBtn');

// Form Input DOM Elements
const companyNameInput = document.getElementById('companyName');
const jobRoleInput = document.getElementById('jobRole');
const locationInput = document.getElementById('location');
const salaryInput = document.getElementById('salary');
const applicationDateInput = document.getElementById('applicationDate');
const statusInput = document.getElementById('status');
const jobUrlInput = document.getElementById('jobUrl');
const notesInput = document.getElementById('notes');

/**
 * Escapes special HTML characters to prevent XSS / Script Injection
 * @param {string} str - Raw string content
 * @returns {string} Escaped safe HTML string
 */
function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/* ==========================================
   FEATURE: REUSABLE TOAST NOTIFICATIONS
   ========================================== */

/**
 * Displays a reusable toast notification. Replaces any currently active notification cleanly.
 * @param {string} message - Notification text content
 * @param {string} type - Notification type ('success' | 'error' | 'info')
 */
function showNotification(message, type = 'info') {
    if (!toastContainer) return;

    // Clear active timeout if a toast timer is currently running
    if (toastTimeoutId) {
        clearTimeout(toastTimeoutId);
        toastTimeoutId = null;
    }

    // Remove existing toast DOM element to prevent stacking duplicate toasts
    const existingToast = toastContainer.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    // Create new toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    // Automatically remove toast after 3 seconds
    toastTimeoutId = setTimeout(() => {
        toast.remove();
        toastTimeoutId = null;
    }, 3000);
}

/**
 * Alias for showNotification for backwards compatibility
 * @param {string} message 
 * @param {string} type 
 */
function showToast(message, type = 'success') {
    showNotification(message, type);
}

/* ==========================================
   FEATURE: DARK / LIGHT MODE TOGGLE
   ========================================== */

/**
 * Applies the specified theme to the document body and updates the toggle button label.
 * @param {string} theme - 'dark' or 'light'
 */
function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
        if (themeToggleBtn) {
            themeToggleBtn.textContent = '☀️ Light Mode';
            themeToggleBtn.setAttribute('aria-label', 'Switch to light mode');
        }
    } else {
        document.body.classList.remove('dark-mode');
        if (themeToggleBtn) {
            themeToggleBtn.textContent = '🌙 Dark Mode';
            themeToggleBtn.setAttribute('aria-label', 'Switch to dark mode');
        }
    }
}

/**
 * Toggles between light and dark themes and persists preference to localStorage
 */
function toggleTheme() {
    const isDarkMode = document.body.classList.contains('dark-mode');
    const newTheme = isDarkMode ? 'light' : 'dark';

    try {
        localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
        console.error('Failed to save theme to localStorage:', error);
    }

    applyTheme(newTheme);
}

/**
 * Loads saved theme preference from localStorage on application startup
 */
function loadTheme() {
    try {
        const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme === 'dark') {
            applyTheme('dark');
        } else {
            applyTheme('light');
        }
    } catch (error) {
        console.error('Failed to load theme from localStorage:', error);
        applyTheme('light');
    }
}

/**
 * Generates 3 initial sample job applications
 * @returns {Array} Array of sample job objects
 */
function getSampleJobs() {
    return [
        {
            id: 'job-sample-1',
            company: 'Google',
            role: 'Frontend Engineer',
            location: 'Mountain View, CA (Remote)',
            salary: '$140,000 / year',
            applicationDate: '2026-08-20',
            status: 'Interview',
            jobUrl: 'https://careers.google.com',
            notes: 'Passed initial recruiter phone screen. Technical interview scheduled.'
        },
        {
            id: 'job-sample-2',
            company: 'Microsoft',
            role: 'Software Engineer',
            location: 'Redmond, WA',
            salary: '$130,000 / year',
            applicationDate: '2026-08-22',
            status: 'Applied',
            jobUrl: 'https://careers.microsoft.com',
            notes: 'Applied via employee referral link.'
        },
        {
            id: 'job-sample-3',
            company: 'TCS',
            role: 'Full Stack Developer',
            location: 'Bangalore, India',
            salary: '₹1,200,000 / year',
            applicationDate: '2026-08-24',
            status: 'Selected',
            jobUrl: 'https://tcs.com/careers',
            notes: 'Received offer letter. Pending final review.'
        }
    ];
}

/**
 * Loads job applications from localStorage.
 * If no data exists, populates with sample data.
 */
function loadJobs() {
    try {
        const storedJobsData = localStorage.getItem(STORAGE_KEY);
        if (storedJobsData) {
            jobs = JSON.parse(storedJobsData);
            if (!Array.isArray(jobs)) {
                jobs = getSampleJobs();
                saveJobs();
            }
        } else {
            jobs = getSampleJobs();
            saveJobs();
        }
    } catch (error) {
        console.error('Failed to load jobs from localStorage:', error);
        jobs = getSampleJobs();
    }
}

/**
 * Saves current jobs array to localStorage
 */
function saveJobs() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
    } catch (error) {
        console.error('Failed to save jobs to localStorage:', error);
    }
}

/* ==========================================
   FEATURE: LIVE DASHBOARD STATISTICS
   ========================================== */

/**
 * Calculates and updates dashboard statistics based on the complete `jobs` array.
 * Note: Statistics always represent all saved applications, unaffected by search/filter inputs.
 */
function updateStatistics() {
    const totalCount = jobs.length;
    const appliedCount = jobs.filter(job => job.status === 'Applied').length;
    const interviewCount = jobs.filter(job => job.status === 'Interview').length;
    const selectedCount = jobs.filter(job => job.status === 'Selected').length;
    const rejectedCount = jobs.filter(job => job.status === 'Rejected').length;

    const statTotalEl = document.getElementById('statTotal');
    const statAppliedEl = document.getElementById('statApplied');
    const statInterviewEl = document.getElementById('statInterview');
    const statSelectedEl = document.getElementById('statSelected');
    const statRejectedEl = document.getElementById('statRejected');

    if (statTotalEl) statTotalEl.textContent = totalCount;
    if (statAppliedEl) statAppliedEl.textContent = appliedCount;
    if (statInterviewEl) statInterviewEl.textContent = interviewCount;
    if (statSelectedEl) statSelectedEl.textContent = selectedCount;
    if (statRejectedEl) statRejectedEl.textContent = rejectedCount;
}

/**
 * Returns CSS class name corresponding to job status for badge styling
 * @param {string} status 
 * @returns {string} Badge class name
 */
function getStatusBadgeClass(status) {
    switch (status) {
        case 'Applied': return 'badge-applied';
        case 'Interview': return 'badge-interview';
        case 'Selected': return 'badge-selected';
        case 'Rejected': return 'badge-rejected';
        default: return 'badge-applied';
    }
}

/**
 * Renders an array of job applications to the DOM.
 * @param {Array} [jobsToRender=jobs] - Subset or full array of jobs to render
 */
function renderJobs(jobsToRender = jobs) {
    if (!applicationsContainer) return;

    // Remove old cards or no-results message
    const existingCards = applicationsContainer.querySelectorAll('.job-card, .no-results-state');
    existingCards.forEach(card => card.remove());

    // Case 1: Database has zero jobs saved overall
    if (jobs.length === 0) {
        if (emptyState) {
            emptyState.style.display = 'block';
        }
        return;
    }

    // Hide default empty state when jobs exist in database
    if (emptyState) {
        emptyState.style.display = 'none';
    }

    // Case 2: Database has jobs, but search/filter returned 0 results
    if (jobsToRender.length === 0) {
        const noResultsHTML = `
            <div class="empty-state no-results-state">
                <p class="empty-title">No matching applications found.</p>
                <p class="empty-subtitle">Try adjusting your search or filter criteria.</p>
            </div>
        `;
        applicationsContainer.insertAdjacentHTML('beforeend', noResultsHTML);
        return;
    }

    // Case 3: Render matching job cards
    const cardsHTML = jobsToRender.map(job => {
        const safeCompany = escapeHTML(job.company);
        const safeRole = escapeHTML(job.role);
        const safeLocation = escapeHTML(job.location);
        const safeSalary = escapeHTML(job.salary);
        const safeDate = escapeHTML(job.applicationDate);
        const safeStatus = escapeHTML(job.status);
        const safeNotes = escapeHTML(job.notes);
        const safeUrl = escapeHTML(job.jobUrl);
        const badgeClass = getStatusBadgeClass(job.status);

        const openJobLink = safeUrl 
            ? `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="btn-action">Open Job</a>` 
            : '';

        return `
            <article class="job-card" data-id="${escapeHTML(job.id)}">
                <div class="job-card-header">
                    <div>
                        <h3 class="company-name">${safeCompany}</h3>
                        <p class="job-role">${safeRole}</p>
                    </div>
                    <span class="status-badge ${badgeClass}">${safeStatus}</span>
                </div>
                
                <div class="job-meta">
                    <span>📍 ${safeLocation}</span>
                    ${safeSalary ? `<span>💰 ${safeSalary}</span>` : ''}
                    <span>📅 Applied: ${safeDate}</span>
                </div>

                ${safeNotes ? `<p class="job-notes">${safeNotes}</p>` : ''}

                <div class="job-card-footer">
                    <div class="action-buttons">
                        <button type="button" class="btn-action btn-edit">Edit</button>
                        <button type="button" class="btn-action btn-delete">Delete</button>
                    </div>
                    ${openJobLink}
                </div>
            </article>
        `;
    }).join('');

    applicationsContainer.insertAdjacentHTML('beforeend', cardsHTML);
}

/* ==========================================
   FEATURE: SEARCH & STATUS FILTER
   ========================================== */

/**
 * Filters the jobs array based on current search keyword and selected status,
 * then passes filtered results to renderJobs().
 */
function filterAndRenderJobs() {
    const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const selectedStatus = statusFilter ? statusFilter.value : 'All';

    const filteredJobs = jobs.filter(job => {
        const matchesSearch = 
            (job.company && job.company.toLowerCase().includes(searchTerm)) ||
            (job.role && job.role.toLowerCase().includes(searchTerm)) ||
            (job.location && job.location.toLowerCase().includes(searchTerm));

        const matchesStatus = (selectedStatus === 'All') || (job.status === selectedStatus);

        return matchesSearch && matchesStatus;
    });

    renderJobs(filteredJobs);
}

/* ==========================================
   FEATURE: FORM VALIDATION
   ========================================== */

/**
 * Helper to validate http or https URL format
 * @param {string} urlString 
 * @returns {boolean} True if empty or valid http/https URL
 */
function isValidHttpUrl(urlString) {
    if (!urlString) return true;
    try {
        const url = new URL(urlString);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
}

/**
 * Validates all input fields in the job application form.
 * Displays toast notification on failure and focuses invalid input field.
 * @returns {boolean} True if all fields pass validation, false otherwise
 */
function validateForm() {
    const companyValue = companyNameInput ? companyNameInput.value.trim() : '';
    const roleValue = jobRoleInput ? jobRoleInput.value.trim() : '';
    const locationValue = locationInput ? locationInput.value.trim() : '';
    const salaryValue = salaryInput ? salaryInput.value.trim() : '';
    const dateValue = applicationDateInput ? applicationDateInput.value : '';
    const statusValue = statusInput ? statusInput.value : '';
    const jobUrlValue = jobUrlInput ? jobUrlInput.value.trim() : '';

    // 1. Company Name Validation
    if (!companyValue) {
        showNotification('Company name is required.', 'error');
        if (companyNameInput) companyNameInput.focus();
        return false;
    }

    // 2. Job Role Validation
    if (!roleValue) {
        showNotification('Job role is required.', 'error');
        if (jobRoleInput) jobRoleInput.focus();
        return false;
    }

    // 3. Location Validation
    if (!locationValue) {
        showNotification('Location is required.', 'error');
        if (locationInput) locationInput.focus();
        return false;
    }

    // 4. Salary Validation
    if (!salaryValue) {
        showNotification('Please enter a valid salary.', 'error');
        if (salaryInput) salaryInput.focus();
        return false;
    }

    // 5. Application Date Validation
    if (!dateValue) {
        showNotification('Application date cannot be in the future.', 'error');
        if (applicationDateInput) applicationDateInput.focus();
        return false;
    }

    const selectedDate = new Date(dateValue + 'T00:00:00');
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (isNaN(selectedDate.getTime()) || selectedDate > today) {
        showNotification('Application date cannot be in the future.', 'error');
        if (applicationDateInput) applicationDateInput.focus();
        return false;
    }

    // 6. Status Validation
    const validStatuses = ['Applied', 'Interview', 'Selected', 'Rejected'];
    if (!validStatuses.includes(statusValue)) {
        showNotification('Please select a valid application status.', 'error');
        if (statusInput) statusInput.focus();
        return false;
    }

    // 7. Job URL Validation (Optional field)
    if (jobUrlValue && !isValidHttpUrl(jobUrlValue)) {
        showNotification('Please enter a valid job URL.', 'error');
        if (jobUrlInput) jobUrlInput.focus();
        return false;
    }

    return true;
}

/* ==========================================
   FEATURE: FORM MANAGEMENT (ADD & EDIT)
   ========================================== */

/**
 * Resets the form and clears edit mode state
 */
function clearForm() {
    if (jobForm) {
        jobForm.reset();
    }
    editingJobId = null;
    if (submitBtn) {
        submitBtn.textContent = 'Add Application';
    }
}

/**
 * Prepares the form for editing an existing job application
 * @param {string} jobId - ID of the job to edit
 */
function handleEditJob(jobId) {
    const jobToEdit = jobs.find(job => job.id === jobId);
    if (!jobToEdit) return;

    editingJobId = jobId;

    if (companyNameInput) companyNameInput.value = jobToEdit.company || '';
    if (jobRoleInput) jobRoleInput.value = jobToEdit.role || '';
    if (locationInput) locationInput.value = jobToEdit.location || '';
    if (salaryInput) salaryInput.value = jobToEdit.salary || '';
    if (applicationDateInput) applicationDateInput.value = jobToEdit.applicationDate || '';
    if (statusInput) statusInput.value = jobToEdit.status || 'Applied';
    if (jobUrlInput) jobUrlInput.value = jobToEdit.jobUrl || '';
    if (notesInput) notesInput.value = jobToEdit.notes || '';

    if (submitBtn) {
        submitBtn.textContent = 'Update Application';
    }

    if (addJobSection) {
        addJobSection.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * Handles job application form submission (Add or Update)
 * @param {Event} e - Submit event object
 */
function handleFormSubmit(e) {
    e.preventDefault();

    // Run form validation before proceeding
    if (!validateForm()) {
        return;
    }

    const companyValue = companyNameInput ? companyNameInput.value.trim() : '';
    const roleValue = jobRoleInput ? jobRoleInput.value.trim() : '';
    const locationValue = locationInput ? locationInput.value.trim() : '';
    const salaryValue = salaryInput ? salaryInput.value.trim() : '';
    const dateValue = applicationDateInput ? applicationDateInput.value : '';
    const statusValue = statusInput ? statusInput.value : 'Applied';
    const jobUrlValue = jobUrlInput ? jobUrlInput.value.trim() : '';
    const notesValue = notesInput ? notesInput.value.trim() : '';

    if (editingJobId !== null) {
        // UPDATE MODE
        const existingJob = jobs.find(job => job.id === editingJobId);
        if (existingJob) {
            existingJob.company = companyValue;
            existingJob.role = roleValue;
            existingJob.location = locationValue;
            existingJob.salary = salaryValue;
            existingJob.applicationDate = dateValue;
            existingJob.status = statusValue;
            existingJob.jobUrl = jobUrlValue;
            existingJob.notes = notesValue;
        }
        showNotification('Application updated successfully.', 'success');
    } else {
        // ADD MODE
        const newJob = {
            id: String(Date.now()),
            company: companyValue,
            role: roleValue,
            location: locationValue,
            salary: salaryValue,
            applicationDate: dateValue,
            status: statusValue,
            jobUrl: jobUrlValue,
            notes: notesValue
        };
        jobs.unshift(newJob);
        showNotification('Job application added successfully.', 'success');
    }

    saveJobs();
    updateStatistics();
    filterAndRenderJobs();
    clearForm();
}

/* ==========================================
   FEATURE: DELETE APPLICATION
   ========================================== */

/**
 * Deletes a job application by ID after user confirmation
 * @param {string} jobId - ID of the job to delete
 */
function handleDeleteJob(jobId) {
    const confirmed = confirm('Are you sure you want to delete this application?');
    if (!confirmed) return;

    jobs = jobs.filter(job => job.id !== jobId);

    if (editingJobId === jobId) {
        clearForm();
    }

    saveJobs();
    updateStatistics();
    filterAndRenderJobs();
    showNotification('Application deleted successfully.', 'success');
}

/**
 * Event delegation for container button clicks (Edit & Delete)
 * @param {Event} e - Click event object
 */
function handleContainerClick(e) {
    const editBtn = e.target.closest('.btn-edit');
    if (editBtn) {
        const jobCard = editBtn.closest('.job-card');
        if (jobCard) {
            const jobId = jobCard.dataset.id;
            handleEditJob(jobId);
        }
        return;
    }

    const deleteBtn = e.target.closest('.btn-delete');
    if (deleteBtn) {
        const jobCard = deleteBtn.closest('.job-card');
        if (jobCard) {
            const jobId = jobCard.dataset.id;
            handleDeleteJob(jobId);
        }
    }
}

/**
 * Main application initialization function
 */
function init() {
    loadTheme();
    loadJobs();
    updateStatistics();
    filterAndRenderJobs();

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }

    if (jobForm) {
        jobForm.addEventListener('submit', handleFormSubmit);
        jobForm.addEventListener('reset', clearForm);
    }

    if (applicationsContainer) {
        applicationsContainer.addEventListener('click', handleContainerClick);
    }

    if (searchInput) {
        searchInput.addEventListener('input', filterAndRenderJobs);
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', filterAndRenderJobs);
    }
}

// Run initialization when DOM content is ready
document.addEventListener('DOMContentLoaded', init);
