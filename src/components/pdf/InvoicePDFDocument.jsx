import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { numberToWordsINR } from '../../utils/invoiceCalculations';

const styles = StyleSheet.create({
  page: {
    size: 'A4',
    paddingTop: 24,
    paddingBottom: 28,
    paddingHorizontal: 24,
    fontFamily: 'Helvetica',
    fontSize: 8,
    color: '#000000',
    backgroundColor: '#FFFFFF',
    lineHeight: 1.3,
  },
  container: {
    borderWidth: 1,
    borderColor: '#000000',
  },
  // Header styles
  header: {
    padding: 10,
    textAlign: 'center',
    borderBottomWidth: 1,
    borderColor: '#000000',
  },
  businessName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 14,
    textTransform: 'uppercase',
    marginBottom: 3,
    letterSpacing: 0.5,
  },
  businessAddress: {
    fontSize: 8,
    color: '#222222',
    marginBottom: 2,
    maxWidth: 400,
    alignSelf: 'center',
  },
  businessContact: {
    fontSize: 8,
    color: '#222222',
  },
  // Banner
  banner: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderColor: '#000000',
    textAlign: 'center',
  },
  bannerText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  // Two Column Meta Grid
  metaGrid: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#000000',
  },
  metaLeft: {
    flex: 1,
    padding: 6,
    borderRightWidth: 1,
    borderColor: '#000000',
  },
  metaRight: {
    flex: 1,
    padding: 6,
    backgroundColor: '#FAFAFA',
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 2.5,
  },
  metaLabel: {
    fontFamily: 'Helvetica-Bold',
    width: 75,
    fontSize: 8,
  },
  metaValue: {
    flex: 1,
    fontSize: 8,
  },
  metaHeading: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
    textTransform: 'uppercase',
    color: '#4B5563',
    marginBottom: 4,
    paddingBottom: 2,
    borderBottomWidth: 0.5,
    borderColor: '#E5E7EB',
  },
  // Billed To Box
  receiverBox: {
    padding: 6,
    borderBottomWidth: 1,
    borderColor: '#000000',
  },
  receiverHeader: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    paddingBottom: 2,
    borderBottomWidth: 0.5,
    borderColor: '#E5E7EB',
  },
  receiverGrid: {
    flexDirection: 'row',
  },
  receiverCol: {
    flex: 1,
  },
  // Table
  table: {
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderBottomWidth: 1,
    borderColor: '#000000',
    alignItems: 'stretch',
    minHeight: 20,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderColor: '#000000',
    alignItems: 'stretch',
    minHeight: 18,
  },
  // Table Cell Base & Column Widths
  cellBase: {
    justifyContent: 'center',
    borderRightWidth: 0.5,
    borderColor: '#000000',
    paddingVertical: 2,
  },
  colNo: { width: '4%', alignItems: 'center', paddingHorizontal: 1 },
  colDesc: { flex: 1, alignItems: 'flex-start', paddingHorizontal: 4 },
  colHsn: { width: '10%', alignItems: 'center', paddingHorizontal: 2 },
  colQty: { width: '6%', alignItems: 'center', paddingHorizontal: 2 },
  colUom: { width: '6%', alignItems: 'center', paddingHorizontal: 2 },
  colRate: { width: '10%', alignItems: 'flex-end', paddingHorizontal: 4 },
  colTaxable: { width: '12%', alignItems: 'flex-end', paddingHorizontal: 4 },
  colCgst: { width: '10%', alignItems: 'flex-end', paddingHorizontal: 3 },
  colSgst: { width: '10%', alignItems: 'flex-end', paddingHorizontal: 3 },
  colTotal: { width: '12%', alignItems: 'flex-end', paddingHorizontal: 4, borderRightWidth: 0 },

  tableTotalRow: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderColor: '#000000',
    alignItems: 'stretch',
    minHeight: 18,
  },
  // Bottom Section
  bottomSection: {
    flexDirection: 'row',
  },
  bottomLeft: {
    flex: 1.1,
    padding: 6,
    borderRightWidth: 1,
    borderColor: '#000000',
    justifyContent: 'space-between',
  },
  bottomRight: {
    flex: 0.9,
    justifyContent: 'space-between',
  },
  wordsContainer: {
    marginBottom: 6,
  },
  wordsLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
    marginBottom: 2,
  },
  wordsBox: {
    fontFamily: 'Helvetica-Oblique',
    fontSize: 8,
    backgroundColor: '#FAFAFA',
    borderWidth: 0.5,
    borderColor: '#D1D5DB',
    padding: 4,
    lineHeight: 1.3,
  },
  bankBox: {
    borderWidth: 0.5,
    borderColor: '#000000',
    padding: 5,
    marginBottom: 6,
    backgroundColor: '#FFFFFF',
  },
  bankHeader: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
    paddingBottom: 2,
    borderBottomWidth: 0.5,
    borderColor: '#E5E7EB',
  },
  bankRow: {
    flexDirection: 'row',
    marginBottom: 1.5,
  },
  bankLabel: {
    width: 60,
    fontSize: 7,
    color: '#4B5563',
  },
  bankValue: {
    flex: 1,
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
  },
  declarationText: {
    fontSize: 6.5,
    color: '#4B5563',
    fontFamily: 'Helvetica-Oblique',
  },
  // Calculation summary
  summaryTable: {
    borderBottomWidth: 1,
    borderColor: '#000000',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderColor: '#E5E7EB',
    fontSize: 8,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingVertical: 4,
    backgroundColor: '#F3F4F6',
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
  },
  signatoryContainer: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 70,
  },
  signatoryCompany: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
    textTransform: 'uppercase',
    marginBottom: 26,
    textAlign: 'center',
  },
  signatoryLine: {
    borderTopWidth: 0.5,
    borderTopColor: '#6B7280',
    width: 120,
    textAlign: 'center',
    paddingTop: 2,
    fontSize: 7,
    color: '#4B5563',
  },
  pageFooter: {
    position: 'absolute',
    bottom: 12,
    left: 24,
    right: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7,
    color: '#6B7280',
  },
});

function formatNum(val) {
  const n = Number(val) || 0;
  return n.toFixed(2);
}

function formatDateStr(dateVal) {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function InvoicePDFDocument({ invoice, items = [], businessSettings = {} }) {
  const totalQty = items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);

  return (
    <Document title={`Invoice ${invoice?.invoice_number || ''}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.container}>
          {/* 1. Header: Store Branding */}
          <View style={styles.header}>
            <Text style={styles.businessName}>
              {businessSettings?.business_name || 'WANDOOR PAPER MART'}
            </Text>
            <Text style={styles.businessAddress}>
              {businessSettings?.address || 'Main Road, Near Bus Stand, Wandoor, Malappuram, Kerala - 679328'}
            </Text>
            <Text style={styles.businessContact}>
              Mobile: {businessSettings?.mobile || '9876543210'}
            </Text>
          </View>

          {/* 2. Banner */}
          <View style={styles.banner}>
            <Text style={styles.bannerText}>TAX INVOICE</Text>
          </View>

          {/* 3. Metadata Grid */}
          <View style={styles.metaGrid}>
            <View style={styles.metaLeft}>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>GST No :</Text>
                <Text style={[styles.metaValue, { fontFamily: 'Helvetica-Bold' }]}>
                  {businessSettings?.gst_no || '32ABCDE1234F1Z5'}
                </Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Invoice No :</Text>
                <Text style={[styles.metaValue, { fontFamily: 'Helvetica-Bold' }]}>
                  {invoice?.invoice_number || '-'}
                </Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Invoice Date :</Text>
                <Text style={styles.metaValue}>
                  {formatDateStr(invoice?.invoice_date)}
                </Text>
              </View>
            </View>

            <View style={styles.metaRight}>
              <Text style={styles.metaHeading}>Supply & Delivery Information</Text>
              <View style={styles.metaRow}>
                <Text style={[styles.metaLabel, { width: 95 }]}>Place of Supply :</Text>
                <Text style={styles.metaValue}>Kerala (State Code: 32)</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={[styles.metaLabel, { width: 95 }]}>Supply Category :</Text>
                <Text style={styles.metaValue}>Intra-State</Text>
              </View>
            </View>
          </View>

          {/* 4. Receiver (Billed To) Box */}
          <View style={styles.receiverBox}>
            <Text style={styles.receiverHeader}>Details Of Receiver (Billed To)</Text>
            <View style={styles.receiverGrid}>
              <View style={styles.receiverCol}>
                <View style={styles.metaRow}>
                  <Text style={[styles.metaLabel, { width: 50 }]}>Name :</Text>
                  <Text style={[styles.metaValue, { fontFamily: 'Helvetica-Bold' }]}>
                    {invoice?.customer_name || '-'}
                  </Text>
                </View>
                {Boolean(invoice?.customer_address) && (
                  <View style={styles.metaRow}>
                    <Text style={[styles.metaLabel, { width: 50 }]}>Address :</Text>
                    <Text style={styles.metaValue}>{invoice.customer_address}</Text>
                  </View>
                )}
              </View>
              <View style={styles.receiverCol}>
                {Boolean(invoice?.customer_mobile) && (
                  <View style={styles.metaRow}>
                    <Text style={[styles.metaLabel, { width: 55 }]}>Mobile :</Text>
                    <Text style={styles.metaValue}>{invoice.customer_mobile}</Text>
                  </View>
                )}
                {Boolean(invoice?.customer_gst_no) && (
                  <View style={styles.metaRow}>
                    <Text style={[styles.metaLabel, { width: 55 }]}>GST No :</Text>
                    <Text style={[styles.metaValue, { fontFamily: 'Helvetica-Bold' }]}>
                      {invoice.customer_gst_no}
                    </Text>
                  </View>
                )}
                <View style={styles.metaRow}>
                  <Text style={[styles.metaLabel, { width: 55 }]}>State :</Text>
                  <Text style={styles.metaValue}>Kerala (32)</Text>
                </View>
              </View>
            </View>
          </View>

          {/* 5. Line Items Table */}
          <View style={styles.table}>
            {/* Table Header: fixed repeats this header across multiple pages */}
            <View style={styles.tableHeader} fixed>
              <View style={[styles.cellBase, styles.colNo]}>
                <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 7.5, textAlign: 'center' }}>No</Text>
              </View>
              <View style={[styles.cellBase, styles.colDesc]}>
                <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 7.5 }}>Description Of Goods</Text>
              </View>
              <View style={[styles.cellBase, styles.colHsn]}>
                <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 7.5, textAlign: 'center' }}>HSN Code</Text>
              </View>
              <View style={[styles.cellBase, styles.colQty]}>
                <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 7.5, textAlign: 'center' }}>Qty</Text>
              </View>
              <View style={[styles.cellBase, styles.colUom]}>
                <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 7.5, textAlign: 'center' }}>UOM</Text>
              </View>
              <View style={[styles.cellBase, styles.colRate]}>
                <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 7.5, textAlign: 'right' }}>Unit Rate</Text>
              </View>
              <View style={[styles.cellBase, styles.colTaxable]}>
                <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 7.5, textAlign: 'right' }}>Taxable Val</Text>
              </View>
              <View style={[styles.cellBase, styles.colCgst]}>
                <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 7.5, textAlign: 'right' }}>CGST</Text>
              </View>
              <View style={[styles.cellBase, styles.colSgst]}>
                <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 7.5, textAlign: 'right' }}>SGST</Text>
              </View>
              <View style={[styles.cellBase, styles.colTotal]}>
                <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 7.5, textAlign: 'right' }}>Total</Text>
              </View>
            </View>

            {/* Item Rows: wrap={false} prevents rows from being sliced across page breaks */}
            {items.map((item, index) => (
              <View key={item.id || index} style={styles.tableRow} wrap={false}>
                <View style={[styles.cellBase, styles.colNo]}>
                  <Text style={{ fontSize: 7.5, textAlign: 'center' }}>{index + 1}</Text>
                </View>
                <View style={[styles.cellBase, styles.colDesc]}>
                  <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 7.5 }}>{item.item_name}</Text>
                </View>
                <View style={[styles.cellBase, styles.colHsn]}>
                  <Text style={{ fontSize: 7.5, textAlign: 'center' }}>{item.hsn_code || '-'}</Text>
                </View>
                <View style={[styles.cellBase, styles.colQty]}>
                  <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 7.5, textAlign: 'center' }}>{item.qty}</Text>
                </View>
                <View style={[styles.cellBase, styles.colUom]}>
                  <Text style={{ fontSize: 7.5, textAlign: 'center' }}>{item.uom || 'PCS'}</Text>
                </View>
                <View style={[styles.cellBase, styles.colRate]}>
                  <Text style={{ fontSize: 7.5, textAlign: 'right' }}>{formatNum(item.unit_rate)}</Text>
                </View>
                <View style={[styles.cellBase, styles.colTaxable]}>
                  <Text style={{ fontSize: 7.5, textAlign: 'right' }}>{formatNum(item.taxable_value)}</Text>
                </View>
                <View style={[styles.cellBase, styles.colCgst]}>
                  <Text style={{ fontSize: 7.5, textAlign: 'right' }}>{formatNum(item.cgst_amount)}</Text>
                  <Text style={{ fontSize: 6, color: '#4B5563', textAlign: 'right' }}>({item.cgst_rate}%)</Text>
                </View>
                <View style={[styles.cellBase, styles.colSgst]}>
                  <Text style={{ fontSize: 7.5, textAlign: 'right' }}>{formatNum(item.sgst_amount)}</Text>
                  <Text style={{ fontSize: 6, color: '#4B5563', textAlign: 'right' }}>({item.sgst_rate}%)</Text>
                </View>
                <View style={[styles.cellBase, styles.colTotal]}>
                  <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 7.5, textAlign: 'right' }}>{formatNum(item.total)}</Text>
                </View>
              </View>
            ))}

            {/* Table Totals Row */}
            <View style={styles.tableTotalRow} wrap={false}>
              <View style={[styles.cellBase, styles.colNo, { borderRightWidth: 0 }]} />
              <View style={[styles.cellBase, styles.colDesc, { alignItems: 'center' }]}>
                <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 7.5 }}>TOTAL</Text>
              </View>
              <View style={[styles.cellBase, styles.colHsn]} />
              <View style={[styles.cellBase, styles.colQty]}>
                <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 7.5, textAlign: 'center' }}>{totalQty}</Text>
              </View>
              <View style={[styles.cellBase, styles.colUom]} />
              <View style={[styles.cellBase, styles.colRate]} />
              <View style={[styles.cellBase, styles.colTaxable]}>
                <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 7.5, textAlign: 'right' }}>{formatNum(invoice?.taxable_value)}</Text>
              </View>
              <View style={[styles.cellBase, styles.colCgst]}>
                <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 7.5, textAlign: 'right' }}>{formatNum(invoice?.total_cgst)}</Text>
              </View>
              <View style={[styles.cellBase, styles.colSgst]}>
                <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 7.5, textAlign: 'right' }}>{formatNum(invoice?.total_sgst)}</Text>
              </View>
              <View style={[styles.cellBase, styles.colTotal]}>
                <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 7.5, textAlign: 'right' }}>{formatNum(invoice?.grand_total)}</Text>
              </View>
            </View>
          </View>

          {/* 6. Footer Section: Amount in Words, Bank Details, and Signatory */}
          <View style={styles.bottomSection} wrap={false}>
            {/* Left Column */}
            <View style={styles.bottomLeft}>
              <View style={styles.wordsContainer}>
                <Text style={styles.wordsLabel}>Total Amount in Words:</Text>
                <Text style={styles.wordsBox}>
                  {numberToWordsINR(invoice?.grand_total)}
                </Text>
              </View>

              {/* Bank Details from Settings */}
              <View style={styles.bankBox}>
                <Text style={styles.bankHeader}>Bank Details</Text>
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>Bank Name:</Text>
                  <Text style={styles.bankValue}>
                    {businessSettings?.bank_name || 'State Bank of India'}
                  </Text>
                </View>
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>Branch:</Text>
                  <Text style={styles.bankValue}>
                    {businessSettings?.bank_branch || 'Wandoor Branch'}
                  </Text>
                </View>
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>Account No:</Text>
                  <Text style={styles.bankValue}>
                    {businessSettings?.account_number || '384729104928'}
                  </Text>
                </View>
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>IFSC Code:</Text>
                  <Text style={styles.bankValue}>
                    {businessSettings?.ifsc_code || 'SBIN0070188'}
                  </Text>
                </View>
              </View>

              <Text style={styles.declarationText}>
                Certified that the particulars given above are true and correct.
              </Text>
            </View>

            {/* Right Column: Breakdown & Authorised Signatory */}
            <View style={styles.bottomRight}>
              <View style={styles.summaryTable}>
                <View style={styles.summaryRow}>
                  <Text>Taxable Value :</Text>
                  <Text style={{ fontFamily: 'Helvetica-Bold' }}>
                    Rs. {formatNum(invoice?.taxable_value)}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text>Total CGST :</Text>
                  <Text style={{ fontFamily: 'Helvetica-Bold' }}>
                    Rs. {formatNum(invoice?.total_cgst)}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text>Total SGST :</Text>
                  <Text style={{ fontFamily: 'Helvetica-Bold' }}>
                    Rs. {formatNum(invoice?.total_sgst)}
                  </Text>
                </View>
                <View style={styles.grandTotalRow}>
                  <Text>Grand Total :</Text>
                  <Text>Rs. {formatNum(invoice?.grand_total)}</Text>
                </View>
              </View>

              <View style={styles.signatoryContainer}>
                <Text style={styles.signatoryCompany}>
                  For {businessSettings?.business_name || 'WANDOOR PAPER MART'}
                </Text>
                <Text style={styles.signatoryLine}>Authorised Signatory</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Dynamic Page Numbering in Footer */}
        <View style={styles.pageFooter} fixed>
          <Text>{businessSettings?.business_name || 'Wandoor Paper Mart'} - Tax Invoice</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
