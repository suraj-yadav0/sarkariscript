from datetime import date, datetime


def _fmt_date(value: str) -> str:
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y"):
        try:
            return datetime.strptime(value, fmt).strftime("%d %B %Y")
        except ValueError:
            continue
    return value


def draft_rti(payload: dict) -> dict[str, str]:
    applicant = payload.get("applicant_name", "").strip() or "<Applicant Name>"
    address = payload.get("applicant_address", "").strip() or "<Applicant Address>"
    phone = payload.get("applicant_phone", "").strip()
    email = payload.get("applicant_email", "").strip()
    department = payload.get("department", "").strip() or "<Concerned Department>"
    grievance_no = payload.get("grievance_number", "").strip() or "<Grievance Registration No.>"
    filed_on = _fmt_date(payload.get("filed_on") or "")
    subject = payload.get("subject", "").strip() or "<Subject of original grievance>"
    days_pending = payload.get("days_pending") or 30
    info_sought = payload.get(
        "info_sought",
        "Action-taken report on the above grievance, name and designation of the officer(s) who handled it, and copies of all correspondence generated against it.",
    )
    today = date.today().strftime("%d %B %Y")

    contact_lines = f"Address: {address}"
    if phone:
        contact_lines += f"\nPhone: {phone}"
    if email:
        contact_lines += f"\nEmail: {email}"

    letter = f"""APPLICATION UNDER SECTION 6(1) OF THE RIGHT TO INFORMATION ACT, 2005

Date: {today}

To,
The Public Information Officer,
{department}
Government of India

Subject: Request for information regarding unresolved Public Grievance {grievance_no} (pending {days_pending} days)

Respected Sir/Madam,

I, {applicant}, filed a public grievance bearing registration number {grievance_no} with {department} on {filed_on}, concerning: "{subject}".

As of today, the grievance has remained unresolved for more than thirty ({days_pending}) days beyond the mandated resolution timeline under the CPGRAMS framework.

Under Section 6(1) of the Right to Information Act, 2005, I kindly request the following information:

1. {info_sought}
2. Name, designation and official contact details of the officer(s) responsible for resolving the said grievance.
3. Certified copies of any internal notings, reminders or escalation records related to this grievance.
4. If the grievance has been marked "resolved" or "closed", kindly provide the complete action-taken report and the basis of such closure.

A copy of the original grievance acknowledgement is enclosed for your reference.

Kindly provide the above information within thirty (30) days as prescribed under the Act. If it is held wholly or partly by another public authority, I request you to transfer this application under Section 6(3) within five days and inform me accordingly.

I am a citizen of India and hereby declare my intent to pay the applicable application fee (₹10) through IPO/court fee stamp/online mode as per your instructions.

Thank you.

Yours faithfully,

{applicant}
{contact_lines}

Enclosures:
1. Copy of CPGRAMS grievance acknowledgement ({grievance_no})
"""

    return {
        "letter": letter,
        "filing_url": "https://rtionline.gov.in/index.php",
        "guidance": [
            "RTI Online accepts applications only for central ministries; state departments need the state portal or a physical application.",
            "Fee is Rs 10; BPL applicants are exempt with proof.",
            "The PIO must reply within 30 days (48 hours if liberty/life is involved). No reply = deemed refusal, which is appealable.",
        ],
    }
