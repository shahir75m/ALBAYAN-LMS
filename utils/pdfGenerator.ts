import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Book } from '../types';

export const downloadCatalogPDF = async (books: Book[], setStatusMsg: (msg: string) => void) => {
    setStatusMsg('Preparing catalog for download...');

    // 1. Group and sort books
    // Sort by Category first, then numerically by ID
    const sortedBooks = [...books].sort((a, b) => {
        if (a.category !== b.category) return a.category.localeCompare(b.category);
        const idA = parseInt(a.id.replace(/\D/g, '')) || 0;
        const idB = parseInt(b.id.replace(/\D/g, '')) || 0;
        return idA - idB;
    });

    // Create a hidden container for the report
    const reportContainer = document.createElement('div');
    reportContainer.style.position = 'absolute';
    reportContainer.style.top = '-9999px';
    reportContainer.style.left = '-9999px';
    reportContainer.style.width = '800px'; // A4 width approx in px at standard dpi
    reportContainer.style.padding = '40px';
    reportContainer.style.background = '#ffffff';
    reportContainer.style.fontFamily = "'Noto Sans Malayalam', sans-serif"; // Ensure font is used/fallback
    reportContainer.style.color = '#000';

    // Build the HTML content
    const dateStr = new Date().toLocaleDateString();
    let htmlContent = `
        <div style="margin-bottom: 20px;">
            <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 5px; color: #10b981;">ALBAYAN LIBRARY CATALOG</h1>
            <p style="font-size: 14px; color: #666;">Generated on: ${dateStr}</p>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead>
                <tr style="background-color: #10b981; color: white;">
                    <th style="padding: 10px; text-align: left; border: 1px solid #e5e7eb;">ID</th>
                    <th style="padding: 10px; text-align: left; border: 1px solid #e5e7eb;">TITLE</th>
                </tr>
            </thead>
            <tbody>
    `;

    let currentCategory = '';
    sortedBooks.forEach(book => {
        if (book.category !== currentCategory) {
            currentCategory = book.category;
            htmlContent += `
                <tr style="background-color: #f3f4f6;">
                    <td colspan="2" style="padding: 8px 10px; font-weight: bold; text-align: center; border: 1px solid #e5e7eb; color: #374151;">
                        ${currentCategory}
                    </td>
                </tr>
            `;
        }
        htmlContent += `
            <tr>
                <td style="padding: 8px 10px; border: 1px solid #e5e7eb;">${book.id}</td>
                <td style="padding: 8px 10px; border: 1px solid #e5e7eb; font-weight: 500;">${book.title}</td>
            </tr>
        `;
    });

    htmlContent += `
            </tbody>
        </table>
    `;

    reportContainer.innerHTML = htmlContent;
    document.body.appendChild(reportContainer);

    try {
        // Use html2canvas to render the element
        const canvas = await html2canvas(reportContainer, {
            scale: 2, // Higher scale for better quality
            backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = pdfWidth;
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;

        // If image height exceeds page height, basic split logic (for MVP, scaling down or cutting off)
        // For a proper multi-page solution with html2canvas, complex splitting is needed. 
        // For now, we add the image. If it's too long, it might essentially require multi-page logic 
        // which html2canvas alone doesn't solve perfectly without looping rows.
        // However, user catalog usually fits or we simply scale it.
        // Let's implement basic multi-page splitting for very long catalogs.

        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;

        while (heightLeft >= 0) {
            position = heightLeft - imgHeight; // Top position for next page
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;
        }

        pdf.save('Albayan_Library_Catalog.pdf');
        setStatusMsg('Catalog downloaded as PDF! (Image-based)');
    } catch (err) {
        console.error("PDF generation failed:", err);
        setStatusMsg('PDF generation failed. Please try again.');
    } finally {
        document.body.removeChild(reportContainer);
    }
};
