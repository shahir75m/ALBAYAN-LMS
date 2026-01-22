
const testCsv = "ID,Title,Author,Category,Year,ISBN,Cover URL,Price,Copies\nB1,Test Book 1,Author 1,Tech,2023,123456,http://example.com,100,10";

function parseCsv(text) {
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    console.log("Headers:", headers);
    const booksToImport = [];

    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = lines[i].split(',').map(v => v.trim());
        const bookData = {};

        headers.forEach((header, index) => {
            bookData[header] = values[index];
        });

        console.log("Book Data:", bookData);

        if (bookData.title && bookData.author) {
            const newBook = {
                id: bookData.id || `B${Date.now()}${i}`,
                title: bookData.title,
                author: bookData.author,
                category: bookData.category || 'General',
                year: parseInt(bookData.year) || new Date().getFullYear(),
                isbn: bookData.isbn || '---',
                coverUrl: bookData.coverurl || 'https://picsum.photos/seed/book/400/600',
                price: parseFloat(bookData.price) || 0,
                totalCopies: parseInt(bookData.copies) || 1,
                availableCopies: parseInt(bookData.copies) || 1,
                currentBorrowers: []
            };
            booksToImport.push(newBook);
        }
    }
    return booksToImport;
}

const result = parseCsv(testCsv);
console.log("Result:", JSON.stringify(result, null, 2));
