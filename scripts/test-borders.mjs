import { Client } from 'pg';
import React from 'react';
import ReactPDF, { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const styles = StyleSheet.create({
  page: {
    size: 'A4',
    padding: 24,
    fontFamily: 'Helvetica',
    fontSize: 8,
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#000000',
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
  cellBase: {
    justifyContent: 'center',
    borderRightWidth: 0.5,
    borderColor: '#000000',
    paddingVertical: 2,
    paddingHorizontal: 3,
  },
  colNo: { width: '5%', alignItems: 'center' },
  colDesc: { flex: 1, alignItems: 'flex-start', paddingHorizontal: 4 },
  colHsn: { width: '12%', alignItems: 'center' },
  colQty: { width: '8%', alignItems: 'center' },
  colUom: { width: '8%', alignItems: 'center' },
  colRate: { width: '12%', alignItems: 'flex-end', paddingHorizontal: 4 },
  colTaxable: { width: '15%', alignItems: 'flex-end', paddingHorizontal: 4 },
  colTotal: { width: '15%', alignItems: 'flex-end', paddingHorizontal: 4, borderRightWidth: 0 },
  headerText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
    textAlign: 'center',
  },
  cellText: {
    fontSize: 7.5,
  },
});

function TestDoc() {
  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: 'A4', style: styles.page },
      React.createElement(
        View,
        { style: styles.table },
        React.createElement(
          View,
          { style: styles.tableHeader },
          React.createElement(View, { style: [styles.cellBase, styles.colNo] }, React.createElement(Text, { style: styles.headerText }, 'No')),
          React.createElement(View, { style: [styles.cellBase, styles.colDesc] }, React.createElement(Text, { style: styles.headerText }, 'Description')),
          React.createElement(View, { style: [styles.cellBase, styles.colHsn] }, React.createElement(Text, { style: styles.headerText }, 'HSN Code')),
          React.createElement(View, { style: [styles.cellBase, styles.colQty] }, React.createElement(Text, { style: styles.headerText }, 'Qty')),
          React.createElement(View, { style: [styles.cellBase, styles.colUom] }, React.createElement(Text, { style: styles.headerText }, 'UOM')),
          React.createElement(View, { style: [styles.cellBase, styles.colRate] }, React.createElement(Text, { style: styles.headerText }, 'Unit Rate')),
          React.createElement(View, { style: [styles.cellBase, styles.colTaxable] }, React.createElement(Text, { style: styles.headerText }, 'Taxable Val')),
          React.createElement(View, { style: [styles.cellBase, styles.colTotal] }, React.createElement(Text, { style: styles.headerText }, 'Total'))
        ),
        [1, 2, 3].map(i =>
          React.createElement(
            View,
            { key: i, style: styles.tableRow },
            React.createElement(View, { style: [styles.cellBase, styles.colNo] }, React.createElement(Text, { style: styles.cellText }, String(i))),
            React.createElement(View, { style: [styles.cellBase, styles.colDesc] }, React.createElement(Text, { style: [styles.cellText, { fontFamily: 'Helvetica-Bold' }] }, `Item Name ${i}`)),
            React.createElement(View, { style: [styles.cellBase, styles.colHsn] }, React.createElement(Text, { style: styles.cellText }, '482010')),
            React.createElement(View, { style: [styles.cellBase, styles.colQty] }, React.createElement(Text, { style: [styles.cellText, { fontFamily: 'Helvetica-Bold' }] }, '20')),
            React.createElement(View, { style: [styles.cellBase, styles.colUom] }, React.createElement(Text, { style: styles.cellText }, 'PCS')),
            React.createElement(View, { style: [styles.cellBase, styles.colRate] }, React.createElement(Text, { style: styles.cellText }, '50.00')),
            React.createElement(View, { style: [styles.cellBase, styles.colTaxable] }, React.createElement(Text, { style: styles.cellText }, '1000.00')),
            React.createElement(View, { style: [styles.cellBase, styles.colTotal] }, React.createElement(Text, { style: [styles.cellText, { fontFamily: 'Helvetica-Bold' }] }, '1050.00'))
          )
        )
      )
    )
  );
}

async function run() {
  const outPath = path.join(__dirname, 'output', 'test-border.pdf');
  await ReactPDF.renderToFile(React.createElement(TestDoc), outPath);
  console.log('Rendered test-border.pdf');
}
run();
