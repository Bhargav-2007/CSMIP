// Mock data - used as fallback when the backend DB is unavailable
export const MOCK_SERVICES = [
  {
    id: "1",
    name: "Birth Certificate",
    slug: "birth-certificate",
    description: "Apply for an official birth certificate from the vital records office. Required for school admissions, passports, and government IDs.",
    category: "Vital Records",
    fee: 100,
    sla_days: 5,
    icon: "FileTextIcon",
    requirements: ["Hospital birth record", "Parents' Aadhaar", "Address proof"]
  },
  {
    id: "2",
    name: "Death Certificate",
    slug: "death-certificate",
    description: "Apply for an official death certificate. Required for insurance claims, property transfer, and legal matters.",
    category: "Vital Records",
    fee: 50,
    sla_days: 3,
    icon: "FileTextIcon",
    requirements: ["Medical report / hospital record", "Informant's Aadhaar"]
  },
  {
    id: "3",
    name: "Property Tax Payment",
    slug: "property-tax",
    description: "Pay your annual property tax and obtain a tax-paid certificate. Applicable for residential and commercial properties.",
    category: "Property",
    fee: 0,
    sla_days: 1,
    icon: "HomeIcon",
    requirements: ["Property deed", "Aadhaar card", "Previous tax receipt"]
  },
  {
    id: "4",
    name: "Water Bill Payment",
    slug: "water-bill",
    description: "Pay monthly water bill and manage your municipal water connection. Get duplicate receipts and resolve billing disputes.",
    category: "Utilities",
    fee: 0,
    sla_days: 1,
    icon: "DropletIcon",
    requirements: ["Consumer number", "Aadhaar card"]
  },
  {
    id: "5",
    name: "Trade License",
    slug: "trade-license",
    description: "Obtain or renew your trade license for running a business within the municipality. Mandatory for all commercial establishments.",
    category: "Business",
    fee: 500,
    sla_days: 14,
    icon: "StoreIcon",
    requirements: ["Business address proof", "Owner Aadhaar", "NOC from fire department"]
  },
  {
    id: "6",
    name: "Building Plan Approval",
    slug: "building-plan",
    description: "Get your construction or renovation plan approved by the municipal authority before starting any building work.",
    category: "Property",
    fee: 2000,
    sla_days: 30,
    icon: "Building2Icon",
    requirements: ["Land ownership documents", "Architect-signed drawings", "Site plan"]
  },
  {
    id: "7",
    name: "Marriage Certificate",
    slug: "marriage-certificate",
    description: "Register your marriage and obtain an official marriage certificate recognized by government authorities.",
    category: "Vital Records",
    fee: 150,
    sla_days: 7,
    icon: "HeartIcon",
    requirements: ["Age proof of both parties", "Address proof", "Witnesses' Aadhaar", "Wedding photos"]
  },
  {
    id: "8",
    name: "Domicile Certificate",
    slug: "domicile-certificate",
    description: "Get a domicile / residence certificate proving your permanent residence for scholarship and job applications.",
    category: "Identity",
    fee: 50,
    sla_days: 7,
    icon: "FileTextIcon",
    requirements: ["Aadhaar card", "Ration card or utility bill", "Self-declaration affidavit"]
  },
  {
    id: "9",
    name: "Income Certificate",
    slug: "income-certificate",
    description: "Obtain an income certificate from the Tehsildar office for scholarship, BPL, and government scheme applications.",
    category: "Identity",
    fee: 30,
    sla_days: 10,
    icon: "FileTextIcon",
    requirements: ["Aadhaar card", "Salary slip or employer letter", "Bank passbook"]
  },
];

export const MOCK_ALERTS = [
  { id: "1", title: "Municipal offices closed on July 4 — National Holiday" },
  { id: "2", title: "New: Online birth certificate fast-track now available in 48 hrs" },
  { id: "3", title: "Property tax payment deadline extended to July 31, 2026" },
];
