import PDFDocument from 'pdfkit';
import { Invoice } from '../data/billing.js';
import { PsychologistBillingSettings } from '../data/billing.js';
import { getUsers } from '../data/users.js';

export function generateInvoicePDF(
  invoice: Invoice,
  billingSettings: PsychologistBillingSettings | null,
  psychologistName: string,
  patientName: string
): NodeJS.ReadableStream {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  
  // Header
  doc.fontSize(20).text('FACTURĂ', { align: 'center' });
  doc.moveDown();
  
  // Company Info
  if (billingSettings?.companyName) {
    doc.fontSize(14).text(billingSettings.companyName, { align: 'left' });
  } else {
    doc.fontSize(14).text(psychologistName, { align: 'left' });
  }
  
  if (billingSettings?.address) {
    doc.fontSize(10).text(billingSettings.address, { align: 'left' });
  }
  
  if (billingSettings?.taxId) {
    doc.fontSize(10).text(`CUI: ${billingSettings.taxId}`, { align: 'left' });
  }
  
  if (billingSettings?.phone) {
    doc.fontSize(10).text(`Tel: ${billingSettings.phone}`, { align: 'left' });
  }
  
  if (billingSettings?.email) {
    doc.fontSize(10).text(`Email: ${billingSettings.email}`, { align: 'left' });
  }
  
  doc.moveDown(2);
  
  // Invoice Details
  doc.fontSize(12).text(`Număr factură: ${invoice.invoiceNumber}`, { align: 'right' });
  doc.fontSize(10).text(`Data: ${new Date(invoice.date).toLocaleDateString('ro-RO')}`, { align: 'right' });
  doc.fontSize(10).text(`Scadență: ${new Date(invoice.dueDate).toLocaleDateString('ro-RO')}`, { align: 'right' });
  
  doc.moveDown(2);
  
  // Bill To
  doc.fontSize(12).text('Facturat către:', { underline: true });
  doc.fontSize(10).text(patientName);
  doc.moveDown();
  
  // Items Table
  const tableTop = doc.y;
  const itemHeight = 30;
  const startX = 50;
  const colWidths = { description: 250, quantity: 80, price: 100, total: 100 };
  
  // Table Header
  doc.fontSize(10).font('Helvetica-Bold');
  doc.text('Descriere', startX, tableTop);
  doc.text('Cantitate', startX + colWidths.description, tableTop);
  doc.text('Preț unitar', startX + colWidths.description + colWidths.quantity, tableTop);
  doc.text('Total', startX + colWidths.description + colWidths.quantity + colWidths.price, tableTop);
  
  // Draw line under header
  doc.moveTo(startX, tableTop + 15)
    .lineTo(startX + colWidths.description + colWidths.quantity + colWidths.price + colWidths.total, tableTop + 15)
    .stroke();
  
  // Table Rows
  let currentY = tableTop + 25;
  doc.font('Helvetica').fontSize(10);
  
  invoice.items.forEach((item) => {
    doc.text(item.description || '', startX, currentY, { width: colWidths.description });
    doc.text(item.quantity.toString(), startX + colWidths.description, currentY, { width: colWidths.quantity, align: 'center' });
    doc.text(`${item.unitPrice.toFixed(2)} ${billingSettings?.currency || 'RON'}`, startX + colWidths.description + colWidths.quantity, currentY, { width: colWidths.price, align: 'right' });
    doc.text(`${item.total.toFixed(2)} ${billingSettings?.currency || 'RON'}`, startX + colWidths.description + colWidths.quantity + colWidths.price, currentY, { width: colWidths.total, align: 'right' });
    currentY += itemHeight;
  });
  
  // Totals
  const totalsY = currentY + 10;
  doc.font('Helvetica-Bold').fontSize(10);
  doc.text('Subtotal:', startX + colWidths.description + colWidths.quantity, totalsY, { align: 'right', width: colWidths.price });
  doc.text(`${invoice.subtotal.toFixed(2)} ${billingSettings?.currency || 'RON'}`, startX + colWidths.description + colWidths.quantity + colWidths.price, totalsY, { align: 'right', width: colWidths.total });
  
  if (invoice.tax && invoice.tax > 0) {
    doc.font('Helvetica-Bold').fontSize(10);
    doc.text(`TVA (${billingSettings?.taxRate || 19}%):`, startX + colWidths.description + colWidths.quantity, totalsY + 20, { align: 'right', width: colWidths.price });
    doc.text(`${invoice.tax.toFixed(2)} ${billingSettings?.currency || 'RON'}`, startX + colWidths.description + colWidths.quantity + colWidths.price, totalsY + 20, { align: 'right', width: colWidths.total });
  }
  
  doc.font('Helvetica-Bold').fontSize(12);
  doc.text('TOTAL:', startX + colWidths.description + colWidths.quantity, totalsY + 40, { align: 'right', width: colWidths.price });
  doc.text(`${invoice.total.toFixed(2)} ${billingSettings?.currency || 'RON'}`, startX + colWidths.description + colWidths.quantity + colWidths.price, totalsY + 40, { align: 'right', width: colWidths.total });
  
  // Draw line above total
  doc.moveTo(startX + colWidths.description + colWidths.quantity, totalsY + 35)
    .lineTo(startX + colWidths.description + colWidths.quantity + colWidths.price + colWidths.total, totalsY + 35)
    .stroke();
  
  // Payment Info
  if (invoice.status === 'paid' && invoice.paymentDate) {
    doc.moveDown(2);
    doc.font('Helvetica').fontSize(10);
    doc.text(`Plătită pe: ${new Date(invoice.paymentDate).toLocaleDateString('ro-RO')}`, { align: 'left' });
    if (invoice.paymentMethod) {
      doc.text(`Metodă plată: ${invoice.paymentMethod}`, { align: 'left' });
    }
  }
  
  // Notes
  if (invoice.notes) {
    doc.moveDown(2);
    doc.font('Helvetica').fontSize(10);
    doc.text('Note:', { underline: true });
    doc.text(invoice.notes, { align: 'left' });
  }
  
  // Footer
  doc.fontSize(8)
    .text('Această factură a fost generată electronic și este valabilă fără semnătură.', 50, doc.page.height - 50, { align: 'center' });
  
  // Bank Account Info
  if (billingSettings?.iban) {
    doc.moveDown();
    doc.fontSize(8).text(`IBAN: ${billingSettings.iban}`, { align: 'center' });
  }
  
  doc.end();
  
  return doc;
}
