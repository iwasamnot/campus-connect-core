/**
 * Form Auto-Filler - Generate pre-filled PDFs for students
 * Uses pdf-lib to fill form fields with student data
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

// Form field coordinates (X, Y) for A4 pages (points, where 0,0 is bottom-left)
// Standard A4: 595 x 842 points
const FORM_CONFIG = {
  special_consideration: {
    name: { x: 100, y: 750 },           // Name field
    studentId: { x: 100, y: 720 },     // Student ID field
    course: { x: 100, y: 690 },        // Course field
    reason: { x: 100, y: 600, width: 400, height: 100 }, // Reason field (larger area)
    date: { x: 450, y: 750 }           // Date field
  },
  extension: {
    name: { x: 100, y: 750 },
    studentId: { x: 100, y: 720 },
    course: { x: 100, y: 690 },
    assignment: { x: 100, y: 660 },
    reason: { x: 100, y: 600, width: 400, height: 100 },
    date: { x: 450, y: 750 }
  }
};

/**
 * Generate a filled PDF form
 * @param {string} formType - Type of form ('special_consideration', 'extension')
 * @param {Object} data - Student data to fill in
 * @param {string} data.name - Student name
 * @param {string} data.studentId - Student ID
 * @param {string} data.course - Course name
 * @param {string} data.reason - Reason for form submission
 * @param {string} [data.assignment] - Assignment name (for extension forms)
 * @returns {Promise<Uint8Array>} - PDF bytes
 */
export const generateFilledForm = async (formType, data) => {
  try {
    // Step 1: Fetch blank PDF template
    const formPath = `/forms/${formType}.pdf`;
    let pdfBytes;
    
    try {
      const response = await fetch(formPath);
      if (!response.ok) {
        throw new Error(`Failed to fetch form template: ${response.statusText}`);
      }
      pdfBytes = await response.arrayBuffer();
    } catch (error) {
      console.warn(`Form template not found at ${formPath}, creating blank PDF`);
      // Create a blank PDF if template doesn't exist
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595, 842]); // A4 size
      pdfBytes = await pdfDoc.save();
    }

    // Step 2: Load PDF
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    // Step 3: Get form config for this form type
    const config = FORM_CONFIG[formType];
    if (!config) {
      throw new Error(`Unknown form type: ${formType}`);
    }

    // Step 4: Get font
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 12;

    // Step 5: Draw text fields
    if (data.name && config.name) {
      firstPage.drawText(data.name, {
        x: config.name.x,
        y: config.name.y,
        size: fontSize,
        font: font,
        color: rgb(0, 0, 0)
      });
    }

    if (data.studentId && config.studentId) {
      firstPage.drawText(data.studentId, {
        x: config.studentId.x,
        y: config.studentId.y,
        size: fontSize,
        font: font,
        color: rgb(0, 0, 0)
      });
    }

    if (data.course && config.course) {
      firstPage.drawText(data.course, {
        x: config.course.x,
        y: config.course.y,
        size: fontSize,
        font: font,
        color: rgb(0, 0, 0)
      });
    }

    if (data.assignment && config.assignment) {
      firstPage.drawText(data.assignment, {
        x: config.assignment.x,
        y: config.assignment.y,
        size: fontSize,
        font: font,
        color: rgb(0, 0, 0)
      });
    }

    if (data.reason && config.reason) {
      // Handle multi-line text for reason field
      const reasonLines = wrapText(data.reason, config.reason.width || 400, fontSize, font);
      let yOffset = 0;
      const lineHeight = fontSize + 4;
      
      reasonLines.forEach((line, index) => {
        if (yOffset < (config.reason.height || 100)) {
          firstPage.drawText(line, {
            x: config.reason.x,
            y: config.reason.y - yOffset,
            size: fontSize,
            font: font,
            color: rgb(0, 0, 0)
          });
          yOffset += lineHeight;
        }
      });
    }

    // Add current date
    if (config.date) {
      const currentDate = new Date().toLocaleDateString('en-AU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      firstPage.drawText(currentDate, {
        x: config.date.x,
        y: config.date.y,
        size: fontSize,
        font: font,
        color: rgb(0, 0, 0)
      });
    }

    // Step 6: Save and return PDF bytes
    const filledPdfBytes = await pdfDoc.save();
    return filledPdfBytes;
  } catch (error) {
    console.error('Error generating filled form:', error);
    throw new Error(`Failed to generate form: ${error.message}`);
  }
};

/**
 * Helper function to wrap text to fit within a width
 * @param {string} text - Text to wrap
 * @param {number} maxWidth - Maximum width in points
 * @param {number} fontSize - Font size
 * @param {PDFFont} font - PDF font object
 * @returns {Array<string>} - Array of wrapped lines
 */
const wrapText = (text, maxWidth, fontSize, font) => {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  words.forEach(word => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, fontSize);
    
    if (width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
};

/**
 * Download PDF file
 * @param {Uint8Array} pdfBytes - PDF bytes
 * @param {string} filename - Filename for download
 */
export const downloadPDF = (pdfBytes, filename) => {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || 'form.pdf';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
