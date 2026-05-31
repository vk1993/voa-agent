export type VerticalId =
  | "interior" | "real_estate" | "construction"
  | "product"  | "finance"    | "healthcare"
  | "education" | "custom";

export interface VerticalConfig {
  id:                  VerticalId;
  label:               string;
  icon:                string;         // Lucide icon name
  color:               string;         // accent hex
  tagline:             string;         // 1-line description for card
  agentNameDefault:    string;
  roleDescription:     string;
  primaryGoal:         string;
  callToAction:        string;
  locationLabel:       string;         // "Showroom" | "Site office" | "Branch" etc.
  contactRoleLabel:    string;         // "Designer" | "Site manager" | "Advisor" etc.
  meetingLabel:        string;         // "Showroom visit" | "Site visit" | "Demo" etc.
  assetLabel:          string;         // "Portfolio" | "Brochure" | "Spec sheet" etc.
  defaultServices:     { name: string; rangeInr: [number,number]; leadDays: number }[];
  defaultAssetKeys:    string[];
  whatsappTemplate:    string;
  nextActionType:      string;
  exampleTranscript:   { role: "AI" | "Lead"; text: string }[];
  outcomeLabel:        string;         // e.g. "Showroom booked", "Site visit booked"
  kpiLabel:            string;         // Dashboard KPI card label for main outcome
}

export const VERTICALS: Record<VerticalId, VerticalConfig> = {
  interior: {
    id: "interior", label: "Interior Design",
    icon: "Sofa", color: "#C9A14A",
    tagline: "Modular kitchens, wardrobes, full-home interiors",
    agentNameDefault: "Priya", roleDescription: "luxury interior design consultant",
    primaryGoal: "book a showroom visit",
    callToAction: "Can I book a free design consultation this week?",
    locationLabel: "Showroom", contactRoleLabel: "Designer",
    meetingLabel: "Showroom visit", assetLabel: "Portfolio",
    defaultServices: [
      { name: "Modular kitchen",    rangeInr: [150000, 800000],  leadDays: 45 },
      { name: "Full-home interior", rangeInr: [500000, 5000000], leadDays: 90 },
      { name: "Walk-in wardrobe",   rangeInr: [80000,  400000],  leadDays: 30 },
      { name: "False ceiling",      rangeInr: [40000,  150000],  leadDays: 20 },
    ],
    defaultAssetKeys: ["portfolio", "catalog", "floor-plan"],
    whatsappTemplate: "appointment_confirmation",
    nextActionType: "book_visit",
    outcomeLabel: "Showroom booked", kpiLabel: "Showroom visits",
    exampleTranscript: [
      { role: "AI",   text: "Hi, this is Priya from Prestige Interiors. Is this a good time?" },
      { role: "Lead", text: "Haan bolo." },
      { role: "AI",   text: "We have 15% off modular kitchens. Your area is Indiranagar?" },
      { role: "Lead", text: "Haan." },
      { role: "AI",   text: "Can I book a showroom visit for Saturday at 11am with Arjun?" },
    ],
  },
  real_estate: {
    id: "real_estate", label: "Real Estate",
    icon: "Building2", color: "#1D9E75",
    tagline: "Plots, villas, apartments — pre-launch to ready-to-move",
    agentNameDefault: "Rahul", roleDescription: "property sales consultant",
    primaryGoal: "book a site visit",
    callToAction: "Can I schedule a site visit for you this weekend?",
    locationLabel: "Site office", contactRoleLabel: "Site manager",
    meetingLabel: "Site visit", assetLabel: "Brochure",
    defaultServices: [
      { name: "Residential plots", rangeInr: [2000000, 15000000], leadDays: 7  },
      { name: "Villas",            rangeInr: [8000000, 50000000], leadDays: 14 },
      { name: "Apartments",        rangeInr: [3000000, 20000000], leadDays: 10 },
    ],
    defaultAssetKeys: ["plot-brochure", "master-plan", "amenities"],
    whatsappTemplate: "site_visit_confirmation",
    nextActionType: "book_visit",
    outcomeLabel: "Site visit booked", kpiLabel: "Site visits",
    exampleTranscript: [
      { role: "AI",   text: "Hi, I'm Rahul from Apex Properties. Calling about our Devanahalli project." },
      { role: "Lead", text: "Yes, I saw the ad." },
      { role: "AI",   text: "It's RERA approved. Budget 80 lakhs? I can arrange a site visit this weekend." },
      { role: "Lead", text: "Saturday works." },
      { role: "AI",   text: "Confirmed! I'll send the brochure and site address on WhatsApp now." },
    ],
  },
  construction: {
    id: "construction", label: "Construction",
    icon: "HardHat", color: "#3B82F6",
    tagline: "G+2, villas, commercial — design to handover",
    agentNameDefault: "Vikram", roleDescription: "construction consultant",
    primaryGoal: "schedule a free project consultation",
    callToAction: "Can I schedule a free consultation with our project team?",
    locationLabel: "Project office", contactRoleLabel: "Project manager",
    meetingLabel: "Consultation", assetLabel: "Project portfolio",
    defaultServices: [
      { name: "G+2 residential",   rangeInr: [2500000,  8000000],  leadDays: 14 },
      { name: "Villa construction", rangeInr: [5000000,  25000000], leadDays: 21 },
      { name: "Commercial build",   rangeInr: [10000000, 80000000], leadDays: 30 },
    ],
    defaultAssetKeys: ["project-portfolio", "material-guide", "floor-plan-samples"],
    whatsappTemplate: "consultation_booked",
    nextActionType: "schedule_call",
    outcomeLabel: "Consultation booked", kpiLabel: "Consultations",
    exampleTranscript: [
      { role: "AI",   text: "Hello, this is Vikram from BuildRight. You enquired about construction." },
      { role: "Lead", text: "Yes, 40×60 site in Mysore." },
      { role: "AI",   text: "We handle G+2 and villas. Budget range? I can share our project portfolio now." },
      { role: "Lead", text: "1.5 crore budget." },
      { role: "AI",   text: "Perfect. Can I schedule a consultation with our project manager this week?" },
    ],
  },
  product: {
    id: "product", label: "Product Sales",
    icon: "Package", color: "#8B5CF6",
    tagline: "B2B SaaS, hardware, enterprise — qualify and close",
    agentNameDefault: "Alex", roleDescription: "product specialist",
    primaryGoal: "qualify and schedule a product demo",
    callToAction: "Can I schedule a 30-minute product demo?",
    locationLabel: "Office", contactRoleLabel: "Account manager",
    meetingLabel: "Product demo", assetLabel: "Spec sheet",
    defaultServices: [
      { name: "Starter plan",    rangeInr: [5000,   60000],   leadDays: 1 },
      { name: "Growth plan",     rangeInr: [15000,  180000],  leadDays: 1 },
      { name: "Enterprise plan", rangeInr: [60000,  1200000], leadDays: 3 },
    ],
    defaultAssetKeys: ["spec-sheet", "demo-video", "pricing-guide", "case-study"],
    whatsappTemplate: "demo_scheduled",
    nextActionType: "schedule_call",
    outcomeLabel: "Demo scheduled", kpiLabel: "Demos booked",
    exampleTranscript: [
      { role: "AI",   text: "Hi, I'm Alex from TechCorp. Calling about your CRM requirements." },
      { role: "Lead", text: "We use Salesforce but it's too expensive." },
      { role: "AI",   text: "We integrate with Salesforce and cost 40% less. Can I send our comparison sheet?" },
      { role: "Lead", text: "Sure, share it." },
      { role: "AI",   text: "Sending on WhatsApp now. Can I schedule a 30-min demo this Thursday?" },
    ],
  },
  finance: {
    id: "finance", label: "Financial Services",
    icon: "TrendingUp", color: "#F59E0B",
    tagline: "Insurance, loans, investments — compliant outbound calling",
    agentNameDefault: "Meera", roleDescription: "financial advisor",
    primaryGoal: "book an advisory meeting",
    callToAction: "Can I schedule a 30-minute financial review call?",
    locationLabel: "Branch", contactRoleLabel: "Financial advisor",
    meetingLabel: "Advisory meeting", assetLabel: "Fund factsheet",
    defaultServices: [
      { name: "SIP / Mutual funds", rangeInr: [1000,   100000],   leadDays: 1 },
      { name: "Life insurance",      rangeInr: [10000,  500000],   leadDays: 2 },
      { name: "Home loan",           rangeInr: [500000, 50000000], leadDays: 3 },
    ],
    defaultAssetKeys: ["fund-factsheet", "plan-summary", "calculator-pdf"],
    whatsappTemplate: "advisor_meeting_booked",
    nextActionType: "schedule_call",
    outcomeLabel: "Meeting booked", kpiLabel: "Meetings booked",
    exampleTranscript: [
      { role: "AI",   text: "Hello, I'm Meera from FinServe. Calling about your investment goals." },
      { role: "Lead", text: "I want to start SIPs but don't know where to begin." },
      { role: "AI",   text: "For ₹10K monthly, I'd suggest a balanced mix. Sending our fund factsheet now." },
      { role: "Lead", text: "Ok, share it." },
      { role: "AI",   text: "Done! Can I schedule a 30-min review call with our advisor this week?" },
    ],
  },
  healthcare: {
    id: "healthcare", label: "Healthcare",
    icon: "Stethoscope", color: "#EC4899",
    tagline: "Pharma, medical devices, clinics — ethical outreach at scale",
    agentNameDefault: "Riya", roleDescription: "medical sales representative",
    primaryGoal: "schedule a doctor visit to share clinical data",
    callToAction: "Can I schedule a brief visit to share our clinical data?",
    locationLabel: "Clinic", contactRoleLabel: "Medical representative",
    meetingLabel: "Doctor visit", assetLabel: "Product monograph",
    defaultServices: [
      { name: "Product monograph",    rangeInr: [0, 0], leadDays: 1 },
      { name: "Clinical data packet", rangeInr: [0, 0], leadDays: 1 },
      { name: "Sample kit",           rangeInr: [0, 0], leadDays: 2 },
    ],
    defaultAssetKeys: ["product-monograph", "clinical-data", "prescription-guide"],
    whatsappTemplate: "visit_scheduled",
    nextActionType: "schedule_call",
    outcomeLabel: "Visit scheduled", kpiLabel: "Doctor visits",
    exampleTranscript: [
      { role: "AI",   text: "Good morning Doctor. I'm Riya from MedPro, calling about our new antibiotic." },
      { role: "Lead", text: "Send the monograph first." },
      { role: "AI",   text: "Sharing it on WhatsApp now. Can I visit Wednesday to share the clinical data?" },
      { role: "Lead", text: "Wednesday 9am." },
      { role: "AI",   text: "Confirmed! I'll send your appointment confirmation now." },
    ],
  },
  education: {
    id: "education", label: "Education",
    icon: "GraduationCap", color: "#10B981",
    tagline: "Edtech, coaching, training — enrolment at scale",
    agentNameDefault: "Kavya", roleDescription: "education counsellor",
    primaryGoal: "book a free trial class or demo session",
    callToAction: "Can I book a free trial session for you?",
    locationLabel: "Learning centre", contactRoleLabel: "Counsellor",
    meetingLabel: "Trial class", assetLabel: "Course brochure",
    defaultServices: [
      { name: "Trial class",    rangeInr: [0,     0],      leadDays: 1 },
      { name: "Monthly plan",   rangeInr: [2000,  12000],  leadDays: 2 },
      { name: "Annual plan",    rangeInr: [15000, 80000],  leadDays: 3 },
    ],
    defaultAssetKeys: ["course-brochure", "syllabus", "success-stories"],
    whatsappTemplate: "trial_class_booked",
    nextActionType: "book_visit",
    outcomeLabel: "Trial class booked", kpiLabel: "Trial bookings",
    exampleTranscript: [
      { role: "AI",   text: "Hi, I'm Kavya from SkillUp. Calling about your IELTS preparation." },
      { role: "Lead", text: "Yes, I want to take the exam in 3 months." },
      { role: "AI",   text: "Perfect timing. Can I book you a free trial class this Saturday?" },
      { role: "Lead", text: "Saturday works." },
      { role: "AI",   text: "Booked! I'll send the class details and course syllabus on WhatsApp." },
    ],
  },
  custom: {
    id: "custom", label: "Custom / Other",
    icon: "Sparkles", color: "#6B7280",
    tagline: "Any B2B sales use case — configure your own AI agent",
    agentNameDefault: "Alex", roleDescription: "sales consultant",
    primaryGoal: "qualify the lead and book a meeting",
    callToAction: "Can I schedule a brief call to discuss your needs?",
    locationLabel: "Office", contactRoleLabel: "Account manager",
    meetingLabel: "Meeting", assetLabel: "Information pack",
    defaultServices: [],
    defaultAssetKeys: ["info-pack", "brochure"],
    whatsappTemplate: "meeting_confirmed",
    nextActionType: "schedule_call",
    outcomeLabel: "Meeting booked", kpiLabel: "Meetings booked",
    exampleTranscript: [
      { role: "AI",   text: "Hello, I'm Alex calling on behalf of your company." },
      { role: "Lead", text: "Yes, what's this about?" },
      { role: "AI",   text: "I wanted to understand your needs and see how we can help." },
    ],
  },
};

export const VERTICAL_LIST = Object.values(VERTICALS);

// Map DomainVertical enum (Prisma) to VerticalId
export const PRISMA_TO_VERTICAL: Record<string, VerticalId> = {
  INTERIOR_DESIGN:    "interior",
  REAL_ESTATE:        "real_estate",
  CONSTRUCTION:       "construction",
  PRODUCT_SALES:      "product",
  FINANCIAL_SERVICES: "finance",
  HEALTHCARE:         "healthcare",
  EDUCATION:          "education",
  CUSTOM:             "custom",
  GENERIC:            "custom",
};

export function getVerticalConfig(vertical: string): VerticalConfig {
  const id = PRISMA_TO_VERTICAL[vertical] || "custom";
  return VERTICALS[id];
}
