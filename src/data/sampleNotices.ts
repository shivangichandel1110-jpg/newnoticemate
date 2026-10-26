export interface SampleNotice {
  id: string;
  name: string;
  badge: string;
  description: string;
  fullText: string;
}

export const SAMPLE_NOTICES: SampleNotice[] = [
  {
    id: 'sample-exam-notice',
    name: 'University End-Semester Exam Circular & Fee Deadlines',
    badge: 'Examination & Fees',
    description: 'Contains standard fee deadline, late fee penalty deadline, admit card release, and commencement of exams.',
    fullText: `DELHI TECHNICAL UNIVERSITY
OFFICE OF THE CONTROLLER OF EXAMINATIONS
Ref. No: DTU/COE/2026/NOT-842
Date of Notification: October 20, 2026

CIRCULAR: REGISTRATION FOR WINTER 2026 END-SEMESTER EXAMINATIONS

All undergraduate (B.Tech) and postgraduate (M.Tech/MCA) regular and backlog students are hereby notified regarding the schedule for submission of examination application forms and fee payment for the upcoming Winter 2026 End-Semester Examinations.

1. CRITICAL DATES AND DEADLINES:
- Online examination form portal opens: October 28, 2026 (10:00 AM)
- Last date to submit examination forms WITHOUT late fee: November 15, 2026 (5:00 PM)
- Submission with late fee of ₹500: November 16, 2026 to November 22, 2026 (11:59 PM)
- Window for correction of subject codes: November 24, 2026 to November 26, 2026
- Downloading of Hall Tickets / Admit Cards: December 01, 2026 onwards
- Commencement of Theory Examinations: December 10, 2026 (9:30 AM)

2. EXAMINATION FEES:
- Regular Semester Examination Fee: ₹2,500/- per student
- Backlog Paper Examination Fee: ₹600/- per theory subject
- Late submission surcharge: ₹500/- flat penalty
Payment must only be completed via the official DTU ERP Portal (https://erp.dtu.ac.in). Cash payments or third-party UPI transfers directly to college accounts are strictly prohibited.

3. MANDATORY CONDITIONS & ELIGIBILITY:
- Students must have a minimum aggregate attendance of 75% in each enrolled subject up to November 10, 2026. Students falling below 65% attendance will not be issued admit cards under any circumstances.
- All library books and laboratory equipment must be returned, and "No Dues" clearance obtained from respective department offices before November 20, 2026.
- Students must carry their physical University ID card and printed Admit Card with passport photograph to the examination center. Mobile phones and programmable calculators are strictly banned inside exam halls.

By Order,
Prof. S. K. Sharma
Controller of Examinations, DTU`,
  },
  {
    id: 'sample-scholarship-notice',
    name: 'National Post-Matric Merit Scholarship Announcement',
    badge: 'Scholarship & Financial Aid',
    description: 'Detailed scholarship with income caps, mandatory documentation checklist, and portal deadlines.',
    fullText: `MINISTRY OF EDUCATION & HIGHER WELFARE
NATIONAL SCHOLARSHIP PORTAL (NSP) CELL
Notification No: NSP/SCH-POST/2026-27/09
Date of Issue: October 18, 2026

PUBLIC NOTICE: INVITATION OF ONLINE APPLICATIONS FOR MERIT-CUM-MEANS SCHOLARSHIP 2026-2027

Applications are invited from eligible students enrolled in accredited degree colleges and polytechnic institutes for the award of Merit-cum-Means Financial Assistance Scheme for the academic year 2026-2027.

1. ELIGIBILITY CRITERIA:
- The candidate must have secured not less than 60% marks or equivalent CGPA in the previous qualifying annual examination.
- Total family annual income from all sources must not exceed ₹4,50,000/- (Rupees Four Lakh Fifty Thousand only).
- The applicant must not be in receipt of any other central or state government scholarship during the current academic year.

2. SCHOLARSHIP AMOUNT & DISBURSEMENT:
- Day Scholars: ₹12,000/- per annum + full tuition fee reimbursement up to ₹25,000/-
- Hostellers: ₹20,000/- per annum + full tuition fee reimbursement up to ₹25,000/-
- Disbursal will be made directly to the applicant's Aadhaar-linked bank account (DBT mode).

3. IMPORTANT TIMELINE:
- Portal opens for online student registration: October 25, 2026
- Last date for online application submission: November 30, 2026
- Last date for institutional verification by College Nodal Officer: December 15, 2026
- Second-level district verification deadline: December 28, 2026

4. MANDATORY DOCUMENTS REQUIRED FOR UPLOAD (PDF < 500KB):
(a) Scanned copy of Marksheet of last passed examination.
(b) Competent authority issued Income Certificate valid for FY 2025-26.
(c) Domicile / Residence Certificate.
(d) Current year College Fee Receipt and Bonafide Student Certificate signed by the Head of Institution.
(e) Bank Passbook front page showing Account Number and IFSC Code.
(f) Self-attested copy of Aadhaar Card.

Incomplete applications or applications without institutional endorsement by December 15, 2026 will be summarily rejected without further communication.

Director of Higher Education
National Scholarship Directorate`,
  },
  {
    id: 'sample-internship-notice',
    name: 'State Innovation Council Summer Research Fellowship',
    badge: 'Internship & Research',
    description: 'Notice with project selection, stipend information, and an ambiguous deadline phrase to test date verification.',
    fullText: `STATE COUNCIL FOR SCIENCE AND INNOVATION TECHNOLOGY
RESEARCH FELLOWSHIP DIVISION
Notification Ref: SCIST/FELLOW/2026/04
Date: October 24, 2026

ANNOUNCEMENT: STATE GRADUATE RESEARCH INTERNSHIP PROGRAM (S-GRIP)

Applications are invited from pre-final and final year undergraduate students in Science, Engineering, and Economics for a 3-month research fellowship at State Center of Excellence Labs.

FELLOWSHIP DETAILS:
- Monthly fellowship stipend: ₹18,000/- per month + ₹5,000 one-time contingency grant.
- Duration: 12 weeks starting from January 05, 2027.
- Mentorship by senior research scientists in AI, Renewable Energy, and Smart Agriculture.

TIMELINE & DATES:
- Portal application open: October 26, 2026
- Strict deadline for Statement of Purpose (SOP) and resume submission: November 20, 2026 (5:00 PM)
- Shortlisted candidates notification: December 05, 2026
- Candidate interviews and lab preference allocation: December 12, 2026 to December 14, 2026
- Note regarding recommendation letters: "Letters of recommendation from two faculty members must be submitted within 10 days of notification" (ambiguous without portal notification timestamp).

REQUIREMENTS:
- Statement of Purpose (max 750 words)
- Updated Resume / CV
- Minimum CGPA of 7.5 or 70% marks in current degree course
- NOC (No Objection Certificate) from college principal

Dr. A. Verma
Chief Coordinator, Fellowships`,
  },
];
