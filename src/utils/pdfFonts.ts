import jsPDF from 'jspdf';

const fontCache: Record<string, string> = {};

async function loadFontAsBase64(url: string): Promise<string> {
  if (fontCache[url]) return fontCache[url];
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  fontCache[url] = base64;
  return base64;
}

/**
 * Load Roboto font (Latin + Cyrillic) into jsPDF instance.
 * Registers both Regular and Bold weights.
 */
export async function loadCyrillicFont(doc: jsPDF): Promise<void> {
  const [regularB64, boldB64] = await Promise.all([
    loadFontAsBase64('/fonts/Roboto-Regular.ttf'),
    loadFontAsBase64('/fonts/Roboto-Bold.ttf'),
  ]);

  doc.addFileToVFS('Roboto-Regular.ttf', regularB64);
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');

  doc.addFileToVFS('Roboto-Bold.ttf', boldB64);
  doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');

  doc.setFont('Roboto', 'normal');
}
