'use client';

import { useRef, useImperativeHandle, forwardRef } from 'react';
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

  const data = initialData && initialData.length > 0 ? initialData : blankRows(15);

  useImperativeHandle(ref, () => ({
    getRows() {
      const instance = hotRef.current?.hotInstance;
      if (!instance) return [];
      return instance.getSourceData();
    },
    addRow(count = 5) {
      const instance = hotRef.current?.hotInstance;
      instance?.alter('insert_row_below', instance.countRows() - 1, count);
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
        contextMenu={['row_above', 'row_below', 'remove_row', 'copy', 'cut', 'undo', 'redo']}
        copyPaste={true}
        undo={true}
        licenseKey="non-commercial-and-evaluation"
      />
    </div>
  );
});

export default MasterListGrid;
