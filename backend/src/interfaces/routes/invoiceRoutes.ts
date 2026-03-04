import { Router } from 'express';
import { asyncHandler } from '../../shared/middleware/asyncHandler';
import { authMiddleware } from '../../shared/middleware/authMiddleware';
import { standardLimiter } from '../../shared/middleware/rateLimiter';
import { InvoiceController } from '../controllers/InvoiceController';

const router = Router();
const invoiceController = new InvoiceController();

/**
 * @swagger
 * tags:
 *   name: Invoices
 *   description: Invoice generation and management endpoints
 */

/**
 * @swagger
 * /api/v1/invoices:
 *   post:
 *     summary: Create a new invoice for a project
 *     description: |
 *       Creates an invoice for an existing project. Requires client information
 *       (name, email, address). The project must belong to the authenticated user
 *       and must not already have an invoice.
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - project_id
 *               - client_name
 *               - client_email
 *               - client_location
 *             properties:
 *               project_id:
 *                 type: integer
 *                 description: ID of the project to create an invoice for
 *                 example: 1
 *               client_name:
 *                 type: string
 *                 description: Full name of the client
 *                 example: "Chea Dara"
 *               client_email:
 *                 type: string
 *                 format: email
 *                 description: Email address of the client
 *                 example: "cheadara133@gmail.com"
 *               client_location:
 *                 type: string
 *                 description: Address/location of the client
 *                 example: "Phnom Penh, Cambodia"
 *               invoice_date:
 *                 type: string
 *                 format: date
 *                 description: Invoice date (defaults to today)
 *                 example: "2025-12-24"
 *     responses:
 *       201:
 *         description: Invoice created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Invoice created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Invoice'
 *       400:
 *         description: Validation error (missing or invalid fields)
 *       404:
 *         description: Project not found
 *       409:
 *         description: Invoice already exists for this project
 */
router.post(
  '/',
  authMiddleware,
  standardLimiter,
  asyncHandler((req, res) => invoiceController.createInvoice(req, res))
);

/**
 * @swagger
 * /api/v1/invoices:
 *   get:
 *     summary: List all invoices for the authenticated user
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of invoices
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Invoices retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Invoice'
 */
router.get(
  '/',
  authMiddleware,
  standardLimiter,
  asyncHandler((req, res) => invoiceController.getUserInvoices(req, res))
);

/**
 * @swagger
 * /api/v1/invoices/{invoiceId}:
 *   get:
 *     summary: Get invoice details with project, deliverables, and freelancer info
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the invoice
 *     responses:
 *       200:
 *         description: Full invoice data including project details and user info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/InvoiceDetail'
 *       404:
 *         description: Invoice not found
 *       403:
 *         description: Not authorized to view this invoice
 */
router.get(
  '/:invoiceId',
  authMiddleware,
  standardLimiter,
  asyncHandler((req, res) => invoiceController.getInvoice(req, res))
);

/**
 * @swagger
 * /api/v1/invoices/{invoiceId}/pdf:
 *   get:
 *     summary: Download invoice as PDF
 *     description: Generates and downloads the invoice as a PDF file matching the AUREA invoice design.
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the invoice
 *     responses:
 *       200:
 *         description: PDF file
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Invoice not found
 *       403:
 *         description: Not authorized
 */
router.get(
  '/:invoiceId/pdf',
  authMiddleware,
  standardLimiter,
  asyncHandler((req, res) => invoiceController.downloadInvoicePdf(req, res))
);

/**
 * @swagger
 * /api/v1/invoices/{invoiceId}:
 *   delete:
 *     summary: Delete an invoice
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the invoice to delete
 *     responses:
 *       204:
 *         description: Invoice deleted successfully
 *       404:
 *         description: Invoice not found
 *       403:
 *         description: Not authorized to delete this invoice
 */
router.delete(
  '/:invoiceId',
  authMiddleware,
  standardLimiter,
  asyncHandler((req, res) => invoiceController.deleteInvoice(req, res))
);

export default router;
