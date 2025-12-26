/* ========================================
   Invoice App - PDF Generator
   ======================================== */

/**
 * PDF Generator - Generate invoice PDFs using jsPDF
 */
const PDFGenerator = {
  /**
   * Generate PDF from invoice data
   * @param {object} invoice - Invoice data
   * @param {object} client - Client data
   * @param {Array} timeEntries - Array of time entries
   * @param {Map} serviceMap - Map of service IDs to service data
   * @param {object} settings - Company settings
   * @returns {Promise<void>}
   */
  async generateInvoicePDF(
    invoice,
    client,
    timeEntries,
    serviceMap,
    settings = {}
  ) {
    try {
      // Access jsPDF from global window object
      const { jsPDF } = window.jspdf;

      if (!jsPDF) {
        throw new Error('jsPDF library not loaded');
      }

      // Create new PDF document (letter size)
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'letter',
      });

      // Get company info from settings
      const companyName = settings.companyName || 'My Consulting LLC';
      const companyAddress = settings.companyAddress || '';
      const companyEmail = settings.companyEmail || '';
      const companyLogo = settings.companyLogo;

      // Page dimensions and margins
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - 2 * margin;
      let yPosition = margin;

      // Helper function to add text with word wrap
      const addText = (text, x, y, maxWidth, options = {}) => {
        const lines = doc.splitTextToSize(text, maxWidth);
        doc.text(lines, x, y, options);
        return y + lines.length * (options.lineHeight || 7);
      };

      // Store logo Y position for alignment with INVOICE title
      let logoYPosition = margin * 0.5;

      // Add logo if available (upper left, aligned with INVOICE)
      if (companyLogo) {
        try {
          // Detect image format from data URL
          let imageFormat = 'PNG'; // default to PNG as it handles most cases
          if (companyLogo.startsWith('data:image/')) {
            const mimeType = companyLogo
              .split(';')[0]
              .split('/')[1]
              .toUpperCase();
            if (mimeType === 'JPEG' || mimeType === 'JPG') {
              imageFormat = 'JPEG';
            } else if (mimeType === 'PNG') {
              imageFormat = 'PNG';
            } else if (mimeType === 'GIF') {
              imageFormat = 'GIF';
            }
          }

          // Logo dimensions (max 40mm wide, 20mm high)
          const logoMaxWidth = 40;
          const logoMaxHeight = 20;
          const logoX = margin; // Upper left position

          // Add image to PDF - jsPDF can handle data URLs directly
          doc.addImage({
            imageData: companyLogo,
            format: imageFormat,
            x: logoX,
            y: logoYPosition,
            width: logoMaxWidth,
            height: logoMaxHeight,
          });
        } catch (error) {
          console.warn('Failed to add logo to PDF:', error);
          console.warn('Error details:', error.message);
        }
      } else {
        console.warn('No logo data found');
      }

      // Set yPosition below logo with more space
      yPosition = logoYPosition + 30;

      // Header - Company Name (smaller font)
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(companyName, margin, yPosition);
      yPosition += 7;

      // Company contact info
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      if (companyAddress) {
        yPosition = addText(
          companyAddress,
          margin,
          yPosition,
          contentWidth / 2,
          { lineHeight: 4.5 }
        );
      }
      if (companyEmail) {
        doc.text(companyEmail, margin, yPosition);
        yPosition += 3;
      }

      yPosition += 5;

      // Invoice title and number (right aligned)
      doc.setFontSize(32);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(37, 99, 235); // Professional blue
      doc.text('INVOICE', pageWidth - margin, margin, { align: 'right' });
      doc.setTextColor(0, 0, 0); // Reset to black

      let rightColY = margin + 10;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      const invoiceNumberWithVersion = invoice.version
        ? `${invoice.invoiceNumber}-${invoice.version}`
        : invoice.invoiceNumber;
      doc.text(invoiceNumberWithVersion, pageWidth - margin, rightColY, {
        align: 'right',
      });
      rightColY += 10;

      // Invoice metadata (right aligned)
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Issue Date: ${formatDate(invoice.issueDate)}`,
        pageWidth - margin,
        rightColY,
        { align: 'right' }
      );
      rightColY += 4;
      doc.text(
        `Due Date: ${formatDate(invoice.dueDate)}`,
        pageWidth - margin,
        rightColY,
        { align: 'right' }
      );

      // Set yPosition to after the company info
      yPosition = Math.max(yPosition, rightColY + 10);
      yPosition += 5;

      // Horizontal divider line
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 5;

      // Bill To section
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(37, 99, 235); // Professional blue
      doc.text('BILL TO', margin, yPosition);
      doc.setTextColor(0, 0, 0); // Reset to black
      yPosition += 6;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(client.name, margin, yPosition);
      yPosition += 4;

      if (client.address) {
        yPosition = addText(
          client.address,
          margin,
          yPosition,
          contentWidth / 2,
          { lineHeight: 4 }
        );
      }
      if (client.email) {
        doc.text(client.email, margin, yPosition);
        yPosition += 3;
      }

      yPosition += 6;

      // Line items table
      const tableStartY = yPosition;
      const colWidths = {
        date: contentWidth * 0.12,
        description: contentWidth * 0.42,
        service: contentWidth * 0.13,
        hours: contentWidth * 0.1,
        rate: contentWidth * 0.1,
        amount: contentWidth * 0.13,
      };

      // Table header
      doc.setFillColor(37, 99, 235); // Professional blue
      doc.setDrawColor(37, 99, 235);
      doc.rect(margin, yPosition, contentWidth, 9, 'F');

      doc.setTextColor(255, 255, 255); // White text
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');

      let xPos = margin + 2;
      doc.text('Date', xPos, yPosition + 6);
      xPos += colWidths.date;
      doc.text('Description', xPos, yPosition + 6);
      xPos += colWidths.description;
      doc.text('Service', xPos, yPosition + 6);
      xPos += colWidths.service;
      doc.text('Hours', xPos, yPosition + 6);
      xPos += colWidths.hours;
      doc.text('Rate', xPos, yPosition + 6);
      xPos += colWidths.rate;
      doc.text('Amount', xPos + colWidths.amount - 6, yPosition + 6, {
        align: 'right',
      });

      yPosition += 9;
      doc.setTextColor(0, 0, 0); // Reset to black

      // Table rows
      doc.setTextColor(0, 0, 0); // Reset to black
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);

      let rowCount = 0;
      for (const entry of timeEntries) {
        const service = serviceMap.get(entry.serviceId);
        const hours = entry.hours;
        const rate = entry.rate || 0;
        const amount = hours * rate;

        // Check if we need a new page
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = margin;
        }

        // Alternating row background
        if (rowCount % 2 === 1) {
          doc.setFillColor(249, 250, 251); // Light gray
          doc.rect(margin, yPosition - 3, contentWidth, 10, 'F');
        }

        xPos = margin + 2;

        // Date
        doc.text(formatDate(entry.startDate), xPos, yPosition + 3);
        xPos += colWidths.date;

        // Description (with word wrap if needed)
        const descLines = doc.splitTextToSize(
          entry.description,
          colWidths.description - 4
        );
        const rowHeight = Math.max(10, descLines.length * 5);

        doc.text(descLines, xPos, yPosition + 3);
        xPos += colWidths.description;

        // Service
        doc.text(service?.name || 'Unknown', xPos, yPosition + 3);
        xPos += colWidths.service;

        // Hours
        doc.text(hours.toFixed(2), xPos, yPosition + 3);
        xPos += colWidths.hours;

        // Rate
        doc.text(formatCurrency(rate), xPos, yPosition + 3);
        xPos += colWidths.rate;

        // Amount (right aligned)
        doc.text(
          formatCurrency(amount),
          xPos + colWidths.amount - 2,
          yPosition + 3,
          { align: 'right' }
        );

        yPosition += rowHeight;
        rowCount++;
      }

      // Divider line
      yPosition += 5;
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      // Total
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      const totalX = pageWidth - margin - colWidths.amount;
      doc.text('TOTAL:', totalX - 30, yPosition);
      doc.text(
        formatCurrency(invoice.total),
        totalX + colWidths.amount - 2,
        yPosition,
        { align: 'right' }
      );
      yPosition += 15;

      // Payment terms / Footer
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      const paymentDays = client.daysToPay || 30;
      doc.text(`Payment is due within ${paymentDays} days.`, margin, yPosition);
      yPosition += 5;
      doc.text('Thank you for your business!', margin, yPosition);

      // Page numbers at bottom
      const pageCount = doc.internal.pages.length - 1; // Subtract 1 for the cover page
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, {
          align: 'center',
        });
      }

      // Generate filename
      const dateStr = formatDateForInput(new Date());
      const filename = sanitizeFilename(
        `${companyName}-${invoice.invoiceNumber}-${dateStr}`
      );

      // Save the PDF
      doc.save(`${filename}.pdf`);

      Toast.success('PDF Generated', `${filename}.pdf downloaded successfully`);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      Toast.error('PDF Generation Failed', error.message);
    }
  },
};
