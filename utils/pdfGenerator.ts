import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { notoSansMalayalamBase64 } from './notoSansMalayalam';
import { Book } from '../types';

export const downloadCatalogPDF = (books: Book[], setStatusMsg: (msg: string) => void) => {
    const doc = new jsPDF();

    // Add Malayalam Font
    doc.addFileToVFS('NotoSansMalayalam.ttf', notoSansMalayalamBase64);
    doc.addFont('NotoSansMalayalam.ttf', 'NotoSansMalayalam', 'normal');
    doc.setFont('NotoSansMalayalam');

    // Add Title
    doc.setFontSize(18);
    doc.text('ALBAYAN LIBRARY CATALOG', 14, 22);

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

    // 1. Group and sort books
    // Sort by Category first, then numerically by ID
    const sortedBooks = [...books].sort((a, b) => {
        if (a.category !== b.category) return a.category.localeCompare(b.category);
        const idA = parseInt(a.id.replace(/\D/g, '')) || 0;
        const idB = parseInt(b.id.replace(/\D/g, '')) || 0;
        return idA - idB;
    });

    const tableData: any[] = [];
    let currentCategory = '';

    sortedBooks.forEach(book => {
        if (book.category !== currentCategory) {
            currentCategory = book.category;
            // Add a category header row
            tableData.push([
                { content: currentCategory, colSpan: 2, styles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center' } }
            ]);
        }
        tableData.push([book.id, book.title]);
    });

    autoTable(doc, {
        head: [['ID', 'TITLE']],
        body: tableData,
        theme: 'grid',
        headStyles: {
            fillColor: [10, 10, 10], // Dark header
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            font: 'NotoSansMalayalam'
        },
        styles: {
            fontSize: 10,
            cellPadding: 4,
            font: 'NotoSansMalayalam'
        },
        alternateRowStyles: { fillColor: [252, 252, 252] },
        margin: { top: 40 },
    });

    doc.save('Albayan_Library_Catalog.pdf');
    setStatusMsg('Catalog downloaded as PDF!');
};
