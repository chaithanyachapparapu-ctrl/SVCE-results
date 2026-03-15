/**
 * SVCE Tirupati — Exam Results Portal
 * Search logic with form fields, Firebase tracking
 */

(function () {
    'use strict';

    // ── Constants ──
    const PASS_MARK = 12;
    const MAX_MARKS = 30;

    // ── DOM Elements ──
    const hallTicketInput = document.getElementById('hallTicketInput');
    const examType = document.getElementById('examType');
    const viewType = document.getElementById('viewType');
    const semesterSelect = document.getElementById('semesterSelect');
    const searchBtn = document.getElementById('searchBtn');
    const loader = document.getElementById('loader');
    const resultContainer = document.getElementById('resultContainer');

    // ── Firebase Init ──
    let db = null;
    try {
        const firebaseConfig = {
            apiKey: "AIzaSyBw_2IUe06ZfizYL30dmlWRjGA51Lqg-eI",
            authDomain: "svce-results.firebaseapp.com",
            projectId: "svce-results",
            storageBucket: "svce-results.firebasestorage.app",
            messagingSenderId: "112537639370",
            appId: "1:112537639370:web:6a1f6bbc5fe658d43cd733",
            measurementId: "G-63NRGEVLXB"
        };
        if (typeof firebase !== 'undefined') {
            firebase.initializeApp(firebaseConfig);
            db = firebase.firestore();
        }
    } catch (e) {
        console.log('Firebase not configured:', e.message);
    }

    // ── Initialize ──
    init();

    function init() {
        // Hall ticket: auto-uppercase
        hallTicketInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        });

        // Search
        searchBtn.addEventListener('click', handleSearch);
        hallTicketInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSearch();
        });

        hallTicketInput.focus();

        // Track the site visit on load
        trackVisitor();
    }

    // ── Rate Limiting ──
    const MAX_REQUESTS = 5;
    const TIME_WINDOW = 60000; // 1 minute

    function checkRateLimit() {
        let history = JSON.parse(sessionStorage.getItem('searchHistory') || '[]');
        const now = Date.now();
        
        // Filter out requests older than TIME_WINDOW
        history = history.filter(time => now - time < TIME_WINDOW);
        
        if (history.length >= MAX_REQUESTS) {
            return false;
        }
        
        history.push(now);
        sessionStorage.setItem('searchHistory', JSON.stringify(history));
        return true;
    }

    // ── Search Handler ──
    async function handleSearch() {
        const ht = hallTicketInput.value.trim();
        const exam = examType.value;
        const view = viewType.value;
        const semester = semesterSelect.value;

        // Validation
        if (!ht) { showFieldError('Please enter your Hallticket number.'); return; }
        
        const htRegex = /^[A-Z0-9]{8,12}$/;
        if (!htRegex.test(ht)) {
            showFieldError('Invalid Hallticket format. Only alphanumeric characters allowed.');
            return;
        }
        
        if (!exam) { showFieldError('Please select an Exam Type.'); return; }
        if (!semester) { showFieldError('Please select a Semester.'); return; }

        if (semester !== '1') {
            showInvalidSemesterError();
            return;
        }

        // Show loader
        resultContainer.innerHTML = '';
        loader.classList.add('active');

        // Check Rate Limit
        if (!checkRateLimit()) {
            loader.classList.remove('active');
            showFieldError('Too many attempts. Please try again in a minute.');
            return;
        }

        try {
            const result = await findResult(ht);
            loader.classList.remove('active');
            const found = !!result;

            if (result) {
                displayResult(ht, result, semester, exam, view);
            } else {
                showNotFound(ht);
            }

            // Track to Firebase
            trackSearch(ht, semester, exam, found);
        } catch (e) {
            loader.classList.remove('active');
            console.error(e);
            showFieldError('Error fetching result. Please try again.');
        }
    }

    // ── Find Result ──
    async function findResult(hallTicket) {
        if (!db) {
            console.warn('Firebase not initialized.');
            return null;
        }
        try {
            const docRef = db.collection('students').doc(hallTicket);
            const docSnap = await docRef.get();
            if (docSnap.exists) {
                return docSnap.data();
            } else {
                return null;
            }
        } catch (error) {
            console.error("Firebase error getting document:", error);
            throw error; // Let handleSearch catch it
        }
    }

    // ── Display Result ──
    function displayResult(hallTicket, result, semester, exam, view) {
        const subjects = Object.entries(result.marks).map(([name, marks]) => ({
            name,
            marks,
            max: MAX_MARKS,
            passed: marks >= PASS_MARK
        }));

        const totalMarks = result.total;
        const maxMarks = result.maxTotal;
        const percentage = ((totalMarks / maxMarks) * 100).toFixed(2);
        const allPassed = result.passed;
        const failedSubjects = subjects.filter(s => !s.passed);

        let subjectRows = subjects.map((s, i) => `
            <tr>
                <td>${s.name}</td>
                <td class="marks-num">${s.marks}</td>
                <td class="marks-num">${s.max}</td>
                <td class="marks-num ${s.passed ? 'subject-pass' : 'subject-fail'}">${s.marks}/${s.max}</td>
                <td>${s.passed
                    ? '<span style="color:var(--color-pass); font-weight:600;"><i class="fas fa-check-circle"></i> Pass</span>'
                    : '<span style="color:var(--color-fail); font-weight:600;"><i class="fas fa-times-circle"></i> Fail</span>'
                }</td>
            </tr>
        `).join('');

        const statusClass = allPassed ? 'pass' : 'fail';
        const statusText = allPassed ? '✓ PASSED' : '✗ FAILED';

        resultContainer.innerHTML = `
            <div class="result-card">
                <div class="result-header">
                    <div class="student-info">
                        <h2>${result.name}</h2>
                        <div class="hall-ticket-label">
                            <i class="fas fa-id-badge"></i>
                            Hall Ticket: <span>${hallTicket}</span>
                        </div>
                    </div>
                    <div class="result-status ${statusClass}">${statusText}</div>
                </div>

                <div class="result-meta">
                    <div class="meta-item"><i class="fas fa-calendar"></i> Semester: <strong>${semester}</strong></div>
                    <div class="meta-item"><i class="fas fa-file-alt"></i> Exam: <strong>${exam}</strong></div>
                    <div class="meta-item"><i class="fas fa-eye"></i> View: <strong>${view}</strong></div>
                    ${!allPassed ? `<div class="meta-item"><i class="fas fa-exclamation-triangle" style="color:var(--color-fail);"></i> <strong style="color:var(--color-fail);">${failedSubjects.length} Subject(s) Failed</strong></div>` : ''}
                </div>

                <div class="marks-table-wrapper">
                    <table class="marks-table">
                        <thead>
                            <tr>
                                <th>Subject</th>
                                <th>Marks</th>
                                <th>Max</th>
                                <th>Score</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>${subjectRows}</tbody>
                    </table>
                </div>

                <div class="result-summary">
                    <div class="summary-stats">
                        <div class="stat-item">
                            <div class="stat-label">Total Marks</div>
                            <div class="stat-value">${totalMarks} / ${maxMarks}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Percentage</div>
                            <div class="stat-value percentage">${percentage}%</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Result</div>
                            <div class="stat-value" style="color:var(--color-${statusClass})">${allPassed ? 'PASS' : 'FAIL'}</div>
                        </div>
                    </div>
                    <button class="btn-download" onclick="generatePDF()">
                        <i class="fas fa-file-pdf"></i> Download PDF
                    </button>
                </div>
            </div>
        `;

        // Store for PDF
        window.__currentResult = {
            hallTicket, name: result.name, semester, exam, view,
            subjects, totalMarks, maxMarks, percentage, allPassed
        };

        resultContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // ── Error States ──
    function showNotFound(query) {
        resultContainer.innerHTML = `
            <div class="error-card">
                <div class="error-icon"><i class="fas fa-triangle-exclamation"></i></div>
                <h3>Result Not Available</h3>
                <p>No results found for "<strong>${escapeHtml(query)}</strong>".<br>Please check your hall ticket number and try again.</p>
            </div>
        `;
    }

    function showFieldError(message) {
        resultContainer.innerHTML = `
            <div class="error-card">
                <div class="error-icon"><i class="fas fa-circle-exclamation"></i></div>
                <h3>Missing Information</h3>
                <p>${message}</p>
            </div>
        `;
    }

    function showInvalidSemesterError() {
        resultContainer.innerHTML = `
            <div class="error-card">
                <div class="error-icon"><i class="fas fa-lock" style="color: #f59e0b; background: #fef3c7;"></i></div>
                <h3 style="color: #d97706;">Results Unavailable</h3>
                <p>Currently, only <strong>1st Semester</strong> results are published and available for viewing.</p>
            </div>
        `;
    }

    // ── Firebase Tracking ──
    function trackSearch(hallTicket, semester, exam, found) {
        if (!db) return;
        try {
            db.collection('searches').add({
                hallTicket: hallTicket,
                semester: semester,
                examType: exam,
                resultFound: found,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            }).catch(() => {});
        } catch (e) {
            // Silently fail if Firebase not configured
        }
    }

    // Track initial page visit
    function trackVisitor() {
        if (!db) return;
        try {
            // Fetch IP
            fetch('https://api.ipify.org?format=json')
                .then(response => response.json())
                .then(data => {
                    saveVisitInfo(data.ip);
                })
                .catch(() => {
                    // Fallback if IP fetch fails
                    saveVisitInfo("Unknown");
                });
        } catch (e) {
            // Silently fail
        }
    }

    function saveVisitInfo(ip) {
        if (!db) return;
        try {
            const visitorData = {
                ip: ip,
                userAgent: navigator.userAgent,
                language: navigator.language,
                platform: navigator.platform,
                screenResolution: `${window.screen.width}x${window.screen.height}`,
                windowSize: `${window.innerWidth}x${window.innerHeight}`,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };
            db.collection('visits').add(visitorData).catch(() => {});
        } catch(e) {}
    }

    // ── Utility ──
    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

})();
