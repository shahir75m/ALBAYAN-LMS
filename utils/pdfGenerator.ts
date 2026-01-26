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

    // Sort books numerically by ID (e.g., QH1, QH2, QH10)
    const sortedBooks = [...books].sort((a, b) => {
        const idA = parseInt(a.id.replace(/\D/g, '')) || 0;
        const idB = parseInt(b.id.replace(/\D/g, '')) || 0;
        return idA - idB;
    });

    const tableData = sortedBooks.map(book => [book.id, book.title]);

    autoTable(doc, {
        startY: 40,
        head: [['ID', 'TITLE']],
        body: tableData,
        theme: 'grid',
        headStyles: {
            fillColor: [16, 185, 129],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            font: 'NotoSansMalayalam' // Ensure header also uses font if needed
        },
        styles: {
            fontSize: 10,
            cellPadding: 3,
            font: 'NotoSansMalayalam' // Set font for body cells
        },
        alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    doc.save('Albayan_Library_Catalog.pdf');
    setStatusMsg('Catalog downloaded as PDF!');
};
