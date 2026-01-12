import express from 'express';
import { AuthRequest } from '../middleware/auth.js';
import {
  getBillingSettingsByPsychologist,
  createOrUpdateBillingSettings,
  createInvoice,
  getInvoicesByPsychologist,
  getInvoiceById,
  updateInvoice,
  markInvoiceAsPaid
} from '../data/billing.js';
import { getUsers } from '../data/users.js';
import { generateInvoicePDF } from '../utils/pdfGenerator.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Billing Settings
router.get('/settings', async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'psychologist') {
      return res.status(403).json({ error: 'Only psychologists can access billing settings' });
    }

    const settings = getBillingSettingsByPsychologist(req.userId!);
    res.json(settings || {
      currency: 'RON',
      invoicePrefix: 'INV'
    });
  } catch (error) {
    console.error('Error fetching billing settings:', error);
    res.status(500).json({ error: 'Failed to fetch billing settings' });
  }
});

router.post('/settings', async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'psychologist') {
      return res.status(403).json({ error: 'Only psychologists can update billing settings' });
    }

    const settings = createOrUpdateBillingSettings(req.userId!, req.body);
    res.json(settings);
  } catch (error) {
    console.error('Error updating billing settings:', error);
    res.status(500).json({ error: 'Failed to update billing settings' });
  }
});

// Invoices
router.get('/invoices', async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'psychologist') {
      return res.status(403).json({ error: 'Only psychologists can view invoices' });
    }

    const invoices = getInvoicesByPsychologist(req.userId!);
    res.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

router.get('/invoices/:id', async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'psychologist') {
      return res.status(403).json({ error: 'Only psychologists can view invoices' });
    }

    const invoice = getInvoiceById(req.params.id, req.userId!);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
});

router.post('/invoices', async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'psychologist') {
      return res.status(403).json({ error: 'Only psychologists can create invoices' });
    }

    const { patientId, date, dueDate, items, tax, notes } = req.body;

    if (!patientId || !date || !dueDate || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify patient belongs to psychologist
    const users = getUsers();
    const patient = users.find(u => u.id === patientId);
    if (!patient || patient.psychologistId !== req.userId) {
      return res.status(404).json({ error: 'Patient not found or access denied' });
    }

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);
    const taxAmount = tax ? (subtotal * tax / 100) : 0;
    const total = subtotal + taxAmount;

    const invoice = createInvoice(req.userId!, {
      patientId,
      date,
      dueDate,
      items: items.map((item: any) => ({
        id: uuidv4(),
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice
      })),
      subtotal,
      tax: taxAmount,
      total,
      status: 'draft',
      notes
    });

    res.status(201).json(invoice);
  } catch (error: any) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: error.message || 'Failed to create invoice' });
  }
});

router.put('/invoices/:id', async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'psychologist') {
      return res.status(403).json({ error: 'Only psychologists can update invoices' });
    }

    const invoice = updateInvoice(req.params.id, req.userId!, req.body);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ error: 'Failed to update invoice' });
  }
});

router.post('/invoices/:id/mark-paid', async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'psychologist') {
      return res.status(403).json({ error: 'Only psychologists can mark invoices as paid' });
    }

    const { paymentMethod, paymentDate } = req.body;
    if (!paymentMethod) {
      return res.status(400).json({ error: 'Payment method is required' });
    }

    const invoice = markInvoiceAsPaid(req.params.id, req.userId!, paymentMethod, paymentDate);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error) {
    console.error('Error marking invoice as paid:', error);
    res.status(500).json({ error: 'Failed to mark invoice as paid' });
  }
});

router.get('/invoices/:id/pdf', async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'psychologist') {
      return res.status(403).json({ error: 'Only psychologists can download invoice PDFs' });
    }

    const invoice = getInvoiceById(req.params.id, req.userId!);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const users = getUsers();
    const psychologist = users.find(u => u.id === req.userId);
    const patient = users.find(u => u.id === invoice.patientId);
    
    if (!psychologist || !patient) {
      return res.status(404).json({ error: 'Psychologist or patient not found' });
    }

    const billingSettings = getBillingSettingsByPsychologist(req.userId!);

    // Generate PDF
    const pdfStream = generateInvoicePDF(
      invoice,
      billingSettings,
      psychologist.name,
      patient.name
    );

    // Set headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="factura-${invoice.invoiceNumber}.pdf"`);

    // Pipe PDF to response
    pdfStream.pipe(res);
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    res.status(500).json({ error: 'Failed to generate invoice PDF' });
  }
});

export default router;
