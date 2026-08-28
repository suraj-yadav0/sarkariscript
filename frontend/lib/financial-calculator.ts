import type { Step } from "./types";

export interface StepFinancial {
  stepId: string;
  stepTitle: string;
  portalName: string;
  feeMin: number;
  feeMax: number;
  feeLabel: string;
  isFree: boolean;
  paymentMode: string;
  statutoryAuthority: string;
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
  statutorySource: string;
  estimatedTurnaroundDays: {
    min: number;
    max: number;
    label_en: string;
    label_hi: string;
  };
  brokerSavingsEstimate: number;
  stepBreakdowns: StepFinancial[];
}

// Official Statutory Authorities & Turnaround SLAs
const EVENT_METADATA: Record<
  string,
  {
    minDays: number;
    maxDays: number;
    label_en: string;
    label_hi: string;
    brokerFeeEstimate: number;
    authority: string;
  }
> = {
  passport: {
    minDays: 14,
    maxDays: 21,
    label_en: "14 to 21 Working Days (Normal) / 3 Days (Tatkal)",
    label_hi: "14 से 21 कार्य दिवस (सामान्य) / 3 दिन (तत्काल)",
    brokerFeeEstimate: 3000,
    authority: "Ministry of External Affairs (Passport Seva Project, Passports Act 1967)",
  },
  fresh_passport: {
    minDays: 14,
    maxDays: 21,
    label_en: "14 to 21 Working Days (Normal) / 3 Days (Tatkal)",
    label_hi: "14 से 21 कार्य दिवस (सामान्य) / 3 दिन (तत्काल)",
    brokerFeeEstimate: 3000,
    authority: "Ministry of External Affairs (Passport Seva Project, Passports Act 1967)",
  },
  start_business: {
    minDays: 5,
    maxDays: 10,
    label_en: "5 to 10 Working Days",
    label_hi: "5 से 10 कार्य दिवस",
    brokerFeeEstimate: 4500,
    authority: "Ministry of MSME, CBIC (GST Council) & FSSAI (FSS Act 2006)",
  },
  business: {
    minDays: 5,
    maxDays: 10,
    label_en: "5 to 10 Working Days",
    label_hi: "5 से 10 कार्य दिवस",
    brokerFeeEstimate: 4500,
    authority: "Ministry of MSME, CBIC (GST Council) & FSSAI (FSS Act 2006)",
  },
  driving_licence: {
    minDays: 30,
    maxDays: 45,
    label_en: "30 to 45 Days (includes mandatory 30-day Learner maturation)",
    label_hi: "30 से 45 दिन (30 दिन का अनिवार्य लर्नर समय शामिल)",
    brokerFeeEstimate: 3500,
    authority: "MoRTH (Central Motor Vehicles Rules 1989, Rule 32)",
  },
  buy_vehicle: {
    minDays: 3,
    maxDays: 7,
    label_en: "3 to 7 Working Days",
    label_hi: "3 से 7 कार्य दिवस",
    brokerFeeEstimate: 2500,
    authority: "MoRTH & State Transport Departments (VAHAN 4.0)",
  },
  vehicle: {
    minDays: 3,
    maxDays: 7,
    label_en: "3 to 7 Working Days",
    label_hi: "3 से 7 कार्य दिवस",
    brokerFeeEstimate: 2500,
    authority: "MoRTH & State Transport Departments (VAHAN 4.0)",
  },
  itr_filing: {
    minDays: 1,
    maxDays: 3,
    label_en: "Same Day e-Filing (e-Verification instant)",
    label_hi: "उसी दिन ई-फाइलिंग (तुरंत ई-सत्यापन)",
    brokerFeeEstimate: 1500,
    authority: "Income Tax Department, Ministry of Finance (CBDT)",
  },
  itr: {
    minDays: 1,
    maxDays: 3,
    label_en: "Same Day e-Filing (e-Verification instant)",
    label_hi: "उसी दिन ई-फाइलिंग (तुरंत ई-सत्यापन)",
    brokerFeeEstimate: 1500,
    authority: "Income Tax Department, Ministry of Finance (CBDT)",
  },
  file_grievance: {
    minDays: 15,
    maxDays: 30,
    label_en: "30 Days statutory CPGRAMS resolution clock",
    label_hi: "30 दिन का वैधानिक सीपीग्राम्स समाधान समय",
    brokerFeeEstimate: 1000,
    authority: "Department of Administrative Reforms and Public Grievances (DARPG)",
  },
  grievance: {
    minDays: 15,
    maxDays: 30,
    label_en: "30 Days statutory CPGRAMS resolution clock",
    label_hi: "30 दिन का वैधानिक सीपीग्राम्स समाधान समय",
    brokerFeeEstimate: 1000,
    authority: "Department of Administrative Reforms and Public Grievances (DARPG)",
  },
  aadhaar_card: {
    minDays: 5,
    maxDays: 15,
    label_en: "5 to 15 Working Days",
    label_hi: "5 से 15 कार्य दिवस",
    brokerFeeEstimate: 1000,
    authority: "Unique Identification Authority of India (Aadhaar Act 2016)",
  },
  pan_card: {
    minDays: 1,
    maxDays: 12,
    label_en: "10 Minutes (e-PAN) / 10 Days (Physical Card dispatch)",
    label_hi: "10 मिनट (ई-पैन) / 10 दिन (कार्ड डाक वितरण)",
    brokerFeeEstimate: 800,
    authority: "Income Tax Department, Ministry of Finance (Sec 139A IT Act)",
  },
  ration_card: {
    minDays: 15,
    maxDays: 30,
    label_en: "15 to 30 Working Days (includes field verification)",
    label_hi: "15 से 30 कार्य दिवस (फील्ड सत्यापन सहित)",
    brokerFeeEstimate: 2000,
    authority: "Department of Food & Public Distribution (NFSA 2013)",
  },
  voter_id: {
    minDays: 15,
    maxDays: 25,
    label_en: "15 to 25 Working Days (BLO verification + PVC delivery)",
    label_hi: "15 से 25 कार्य दिवस (बीएलओ सत्यापन + कार्ड वितरण)",
    brokerFeeEstimate: 1200,
    authority: "Election Commission of India (RP Act 1950, Form 6)",
  },
  ayushman_card: {
    minDays: 1,
    maxDays: 3,
    label_en: "Instant to 3 Working Days (Aadhaar e-KYC approval)",
    label_hi: "तुरंत से 3 कार्य दिवस (ई-केवाईसी अनुमोदन)",
    brokerFeeEstimate: 800,
    authority: "National Health Authority (Ayushman Bharat PM-JAY Scheme)",
  },
  birth_certificate: {
    minDays: 7,
    maxDays: 14,
    label_en: "7 to 14 Working Days",
    label_hi: "7 से 14 कार्य दिवस",
    brokerFeeEstimate: 1500,
    authority: "Office of the Registrar General of India (RBD Act 1969)",
  },
};

/**
 * Parses government fee strings intelligently distinguishing:
 * 1. Alternatives: e.g. "₹1,500 (normal) / ₹3,500 (tatkal)" -> min: 1500, max: 3500 (NOT 5000!)
 * 2. Ranges: e.g. "₹600–₹1,500" -> min: 600, max: 1500
 * 3. Additions: e.g. "₹150 test fee + ₹50 LL fee" -> min: 200, max: 200
 * 4. Free services: e.g. "Free", "No fee" -> min: 0, max: 0
 */
export function parseFeeSmart(feeNote: string): {
  min: number;
  max: number;
  isFree: boolean;
  label: string;
} {
  if (
    !feeNote ||
    /free|नि:शुल्क|included|no fee|no extra|—/i.test(feeNote)
  ) {
    return { min: 0, max: 0, isFree: true, label: "₹0 (Free)" };
  }

  // Case 1: Specific known statutory patterns
  // Passport (Normal vs Tatkal)
  if (feeNote.includes("1,500") && feeNote.includes("3,500")) {
    return {
      min: 1500,
      max: 3500,
      isFree: false,
      label: "₹1,500 (Normal) / ₹3,500 (Tatkal)",
    };
  }

  // Learner's Licence test + LL fee
  if (feeNote.includes("150") && feeNote.includes("50")) {
    return {
      min: 200,
      max: 200,
      isFree: false,
      label: "₹200 (₹150 test + ₹50 LL)",
    };
  }

  // Permanent Driving Licence fee + test fee
  if (feeNote.includes("300") && feeNote.includes("200")) {
    return {
      min: 500,
      max: 500,
      isFree: false,
      label: "₹500 (₹300 DL + ₹200 test)",
    };
  }

  // PAN Card (India vs Overseas)
  if (feeNote.includes("107")) {
    return {
      min: 107,
      max: 107,
      isFree: false,
      label: "₹107 (Printed Card in India)",
    };
  }

  // Aadhaar Update fee
  if (feeNote.includes("50") && feeNote.includes("100")) {
    return {
      min: 0,
      max: 100,
      isFree: true,
      label: "₹0 (New) / ₹50–₹100 (Update)",
    };
  }

  // FSSAI Basic Registration
  if (feeNote.includes("100")) {
    return {
      min: 100,
      max: 100,
      isFree: false,
      label: "₹100/yr (Basic Turnover < ₹12L)",
    };
  }

  // Case 2: Alternative / Option slash `/` or `or`
  if (feeNote.includes("/") || /\bor\b/i.test(feeNote)) {
    const parts = feeNote.split(/\/|\bor\b/i);
    const nums: number[] = [];
    parts.forEach((p) => {
      const match = p.match(/(?:₹|Rs\.?)\s*([\d,]+)/i) || p.match(/(\d[\d,]*)/);
      if (match) {
        const n = parseInt(match[1].replace(/,/g, ""), 10);
        if (!isNaN(n)) nums.push(n);
      }
    });
    if (nums.length > 0) {
      const minVal = Math.min(...nums);
      const maxVal = Math.max(...nums);
      return {
        min: minVal,
        max: maxVal,
        isFree: minVal === 0,
        label: minVal === maxVal ? `₹${minVal.toLocaleString("en-IN")}` : `₹${minVal.toLocaleString("en-IN")} or ₹${maxVal.toLocaleString("en-IN")}`,
      };
    }
  }

  // Case 3: Range (`–` or `-` or `to`)
  if (feeNote.includes("–") || feeNote.includes("-") || /\bto\b/i.test(feeNote)) {
    const parts = feeNote.split(/–|-|\bto\b/i);
    const nums: number[] = [];
    parts.forEach((p) => {
      const match = p.match(/(?:₹|Rs\.?)\s*([\d,]+)/i) || p.match(/(\d[\d,]*)/);
      if (match) {
        const n = parseInt(match[1].replace(/,/g, ""), 10);
        if (!isNaN(n)) nums.push(n);
      }
    });
    if (nums.length >= 2) {
      const minVal = Math.min(...nums);
      const maxVal = Math.max(...nums);
      return {
        min: minVal,
        max: maxVal,
        isFree: minVal === 0,
        label: `₹${minVal.toLocaleString("en-IN")} – ₹${maxVal.toLocaleString("en-IN")}`,
      };
    }
  }

  // Case 4: Summation (`+`)
  if (feeNote.includes("+")) {
    const matches = feeNote.match(/(?:₹|Rs\.?)\s*([\d,]+)/gi);
    if (matches && matches.length > 0) {
      let sum = 0;
      matches.forEach((m) => {
        const num = parseInt(m.replace(/[^\d]/g, ""), 10);
        if (!isNaN(num)) sum += num;
      });
      return {
        min: sum,
        max: sum,
        isFree: sum === 0,
        label: `₹${sum.toLocaleString("en-IN")}`,
      };
    }
  }

  // Fallback single number
  const singleMatch = feeNote.match(/(?:₹|Rs\.?)\s*([\d,]+)/i) || feeNote.match(/(\d[\d,]*)/);
  if (singleMatch) {
    const num = parseInt(singleMatch[1].replace(/,/g, ""), 10);
    if (!isNaN(num)) {
      return {
        min: num,
        max: num,
        isFree: num === 0,
        label: num === 0 ? "₹0 (Free)" : `₹${num.toLocaleString("en-IN")}`,
      };
    }
  }

  return { min: 0, max: 0, isFree: true, label: "₹0 (Free)" };
}

function getPaymentMode(portal: string, fee: number): string {
  if (fee === 0) return "Not Applicable (Free statutory service)";
  if (portal === "PASSPORT") {
    return "Official MEA Portal (SBI e-Pay, BharatKosh, UPI, Internet Banking)";
  }
  if (portal === "SARATHI" || portal === "VAHAN") {
    return "Official MoRTH Gateway (e-Payment, UPI, State Treasury Challan)";
  }
  if (portal === "GST") {
    return "GST Portal (e-Payment / NEFT / Over-the-Counter Challan)";
  }
  if (portal === "NSDL" || portal === "IT") {
    return "Income Tax / Protean e-Gov Online Gateway";
  }
  if (portal === "FSSAI") {
    return "FoSCoS Payment Gateway (Online Netbanking / UPI / Debit)";
  }
  if (portal === "UIDAI") {
    return "Online Slot Pre-pay / Authorized Kendra Cash Receipt";
  }
  return "Official Government Gateway / Treasury Challan";
}

function getStepAuthority(portal: string): string {
  switch (portal) {
    case "PASSPORT":
      return "Ministry of External Affairs (MEA)";
    case "SARATHI":
    case "VAHAN":
      return "Ministry of Road Transport & Highways (MoRTH)";
    case "UIDAI":
      return "Unique Identification Authority of India (UIDAI)";
    case "NSDL":
    case "IT":
      return "Income Tax Department, Ministry of Finance";
    case "GST":
      return "GST Network & CBIC";
    case "MSME":
      return "Ministry of Micro, Small & Medium Enterprises";
    case "SHRAM":
      return "Ministry of Labour & Employment";
    case "FSSAI":
      return "Food Safety and Standards Authority of India";
    case "ECI":
      return "Election Commission of India";
    case "PMJAY":
      return "National Health Authority (NHA)";
    case "CRS":
      return "Registrar General of India (ORGI)";
    case "CPGRAMS":
      return "DARPG, Govt of India";
    default:
      return "Government of India / State Dept";
  }
}

function getStepTurnaround(step: Step): string {
  if (step.id.includes("slot") || step.id.includes("appointment") || step.id.includes("enrol")) {
    return "1 – 2 Days (Slot appointment)";
  }
  if (step.id.includes("verify") || step.id.includes("verification") || step.id.includes("blo")) {
    return "5 – 10 Days (Field check)";
  }
  if (step.id.includes("download") || step.id.includes("instant")) {
    return "Instant (Realtime)";
  }
  return "2 – 7 Working Days";
}

export function calculateFinancials(
  eventId: string,
  steps: Step[],
  lang: string = "en"
): FinancialSummary {
  let minFeeTotal = 0;
  let maxFeeTotal = 0;
  let freeCount = 0;
  let paidCount = 0;
  let totalMinutes = 0;

  const breakdowns: StepFinancial[] = [];

  steps.forEach((step) => {
    const feeInfo = parseFeeSmart(step.fee_note_en);
    if (feeInfo.isFree) {
      freeCount++;
    } else {
      paidCount++;
    }

    minFeeTotal += feeInfo.min;
    maxFeeTotal += feeInfo.max;
    totalMinutes += step.est_time_min || 15;

    const portalName =
      lang === "hi"
        ? step.portal_info?.name_hi || step.portal_info?.short || step.portal
        : step.portal_info?.name_en || step.portal_info?.short || step.portal;

    breakdowns.push({
      stepId: step.id,
      stepTitle: lang === "hi" ? step.title_hi : step.title_en,
      portalName: portalName || "Govt Portal",
      feeMin: feeInfo.min,
      feeMax: feeInfo.max,
      feeLabel: feeInfo.label,
      isFree: feeInfo.isFree,
      paymentMode: getPaymentMode(step.portal, feeInfo.min),
      statutoryAuthority: getStepAuthority(step.portal),
      turnaroundDays: getStepTurnaround(step),
      estMinutes: step.est_time_min || 15,
    });
  });

  const metadata = EVENT_METADATA[eventId] ||
    EVENT_METADATA[eventId.replace("fresh_", "")] || {
      minDays: 3,
      maxDays: 14,
      label_en: "3 to 14 Working Days",
      label_hi: "3 से 14 कार्य दिवस",
      brokerFeeEstimate: 2000,
      authority: "Government of India Citizen Charter",
    };

  let feeRangeLabel = "₹0 (100% Free Govt Service)";
  if (minFeeTotal > 0 && maxFeeTotal === minFeeTotal) {
    feeRangeLabel = `₹${minFeeTotal.toLocaleString("en-IN")}`;
  } else if (minFeeTotal > 0 && maxFeeTotal > minFeeTotal) {
    feeRangeLabel = `₹${minFeeTotal.toLocaleString("en-IN")} – ₹${maxFeeTotal.toLocaleString("en-IN")}`;
  } else if (minFeeTotal === 0 && maxFeeTotal > 0) {
    feeRangeLabel = `₹0 (Standard) or ₹${maxFeeTotal.toLocaleString("en-IN")}`;
  }

  const brokerSavings =
    minFeeTotal > 0
      ? Math.max(metadata.brokerFeeEstimate, minFeeTotal * 2)
      : metadata.brokerFeeEstimate;

  return {
    minTotalFee: minFeeTotal,
    maxTotalFee: maxFeeTotal,
    feeRangeLabel,
    freeStepsCount: freeCount,
    paidStepsCount: paidCount,
    totalEstMinutes: totalMinutes,
    statutorySource: metadata.authority,
    estimatedTurnaroundDays: {
      min: metadata.minDays,
      max: metadata.maxDays,
      label_en: metadata.label_en,
      label_hi: metadata.label_hi,
    },
    brokerSavingsEstimate: brokerSavings,
    stepBreakdowns: breakdowns,
  };
}
