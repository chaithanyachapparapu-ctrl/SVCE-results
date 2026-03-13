/**
 * SVCE Tirupati — Exam Results Portal
 * Search logic with form fields, year detection, dynamic sections, Firebase tracking
 */

(function () {
    'use strict';

    // ── Constants ──
    const PASS_MARK = 12;
    const MAX_MARKS = 30;

    // ── Section Map ──
    const SECTION_MAP = {
        'CSE':   ['A','B','C','D','E','F','G','H'],
        'CSC':   ['A','B'],
        'CSD':   ['A','B'],
        'CSM':   ['A','B','C','D','E'],
        'ECE':   ['A','B','C','D','E','F','G','H'],
        'EEE':   ['A','B','C','D'],
        'IT':    ['A','B','C'],
        'MECH':  ['A','B'],
        'CIVIL': ['A','B']
    };

    // ── DOM Elements ──
    const hallTicketInput = document.getElementById('hallTicketInput');
    const yearDetect = document.getElementById('yearDetect');
    const yearSelect = document.getElementById('yearSelect');
    const yearError = document.getElementById('yearError');
    const examType = document.getElementById('examType');
    const branchInput = document.getElementById('branchInput');
    const sectionSelect = document.getElementById('sectionSelect');
    const searchBtn = document.getElementById('searchBtn');
    const loader = document.getElementById('loader');
    const resultContainer = document.getElementById('resultContainer');

    // ── Firebase Init ──
    let db = null;
    try {
        const firebaseConfig = {
            apiKey: "AIzaSyDummy_placeholder",
            authDomain: "svce-results.firebaseapp.com",
            projectId: "svce-results",
            storageBucket: "svce-results.appspot.com",
            messagingSenderId: "000000000000",
            appId: "1:000000000000:web:0000000000000000"
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
        // Hall ticket: auto-uppercase + year detection + branch auto-fill
        hallTicketInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
            const val = e.target.value;
            detectYear(val);
            autoSelectYear(val);
            autoFillBranch(val);
        });

        // Year dropdown change → cross-validate with roll number
        yearSelect.addEventListener('change', () => {
            crossValidateYear();
        });

        // Auto-populate sections for CSD branch
        populateSections('CSD');

        // Search
        searchBtn.addEventListener('click', handleSearch);
        hallTicketInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSearch();
        });

        hallTicketInput.focus();
    }

    // ── Year Detection Badge ──
    function detectYear(value) {
        if (value.startsWith('25')) {
            yearDetect.innerHTML = '<span class="year-badge y1">📘 1st Year Detected</span>';
        } else if (value.startsWith('24')) {
            yearDetect.innerHTML = '<span class="year-badge y2">📙 2nd Year Detected</span>';
        } else if (value.length >= 2) {
            yearDetect.innerHTML = '<span style="color: var(--text-light); font-size: 0.75rem;">Year not recognized</span>';
        } else {
            yearDetect.innerHTML = '';
        }
    }

    // ── Auto-select Year from roll number ──
    function autoSelectYear(value) {
        if (value.startsWith('25')) {
            yearSelect.value = '1st Year';
            yearError.textContent = '';
        } else if (value.startsWith('24')) {
            yearSelect.value = '2nd Year';
            yearError.textContent = '';
        }
    }

    // ── Cross-validate Year vs Roll Number ──
    function crossValidateYear() {
        const ht = hallTicketInput.value.trim();
        const selectedYear = yearSelect.value;
        yearError.textContent = '';

        if (ht.length >= 2) {
            if (selectedYear === '1st Year' && !ht.startsWith('25')) {
                yearError.textContent = '⚠ Roll number doesn\'t start with 25 for 1st Year';
            } else if (selectedYear === '2nd Year' && !ht.startsWith('24')) {
                yearError.textContent = '⚠ Roll number doesn\'t start with 24 for 2nd Year';
            }
        }
    }

    // ── Auto-fill Branch as CSD ──
    function autoFillBranch(value) {
        // All students in data.js are CSD branch
        if (value.length >= 2) {
            branchInput.value = 'CSD';
        }
    }

    // ── Populate Sections ──
    function populateSections(branch) {
        const sections = SECTION_MAP[branch] || [];
        sectionSelect.innerHTML = '<option value="" disabled selected>Select Section</option>';
        sections.forEach(sec => {
            const opt = document.createElement('option');
            opt.value = sec;
            opt.textContent = sec;
            sectionSelect.appendChild(opt);
        });
        sectionSelect.disabled = false;
    }

    // ── Search Handler ──
    function handleSearch() {
        const ht = hallTicketInput.value.trim();
        const exam = examType.value;
        const branch = branchInput.value;
        const section = sectionSelect.value;
        const selectedYear = yearSelect.value;

        // Validation
        if (!ht) { showFieldError('Please enter your Hall Ticket Number.'); return; }
        if (!selectedYear) { showFieldError('Please select a Year.'); return; }

        // Cross-validate year vs roll number
        if (selectedYear === '1st Year' && !ht.startsWith('25')) {
            showFieldError('Roll number doesn\'t start with 25 for 1st Year selection.');
            return;
        }
        if (selectedYear === '2nd Year' && !ht.startsWith('24')) {
            showFieldError('Roll number doesn\'t start with 24 for 2nd Year selection.');
            return;
        }

        if (!exam) { showFieldError('Please select an Exam Type.'); return; }
        if (!branch) { showFieldError('Please select your Branch.'); return; }
        if (!section) { showFieldError('Please select your Section.'); return; }

        // Show loader
        resultContainer.innerHTML = '';
        loader.classList.add('active');

        setTimeout(() => {
            loader.classList.remove('active');

            const result = findResult(ht);
            const found = !!result;

            if (result) {
                displayResult(ht, result, branch, section, exam);
            } else {
                showNotFound(ht);
            }

            // Track to Firebase
            trackSearch(ht, branch, section, exam, found);
        }, 500);
    }

    // ── Find Result ──
    function findResult(hallTicket) {
        if (typeof STUDENT_DATA === 'undefined') return null;
        return STUDENT_DATA[hallTicket] || null;
    }

    // ── Display Result ──
    function displayResult(hallTicket, result, branch, section, exam) {
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

        // Detect year
        let yearLabel = 'N/A';
        if (hallTicket.startsWith('25')) yearLabel = '1st Year';
        else if (hallTicket.startsWith('24')) yearLabel = '2nd Year';

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
                    <div class="meta-item"><i class="fas fa-code-branch"></i> Branch: <strong>${branch}</strong></div>
                    <div class="meta-item"><i class="fas fa-users"></i> Section: <strong>${section}</strong></div>
                    <div class="meta-item"><i class="fas fa-calendar"></i> Year: <strong>${yearLabel}</strong></div>
                    <div class="meta-item"><i class="fas fa-file-alt"></i> Exam: <strong>${exam}</strong></div>
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
            hallTicket, name: result.name, branch, section, exam,
            year: yearLabel, subjects, totalMarks, maxMarks, percentage, allPassed
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

    // ── Firebase Tracking ──
    function trackSearch(hallTicket, branch, section, exam, found) {
        if (!db) return;
        try {
            let yearVal = 'Unknown';
            if (hallTicket.startsWith('25')) yearVal = '1st Year';
            else if (hallTicket.startsWith('24')) yearVal = '2nd Year';

            db.collection('searches').add({
                hallTicket: hallTicket,
                branch: branch,
                section: section,
                year: yearVal,
                examType: exam,
                resultFound: found,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            }).catch(() => {});
        } catch (e) {
            // Silently fail if Firebase not configured
        }
    }

    // ── Utility ──
    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

})();
