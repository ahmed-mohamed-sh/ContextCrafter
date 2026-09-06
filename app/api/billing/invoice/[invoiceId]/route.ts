import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { invoiceId } = await params;

    const invoice = await db.invoice.findFirst({
      where: {
        userId: session.user.id,
        OR: [{ id: invoiceId }, { invoiceNumber: invoiceId }],
      },
      include: { user: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const htmlReceipt = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${invoice.invoiceNumber} - ContextCrafter</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b1326; color: #dae2fd; padding: 40px; margin: 0; }
    .receipt-box { max-width: 650px; margin: 0 auto; background: #131b2e; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 36px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 20px; }
    .logo { font-size: 20px; font-weight: 700; color: #c3c0ff; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; background: rgba(34,197,94,0.2); color: #86efac; }
    .details { margin: 24px 0; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 13px; }
    .details dt { color: #918fa1; margin-bottom: 4px; }
    .details dd { margin: 0; font-weight: 600; color: #ffffff; }
    .table { width: 100%; border-collapse: collapse; margin: 24px 0; }
    .table th { text-align: left; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1); font-size: 12px; color: #918fa1; }
    .table td { padding: 14px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 14px; }
    .total-row { display: flex; justify-content: space-between; font-size: 18px; font-weight: 700; color: #4cd7f6; margin-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px; }
    .footer { text-align: center; margin-top: 32px; font-size: 11px; color: #918fa1; }
    @media print {
      body { background: white; color: black; padding: 0; }
      .receipt-box { border: none; box-shadow: none; background: white; color: black; }
      .details dd, .table td { color: black; }
    }
  </style>
</head>
<body>
  <div class="receipt-box">
    <div class="header">
      <div>
        <div class="logo">ContextCrafter</div>
        <div style="font-size: 12px; color: #918fa1; margin-top: 4px;">Codebase Intelligence & Architecture AI</div>
      </div>
      <div>
        <span class="badge">PAID</span>
      </div>
    </div>

    <div class="details">
      <div>
        <dt>Invoice Number</dt>
        <dd>${invoice.invoiceNumber}</dd>
      </div>
      <div>
        <dt>Date Issued</dt>
        <dd>${new Date(invoice.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</dd>
      </div>
      <div>
        <dt>Billed To</dt>
        <dd>${invoice.user?.name || invoice.user?.email || "Workspace Owner"}</dd>
      </div>
      <div>
        <dt>Payment Method</dt>
        <dd>${invoice.paymentMethod}</dd>
      </div>
    </div>

    <table class="table">
      <thead>
        <tr>
          <th>Description</th>
          <th style="text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${invoice.plan} (Monthly Subscription)</td>
          <td style="text-align: right;">$${invoice.amount.toFixed(2)} USD</td>
        </tr>
      </tbody>
    </table>

    <div class="total-row">
      <span>Total Paid</span>
      <span>$${invoice.amount.toFixed(2)} USD</span>
    </div>

    <div class="footer">
      <p>Thank you for using ContextCrafter! If you have any questions, reach out to billing@contextcrafter.com.</p>
    </div>
  </div>
</body>
</html>
    `;

    return new Response(htmlReceipt, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error: any) {
    console.error("[INVOICE_GET_ERROR]", error);
    return NextResponse.json({ error: "Failed to generate receipt" }, { status: 500 });
  }
}
