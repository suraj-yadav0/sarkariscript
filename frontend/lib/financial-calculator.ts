import type { Step } from "./types";

export interface StepFinancial {
  stepId: string;
  stepTitle: string;
  portalName: string;
  feeAmount: number;
  feeLabel: string;
  isFree: boolean;
  paymentMode: string;
  turnaroundDays: string;
  estMinutes: number;
}

export interface FinancialSummary {
  minTotalFee: number;
  maxTotalFee: number;
  feeRangeLabel: string;
  freeStepsCount: number;
  paidStepsCount: number;
  totalEstMinutes: number;
  estimatedTurnaroundDays: {
    min: number;
    max: number;
    label_en: string;
    label_hi: string;
  };
  brokerSavingsEstimate: number;
  stepBreakdowns: StepFinancial[];
}

// Statutory Turnaround SLAs & Typical Broker Overcharge baselines for India
const EVENT_SLA_MAP: Record<
  string,
  {
    minDays: number;
    maxDays: number;
    label_en: string;
    label_hi: string;
    brokerFeeEstimate: number;
  }
> = {
  start_business: {
    minDays: 5,
    maxDays: 10,
    label_en: "5 to 10 Working Days",
    label_hi: "5 से 10 कार्य दिवस",
    brokerFeeEstimate: 4500,
  },
  passport: {
    minDays: 14,
    maxDays: 21,
    label_en: "14 to 21 Working Days (Normal) / 3 Days (Tatkal)",
    label_hi: "14 से 21 कार्य दिवस (सामान्य) / 3 दिन (तत्काल)",
    brokerFeeEstimate: 3000,
  },
  driving_licence: {
    minDays: 30,
    maxDays: 45,
    label_en: "30 to 45 Days (includes 30-day Learner maturation)",
    label_hi: "30 से 45 दिन (30 दिन का लर्नर समय शामिल)",
    brokerFeeEstimate: 3500,
  },
  buy_vehicle: {
    minDays: 3,
    maxDays: 7,
    label_en: "3 to 7 Working Days",
    label_hi: "3 से 7 कार्य दिवस",
    brokerFeeEstimate: 2500,
  },
  itr_filing: {
    minDays: 1,
    maxDays: 3,
    label_en: "Same Day e-Filing (e-Verification instant)",
    label_hi: "उसी दिन ई-फाइलिंग (तुरंत ई-सत्यापन)",
    brokerFeeEstimate: 1500,
  },
  file_grievance: {
    minDays: 15,
    maxDays: 30,
    label_en: "30 Days statutory CPGRAMS resolution clock",
    label_hi: "30 दिन का वैधानिक सीपीग्राम्स समाधान समय",
    brokerFeeEstimate: 1000,
  },
  aadhaar_card: {
    minDays: 5,
    maxDays: 15,
    label_en: "5 to 15 Working Days",
    label_hi: "5 से 15 कार्य दिवस",
    brokerFeeEstimate: 1000,
  },
  pan_card: {
    minDays: 1,
    maxDays: 12,
    label_en: "10 Minutes (e-PAN) / 10 Days (Physical Plastic Card)",
    label_hi: "10 मिनट (ई-पैन) / 10 दिन (प्लास्टिक कार्ड)",
    brokerFeeEstimate: 800,
  },
  ration_card: {
    minDays: 15,
    maxDays: 30,
    label_en: "15 to 30 Working Days (includes field verification)",
    label_hi: "15 से 30 कार्य दिवस (फील्ड सत्यापन सहित)",
    brokerFeeEstimate: 2000,
  },
  voter_id: {
    minDays: 15,
    maxDays: 25,
    label_en: "15 to 25 Working Days (BLO verification + PVC delivery)",
    label_hi: "15 से 25 कार्य दिवस (बीएलओ सत्यापन + कार्ड वितरण)",
    brokerFeeEstimate: 1200,
  },
  ayushman_card: {
    minDays: 1,
    maxDays: 3,
    label_en: "Instant to 3 Working Days (Aadhaar e-KYC approval)",
    label_hi: "तुरंत से 3 कार्य दिवस (ई-केवाईसी अनुमोदन)",
    brokerFeeEstimate: 800,
  },
  birth_certificate: {
    minDays: 7,
    maxDays: 14,
    label_en: "7 to 14 Working Days",
    label_hi: "7 से 14 कार्य दिवस",
    brokerFeeEstimate: 1500,
  },
};

// Parse numeric fee from fee note
function parseFee(feeNote: string): { amount: number; isFree: boolean; label: string } {
  if (!feeNote || /free|नि:शुल्क|included|no fee|no extra/i.test(feeNote)) {
    return { amount: 0, isFree: true, label: "₹0 (Free)" };
  }

  // Extract all numbers after ₹ or Rs
  const matches = feeNote.match(/(?:₹|Rs\.?)\s*([\d,]+)/gi);
  if (!matches || matches.length === 0) {
    // Check if contains plain digits
    const plainNum = feeNote.match(/(\d+)/);
    if (plainNum) {
      const val = parseInt(plainNum[1], 10);
      return { amount: val, isFree: val === 0, label: `₹${val}` };
    }
    return { amount: 0, isFree: true, label: "₹0 (Free)" };
  }

  // Parse highest / primary fee
  let total = 0;
  matches.forEach((m) => {
    const clean = m.replace(/[^\d]/g, "");
    const num = parseInt(clean, 10);
    if (!isNaN(num)) {
      total += num;
    }
  });

  return {
    amount: total,
    isFree: total === 0,
    label: total === 0 ? "₹0 (Free)" : `₹${total.toLocaleString("en-IN")}`,
  };
}

function getPaymentMode(portal: string, fee: number): string {
  if (fee === 0) return "Not Applicable (Free)";
  if (portal === "PASSPORT" || portal === "SARATHI" || portal === "GST") {
    return "Online Gateway (UPI, Netbanking, Debit/Credit Card, BharatKosh)";
  }
  if (portal === "NSDL" || portal === "IT") {
    return "Online Payment / Protean e-Gov Portal";
  }
  if (portal === "UIDAI") {
    return "Online Slot Pre-pay / Cash at Kendra counter";
  }
  return "Online Portal Gateway / State Challan";
}

function getStepTurnaround(step: Step): string {
  if (step.id.includes("slot") || step.id.includes("appointment") || step.id.includes("enrol")) {
    return "1 - 2 Days (Slot basis)";
  }
  if (step.id.includes("verify") || step.id.includes("verification") || step.id.includes("blo")) {
    return "5 - 10 Days";
  }
  if (step.id.includes("download") || step.id.includes("instant")) {
    return "Instant (Realtime)";
  }
  return "2 - 7 Working Days";
}

export function calculateFinancials(
  eventId: string,
  steps: Step[],
  lang: string = "en"
): FinancialSummary {
  let minFee = 0;
  let maxFee = 0;
  let freeCount = 0;
  let paidCount = 0;
  let totalMinutes = 0;

  const breakdowns: StepFinancial[] = [];

  steps.forEach((step) => {
    const feeInfo = parseFee(step.fee_note_en);
    if (feeInfo.isFree) {
      freeCount++;
    } else {
      paidCount++;
      minFee += feeInfo.amount;
      maxFee += feeInfo.amount;
    }

    totalMinutes += step.est_time_min || 15;

    const portalName =
      lang === "hi"
        ? step.portal_info?.name_hi || step.portal_info?.short || step.portal
        : step.portal_info?.name_en || step.portal_info?.short || step.portal;

    breakdowns.push({
      stepId: step.id,
      stepTitle: lang === "hi" ? step.title_hi : step.title_en,
      portalName: portalName || "Govt Portal",
      feeAmount: feeInfo.amount,
      feeLabel: feeInfo.label,
      isFree: feeInfo.isFree,
      paymentMode: getPaymentMode(step.portal, feeInfo.amount),
      turnaroundDays: getStepTurnaround(step),
      estMinutes: step.est_time_min || 15,
    });
  });

  const sla = EVENT_SLA_MAP[eventId] || {
    minDays: 3,
    maxDays: 14,
    label_en: "3 to 14 Working Days",
    label_hi: "3 से 14 कार्य दिवस",
    brokerFeeEstimate: 2000,
  };

  const feeRangeLabel =
    minFee === 0
      ? "₹0 (100% Free Govt Service)"
      : `₹${minFee.toLocaleString("en-IN")}`;

  return {
    minTotalFee: minFee,
    maxTotalFee: maxFee,
    feeRangeLabel,
    freeStepsCount: freeCount,
    paidStepsCount: paidCount,
    totalEstMinutes: totalMinutes,
    estimatedTurnaroundDays: {
      min: sla.minDays,
      max: sla.maxDays,
      label_en: sla.label_en,
      label_hi: sla.label_hi,
    },
    brokerSavingsEstimate: Math.max(
      sla.brokerFeeEstimate,
      minFee > 0 ? minFee * 2 : 1500
    ),
    stepBreakdowns: breakdowns,
  };
}
