/**
 * SVCE Tirupati — PDF Result Generator
 * Clean, official-looking PDF with light theme
 */

function generatePDF() {
    const result = window.__currentResult;
    if (!result) {
        alert('No result data available to generate PDF.');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 18;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    // ── Colors ──
    const headerBlue = [26, 58, 107];
    const white = [255, 255, 255];
    const black = [30, 41, 59];
    const gray = [100, 116, 139];
    const passGreen = [22, 163, 74];
    const failRed = [220, 38, 38];
    const accentBlue = [37, 99, 235];
    const lightBg = [248, 250, 252];

    // ── Header Bar ──
    doc.setFillColor(...headerBlue);
    doc.rect(0, 0, pageWidth, 30, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...white);
    doc.text('SRI VENKATESWARA COLLEGE OF ENGINEERING', pageWidth / 2, 12, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Tirupati, Andhra Pradesh — Affiliated to JNTUA, Approved by AICTE', pageWidth / 2, 19, { align: 'center' });

    doc.setFontSize(8);
    doc.setTextColor(200, 210, 230);
    doc.text('EXAMINATION RESULTS', pageWidth / 2, 26, { align: 'center' });

    y = 38;

    // ── Student Info Box ──
    doc.setFillColor(...lightBg);
    doc.setDrawColor(210, 215, 225);
    doc.roundedRect(margin, y, contentWidth, 30, 2, 2, 'FD');

    const col1X = margin + 6;
    const col2X = pageWidth / 2 + 4;
    let infoY = y + 9;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...gray);
    doc.text('Student Name:', col1X, infoY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...black);
    doc.text(result.name, col1X + 30, infoY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...gray);
    doc.text('Hall Ticket:', col2X, infoY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...headerBlue);
    doc.text(result.hallTicket, col2X + 25, infoY);

    infoY += 8;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...gray);
    doc.text('View Type:', col1X, infoY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...black);
    doc.text(result.view || 'N/A', col1X + 30, infoY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...gray);
    doc.text('Semester:', col2X, infoY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...black);
    doc.text(result.semester || 'N/A', col2X + 25, infoY);

    infoY += 8;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...gray);
    doc.text('Exam Type:', col1X, infoY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...black);
    doc.text(result.exam || 'Regular', col1X + 30, infoY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...gray);
    doc.text('Academic Year:', col2X, infoY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...black);
    doc.text('2025-2026', col2X + 32, infoY);

    y += 38;

    // ── Marks Table ──
    const tableData = result.subjects.map((s, i) => [
        i + 1,
        s.name,
        s.marks,
        s.max,
        s.marks + '/' + s.max,
        s.passed ? 'PASS' : 'FAIL'
    ]);

    doc.autoTable({
        startY: y,
        margin: { left: margin, right: margin },
        head: [['#', 'Subject', 'Marks', 'Max', 'Score', 'Status']],
        body: tableData,
        theme: 'grid',
        styles: {
            fillColor: [255, 255, 255],
            textColor: [...black],
            fontSize: 8.5,
            cellPadding: 4,
            lineColor: [210, 215, 225],
            lineWidth: 0.3,
            font: 'helvetica',
        },
        headStyles: {
            fillColor: [...headerBlue],
            textColor: [...white],
            fontStyle: 'bold',
            fontSize: 7.5,
            halign: 'center',
        },
        bodyStyles: {
            halign: 'center',
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 10 },
            1: { halign: 'left', cellWidth: 52 },
            2: { halign: 'center' },
            3: { halign: 'center' },
            4: { halign: 'center', fontStyle: 'bold' },
            5: { halign: 'center', fontStyle: 'bold' },
        },
        didParseCell: function (data) {
            if (data.section === 'body' && data.column.index === 5) {
                data.cell.styles.textColor = data.cell.raw === 'PASS' ? passGreen : failRed;
            }
        },
        alternateRowStyles: {
            fillColor: [...lightBg],
        },
    });

    y = doc.lastAutoTable.finalY + 8;

    // ── Summary Box ──
    doc.setFillColor(...lightBg);
    doc.setDrawColor(210, 215, 225);
    doc.roundedRect(margin, y, contentWidth, 26, 2, 2, 'FD');

    const summaryY = y + 10;
    const third = contentWidth / 3;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...gray);
    doc.text('TOTAL MARKS', margin + third * 0.5, summaryY - 2, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...black);
    doc.text(`${result.totalMarks} / ${result.maxMarks}`, margin + third * 0.5, summaryY + 8, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...gray);
    doc.text('PERCENTAGE', margin + third * 1.5, summaryY - 2, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...accentBlue);
    doc.text(`${result.percentage}%`, margin + third * 1.5, summaryY + 8, { align: 'center' });

    const resultColor = result.allPassed ? passGreen : failRed;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...gray);
    doc.text('RESULT', margin + third * 2.5, summaryY - 2, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...resultColor);
    doc.text(result.allPassed ? 'PASSED' : 'FAILED', margin + third * 2.5, summaryY + 8, { align: 'center' });

    y += 34;

    // ── Footer ──
    doc.setDrawColor(210, 215, 225);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...gray);
    doc.text('This is a computer-generated document from the SVCE Tirupati Exam Results Portal.', pageWidth / 2, y, { align: 'center' });
    y += 3.5;
    doc.text(`Generated on: ${new Date().toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })}`, pageWidth / 2, y, { align: 'center' });
    y += 3.5;
    doc.text('Pass Mark: 12 / 30 per subject  |  Sri Venkateswara College of Engineering, Tirupati', pageWidth / 2, y, { align: 'center' });

    doc.save(`SVCE_Result_${result.hallTicket}.pdf`);
}
