// pdf/ApprovedFunctionDocument.js
// Server-only React-PDF template. Rendered inside app/api/pdf/generate/route.js
// via @react-pdf/renderer's renderToBuffer — never imported into a Client Component.

import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica', color: '#1c2530' },
  coverTitle: { fontSize: 22, fontWeight: 700, marginTop: 220, textAlign: 'center', color: '#11233d' },
  coverSubtitle: { fontSize: 12, marginTop: 10, textAlign: 'center', color: '#5b6472' },
  coverMeta: { position: 'absolute', bottom: 50, left: 40, right: 40, textAlign: 'center', fontSize: 9, color: '#8b93a0' },
  sectionHeader: { fontSize: 14, fontWeight: 700, marginBottom: 10, color: '#11233d', borderBottom: '1 solid #e2e6ec', paddingBottom: 6 },
  row: { flexDirection: 'row', marginBottom: 4 },
  label: { width: 140, fontWeight: 700, color: '#5b6472' },
  value: { flex: 1 },
  table: { marginTop: 12, borderTop: '1 solid #e2e6ec', borderLeft: '1 solid #e2e6ec' },
  tableRow: { flexDirection: 'row' },
  tableHeaderCell: { flex: 1, padding: 5, borderRight: '1 solid #e2e6ec', borderBottom: '1 solid #e2e6ec', fontWeight: 700, backgroundColor: '#f4f6f9', fontSize: 8 },
  tableCell: { flex: 1, padding: 5, borderRight: '1 solid #e2e6ec', borderBottom: '1 solid #e2e6ec', fontSize: 8 },
  checkGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, marginBottom: 8 },
  checkItem: { width: '25%', fontSize: 9, marginBottom: 4 },
  signatureGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 20 },
  signatureBox: { width: '33%', marginBottom: 16, paddingRight: 12 },
  signatureImg: { width: 100, height: 40, marginBottom: 4 },
  signatureLine: { borderTop: '1 solid #1c2530', paddingTop: 3, fontSize: 8 },
  footer: { position: 'absolute', bottom: 25, left: 40, right: 40, textAlign: 'center', fontSize: 8, color: '#8b93a0' },
  pageNumber: { position: 'absolute', bottom: 25, right: 40, fontSize: 8, color: '#8b93a0' },
});

const ROLE_LABELS = {
  sm1: 'Senior Master 1',
  sm2: 'Senior Master 2',
  sm3: 'Senior Master 3',
  sm4: 'Senior Master 4',
  welfare_head: 'Head of Student Welfare',
};

function SignatureBlocks({ approvals, signatureUrls }) {
  return (
    <View style={styles.signatureGrid}>
      {approvals.map((a) => (
        <View key={a.id} style={styles.signatureBox}>
          {signatureUrls[a.id] ? (
            <Image src={signatureUrls[a.id]} style={styles.signatureImg} />
          ) : (
            <View style={{ height: 40, marginBottom: 4 }} />
          )}
          <View style={styles.signatureLine}>
            <Text>{ROLE_LABELS[a.approver_role]}</Text>
            <Text>{a.decided_at ? new Date(a.decided_at).toLocaleDateString() : '—'}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

export default function ApprovedFunctionDocument({
  schoolName,
  booking,
  masterList,
  students,
  requisition,
  approvals,
  signatureUrls,
}) {
  const requisitionItems = [
    ['needs_bus', 'Bus'],
    ['needs_food', 'Food'],
    ['needs_water', 'Water'],
    ['needs_projector', 'Projector'],
    ['needs_computer_lab', 'Computer Laboratory'],
    ['needs_sound_system', 'Sound System'],
    ['needs_microphone', 'Microphone'],
    ['needs_other', 'Other'],
  ].filter(([key]) => requisition?.[key]);

  return (
    <Document>
      {/* Cover page */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.coverTitle}>{masterList?.function_name || booking?.function_name}</Text>
        <Text style={styles.coverSubtitle}>{masterList?.club_name}</Text>
        <Text style={styles.coverSubtitle}>{masterList?.function_date} · {masterList?.venue}</Text>
        <View style={styles.coverMeta}>
          <Text>{schoolName}</Text>
          <Text>Booking No. {booking?.booking_number}</Text>
        </View>
      </Page>

      {/* Master list */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionHeader}>Master List</Text>
        <View style={styles.row}><Text style={styles.label}>Function Name</Text><Text style={styles.value}>{masterList?.function_name}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Club</Text><Text style={styles.value}>{masterList?.club_name}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Venue</Text><Text style={styles.value}>{masterList?.venue}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Date / Time</Text><Text style={styles.value}>{masterList?.function_date} {masterList?.function_time}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Teacher in Charge</Text><Text style={styles.value}>{masterList?.teacher_in_charge}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Purpose</Text><Text style={styles.value}>{masterList?.purpose}</Text></View>

        <View style={styles.table}>
          <View style={styles.tableRow}>
            {['#', 'Adm No.', 'Name', 'Class', 'Stream', 'Attendance'].map((h) => (
              <Text key={h} style={styles.tableHeaderCell}>{h}</Text>
            ))}
          </View>
          {(students || []).slice(0, 35).map((s, i) => (
            <View key={s.id || i} style={styles.tableRow}>
              <Text style={styles.tableCell}>{i + 1}</Text>
              <Text style={styles.tableCell}>{s.admission_number}</Text>
              <Text
                style={[
                  styles.tableCell,
                  s.flag_type === 'academic' ? { textDecoration: 'line-through' } : {},
                  s.flag_type === 'discipline' ? { textDecoration: 'line-through', fontWeight: 700 } : {},
                ]}
              >
                {s.student_name}{s.flag_type ? (s.flag_type === 'academic' ? ' *' : ' **') : ''}
              </Text>
              <Text style={styles.tableCell}>{s.class}</Text>
              <Text style={styles.tableCell}>{s.stream}</Text>
              <Text style={styles.tableCell}>{s.attendance_status}</Text>
            </View>
          ))}
        </View>
        <Text style={{ fontSize: 7, color: '#8b93a0', marginTop: 4 }}>
          * Flagged — low academic performance &nbsp;&nbsp; ** Flagged — indiscipline. Flagged students are not permitted to attend.
        </Text>

        <SignatureBlocks approvals={approvals} signatureUrls={signatureUrls} />
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>

      {/* Requisition */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionHeader}>Requisition Form</Text>

        <Text style={{ fontWeight: 700, marginBottom: 4 }}>Resources Needed</Text>
        <View style={styles.checkGrid}>
          {requisitionItems.map(([key, label]) => (
            <Text key={key} style={styles.checkItem}>✓ {label}</Text>
          ))}
        </View>
        {requisition?.other_description && (
          <View style={styles.row}><Text style={styles.label}>Other</Text><Text style={styles.value}>{requisition.other_description}</Text></View>
        )}

        <View style={styles.row}><Text style={styles.label}>Requirements</Text><Text style={styles.value}>{requisition?.requirements_description}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Estimated Students</Text><Text style={styles.value}>{requisition?.estimated_students}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Departure Time</Text><Text style={styles.value}>{requisition?.departure_time}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Return Time</Text><Text style={styles.value}>{requisition?.return_time}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Special Notes</Text><Text style={styles.value}>{requisition?.special_notes}</Text></View>

        <SignatureBlocks
          approvals={approvals.filter((a) => a.approver_role === 'welfare_head')}
          signatureUrls={signatureUrls}
        />

        <Text style={styles.footer}>Generated by the Starehe Booking Management System · Student Welfare Office</Text>
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>
    </Document>
  );
}