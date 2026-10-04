'use client';

import { useRef, useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

registerAllModules();

const COLUMNS = [
  { data: 'admissionNumber', title: 'Admission No.' },
  { data: 'studentName', title: 'Student Name' },
  { data: 'class', title: 'Class' },
  { data: 'stream', title: 'Stream' },
  { data: 'phoneNumber', title: 'Phone Number' },
  { data: 'parentContact', title: 'Parent Contact' },
  { data: 'remarks', title: 'Remarks' },
  {
    data: 'attendanceStatus',
    title: 'Attendance',
    type: 'dropdown',
    source: ['expected', 'present', 'absent'],
  },
];

function blankRows(count) {
  return Array.from({ length: count }, () => ({
    admissionNumber: '',
    studentName: '',
    class: '',
    stream: '',
    phoneNumber: '',
    parentContact: '',
    remarks: '',
    attendanceStatus: 'expected',
  }));
}

const MasterListGrid = forwardRef(function MasterListGrid({ initialData }, ref) {
  const hotRef = useRef(null);

  // Keep the grid's data stable between parent re-renders.
  const [data, setData] = useState(() =>
    initialData && initialData.length > 0
      ? initialData
      : blankRows(15)
  );

  // If the parent loads existing student data, update the grid.
  useEffect(() => {
    if (initialData && initialData.length > 0) {
      setData(initialData);
    }
  }, [initialData]);

  useImperativeHandle(ref, () => ({
    getRows() {
      const instance = hotRef.current?.hotInstance;

      if (!instance) {
        console.log('MasterListGrid: HotTable instance not found.');
        return [];
      }

      const tableData = instance.getData();

      const rows = tableData.map((row) => ({
        admissionNumber: row[0] ?? '',
        studentName: row[1] ?? '',
        class: row[2] ?? '',
        stream: row[3] ?? '',
        phoneNumber: row[4] ?? '',
        parentContact: row[5] ?? '',
        remarks: row[6] ?? '',
        attendanceStatus: row[7] || 'expected',
      }));

      console.log(
        'MasterListGrid getRows FULL:',
        JSON.stringify(rows, null, 2)
      );

      return rows;
    },

    addRow(count = 5) {
      const instance = hotRef.current?.hotInstance;

      if (!instance) return;

      instance.alter(
        'insert_row_below',
        instance.countRows() - 1,
        count
      );
    },
  }));

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <HotTable
        ref={hotRef}
        data={data}
        columns={COLUMNS}
        rowHeaders={true}
        colHeaders={true}
        height="480"
        width="100%"
        stretchH="all"
        contextMenu={[
          'row_above',
          'row_below',
          'remove_row',
          'copy',
          'cut',
          'undo',
          'redo',
        ]}
        copyPaste={true}
        undo={true}
        licenseKey="non-commercial-and-evaluation"
      />
    </div>
  );
});

export default MasterListGrid;