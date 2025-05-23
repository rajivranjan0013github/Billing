import React from 'react';
import ExportDataDlg from '../mirgration/ExportDataDlg';
import { useDispatch } from 'react-redux';
import { exportInventory } from '../../../redux/slices/exportImportSlice';

const ExportInventory = ({ open, onOpenChange }) => {
  const columns = [
    { header: 'Name', field: 'name', width: 30 },
    { header: 'Pack', field: 'pack', width: 15 },
    { header: 'Category', field: 'category', width: 20 },
    { header: 'Manufacturer', field: 'mfcName', width: 25 },
    { header: 'Composition', field: 'composition', width: 30 },
    { header: 'Location', field: 'location', width: 20 },
    { header: 'Batch Number', field: 'batchNumber', width: 20 },
    { header: 'HSN', field: 'HSN', width: 15 },
    { header: 'Quantity', field: 'quantity', width: 15, addTotal: true },
    { header: 'Expiry', field: 'expiry', width: 15 },
    { header: 'MRP', field: 'mrp', width: 15, format: 'currency', addTotal: true },
    { header: 'GST %', field: 'gstPer', width: 15 },
    { header: 'Purchase Rate', field: 'purchaseRate', width: 20, format: 'currency', addTotal: true },
    { header: 'Sale Rate', field: 'saleRate', width: 20, format: 'currency', addTotal: true },
  ];

  const formatters = {
    'MRP': (value) => `₹${value}`,
    'Purchase Rate': (value) => `₹${value}`,
    'Sale Rate': (value) => `₹${value}`,
  };

  return (
    <ExportDataDlg
      open={open}
      onOpenChange={onOpenChange}
      columns={columns}
      fileName="inventory_export"
      title="Export Inventory"
      formatters={formatters}
      fetchData={exportInventory}
      isFetchData={true}
    />
  );
};

export default ExportInventory; 