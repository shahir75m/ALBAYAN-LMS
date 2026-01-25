import QRCode from 'qrcode';

/**
 * Generate QR code as data URL for a given text
 * @param text - Text to encode in QR code
 * @param size - Size of QR code in pixels (default: 300)
 * @returns Promise with data URL of QR code image
 */
export const generateQRCode = async (text: string, size: number = 300): Promise<string> => {
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      width: size,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    });
    return dataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

/**
 * Generate QR code for a book ID
 * @param bookId - Unique book identifier
 * @param size - Size of QR code in pixels (default: 300)
 * @returns Promise with data URL of QR code image
 */
export const generateBookQRCode = async (bookId: string, size: number = 300): Promise<string> => {
  // Encode book ID in a structured format
  const qrData = `ALBAYAN:BOOK:${bookId}`;
  return generateQRCode(qrData, size);
};

/**
 * Generate a "Smart" QR code containing book metadata
 * @param book - Book object with metadata
 * @param size - Size of QR code in pixels (default: 300)
 * @returns Promise with data URL of QR code image
 */
export const generateSmartQRCode = async (book: { id: string, title: string, author: string, category: string }, size: number = 300): Promise<string> => {
  // Use short keys to save space in QR code
  const payload = {
    id: book.id,
    t: book.title,
    a: book.author,
    c: book.category
  };
  const qrData = `ALB_SMART:${JSON.stringify(payload)}`;
  return generateQRCode(qrData, size);
};

/**
 * Download QR code as PNG file
 * @param dataUrl - Data URL of QR code image
 * @param filename - Name for downloaded file
 */
export const downloadQRCode = (dataUrl: string, filename: string = 'qrcode.png') => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Print QR code
 * @param dataUrl - Data URL of QR code image
 * @param bookTitle - Optional book title to include in print
 */
export const printQRCode = (dataUrl: string, bookTitle?: string) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Print QR Code</title>
        <style>
          body {
            margin: 0;
            padding: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            font-family: Arial, sans-serif;
          }
          img {
            max-width: 400px;
            height: auto;
          }
          h2 {
            margin-top: 20px;
            text-align: center;
            color: #333;
          }
          @media print {
            body {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <img src="${dataUrl}" alt="QR Code" />
        ${bookTitle ? `<h2>${bookTitle}</h2>` : ''}
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();

  // Wait for image to load before printing
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };
};
