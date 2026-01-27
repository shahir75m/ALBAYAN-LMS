import { Book } from '../types';

export const downloadCatalogPDF = (books: Book[], setStatusMsg: (msg: string) => void) => {
    setStatusMsg('Preparing print dialog...');

    // 1. Group and sort books
    const sortedBooks = [...books].sort((a, b) => {
        if (a.category !== b.category) return a.category.localeCompare(b.category);
        const idA = parseInt(a.id.replace(/\D/g, '')) || 0;
        const idB = parseInt(b.id.replace(/\D/g, '')) || 0;
        return idA - idB;
    });

    const dateStr = new Date().toLocaleDateString();

    let htmlContent = `
    <html>
    <head>
        <title>Albayan Library Catalog</title>
        <style>
            body { font-family: 'Noto Sans Malayalam', 'Arial', sans-serif; padding: 20px; color: #000; }
            h1 { font-size: 24px; font-weight: bold; margin-bottom: 5px; color: #10b981; text-align: center; }
            p { font-size: 14px; color: #666; text-align: center; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th { background-color: #10b981; color: white; padding: 10px; text-align: left; border: 1px solid #e5e7eb; }
            td { padding: 8px 10px; border: 1px solid #e5e7eb; vertical-align: top; }
            tr.category-row td { background-color: #f3f4f6; font-weight: bold; text-align: center; color: #374151; padding: 10px; font-size: 14px; }
            /* Print Specifics */
            @media print {
                @page { margin: 15mm; size: A4; }
                body { padding: 0; }
                h1 { color: #000 !important; }
                th { background-color: #eee !important; color: #000 !important; font-weight: bold; }
                tr.category-row td { background-color: #ddd !important; }
            }
        </style>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Malayalam:wght@400;500;700&display=swap" rel="stylesheet">
    </head>
    <body>
        <h1>ALBAYAN LIBRARY CATALOG</h1>
        <p>Generated on: ${dateStr}</p>
        <table>
            <thead>
                <tr>
                    <th style="width: 15%">ID</th>
                    <th>TITLE</th>
                </tr>
            </thead>
            <tbody>
    `;

    let currentCategory = '';
    sortedBooks.forEach(book => {
        if (book.category !== currentCategory) {
            currentCategory = book.category;
            htmlContent += `
                <tr class="category-row">
                    <td colspan="2">${currentCategory}</td>
                </tr>
            `;
        }
        htmlContent += `
            <tr>
                <td>${book.id}</td>
                <td style="font-weight: 500;">${book.title}</td>
            </tr>
        `;
    });

    htmlContent += `
            </tbody>
        </table>
    </body>
    </html>
    `;

    // Open a new window for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();

        // Wait for content (especially fonts) to load then print
        printWindow.onload = () => {
            printWindow.focus();
            printWindow.print();
            // Optional: printWindow.close(); // Don't auto-close, let user decide
            setStatusMsg('Print dialog opened. Please save as PDF.');
        };
        // Fallback if onload doesn't fire immediately
        setTimeout(() => {
            if (printWindow.document.readyState === 'complete') {
                printWindow.focus();
                printWindow.print();
                setStatusMsg('Print dialog opened. Please save as PDF.');
            }
        }, 1000);
    } else {
        setStatusMsg('Popup blocked. Please allow popups to print/download catalog.');
    }
};
