export interface Service {
  name: string
  description: string
  sla: string
  popularity: number
}

export interface ServiceCategory {
  id: string
  name: string
  description: string
  icon: any
  color: string
  services: Service[]
}

export const employeeServices: ServiceCategory[] = [
  {
    id: "it",
    name: "IT Services",
    description: "Technology support and equipment requests",
    icon: null, // Will be set dynamically
    color: "bg-blue-500",
    services: [
      { name: "Laptop Request", description: "Request new laptop or replacement", sla: "3-5 days", popularity: 5 },
      { name: "Software Installation", description: "Install approved software", sla: "1-2 days", popularity: 4 },
      { name: "VPN Access", description: "Request VPN access for remote work", sla: "Same day", popularity: 5 },
      { name: "Password Reset", description: "Reset forgotten passwords", sla: "2 hours", popularity: 3 },
      { name: "BYOD Setup", description: "Configure personal device for work", sla: "1-2 days", popularity: 2 },
    ],
  },
  {
    id: "hr",
    name: "HR Services",
    description: "Human resources and employee support",
    icon: null,
    color: "bg-green-500",
    services: [
      {
        name: "Employment Letter",
        description: "Request employment verification letter",
        sla: "2-3 days",
        popularity: 4,
      },
      { name: "Leave Request", description: "Submit vacation or sick leave", sla: "1-2 days", popularity: 5 },
      {
        name: "Benefits Inquiry",
        description: "Questions about health, dental, retirement",
        sla: "Same day",
        popularity: 3,
      },
      { name: "Payroll Issue", description: "Report payroll discrepancies", sla: "1-2 days", popularity: 2 },
      { name: "Grievance Filing", description: "File formal complaint or grievance", sla: "5-7 days", popularity: 1 },
    ],
  },
  {
    id: "finance",
    name: "Finance Services",
    description: "Financial processes and reimbursements",
    icon: null,
    color: "bg-yellow-500",
    services: [
      {
        name: "Expense Reimbursement",
        description: "Submit expenses for reimbursement",
        sla: "5-7 days",
        popularity: 5,
      },
      { name: "Purchase Order", description: "Request new purchase order", sla: "3-5 days", popularity: 3 },
      { name: "Vendor Onboarding", description: "Add new vendor to system", sla: "7-10 days", popularity: 2 },
      { name: "Corporate Card", description: "Request corporate credit card", sla: "10-14 days", popularity: 2 },
      { name: "Invoice Query", description: "Questions about invoices or payments", sla: "1-2 days", popularity: 3 },
    ],
  },
  {
    id: "legal",
    name: "Legal Services",
    description: "Legal documents and compliance support",
    icon: null,
    color: "bg-purple-500",
    services: [
      { name: "NDA Request", description: "Non-disclosure agreement preparation", sla: "3-5 days", popularity: 4 },
      { name: "Contract Review", description: "Legal review of contracts", sla: "5-7 days", popularity: 3 },
      { name: "MSA Preparation", description: "Master service agreement drafting", sla: "7-10 days", popularity: 2 },
      { name: "IP Filing", description: "Intellectual property registration", sla: "14-21 days", popularity: 1 },
      { name: "Legal Consultation", description: "General legal advice", sla: "2-3 days", popularity: 2 },
    ],
  },
  {
    id: "facilities",
    name: "Facilities & Admin",
    description: "Office facilities and administrative support",
    icon: null,
    color: "bg-orange-500",
    services: [
      { name: "Office Supplies", description: "Request office supplies", sla: "1-2 days", popularity: 4 },
      { name: "Meeting Room Booking", description: "Book conference rooms", sla: "Same day", popularity: 5 },
      { name: "Access Card", description: "Request or replace access card", sla: "2-3 days", popularity: 3 },
      { name: "Parking Permit", description: "Request parking space", sla: "3-5 days", popularity: 2 },
      { name: "Maintenance Request", description: "Report facility issues", sla: "1-2 days", popularity: 3 },
    ],
  },
]

export const customerServices: ServiceCategory[] = [
  {
    id: "technical-support",
    name: "Technical Support",
    description: "Product technical assistance and troubleshooting",
    icon: null,
    color: "bg-blue-500",
    services: [
      { name: "Product Setup", description: "Help with initial product configuration", sla: "4 hours", popularity: 5 },
      { name: "Bug Report", description: "Report software bugs or issues", sla: "2 hours", popularity: 4 },
      { name: "Integration Support", description: "Help with third-party integrations", sla: "8 hours", popularity: 3 },
      { name: "Performance Issue", description: "Report performance problems", sla: "4 hours", popularity: 3 },
      { name: "Feature Request", description: "Request new product features", sla: "1-2 days", popularity: 2 },
    ],
  },
  {
    id: "account-management",
    name: "Account Management",
    description: "Account and billing support services",
    icon: null,
    color: "bg-green-500",
    services: [
      { name: "Billing Inquiry", description: "Questions about invoices and billing", sla: "4 hours", popularity: 4 },
      { name: "Plan Upgrade", description: "Upgrade subscription plan", sla: "2 hours", popularity: 3 },
      { name: "User Management", description: "Add or remove user accounts", sla: "2 hours", popularity: 4 },
      { name: "Contract Review", description: "Review contract terms and conditions", sla: "1-2 days", popularity: 2 },
      { name: "Renewal Discussion", description: "Discuss contract renewal options", sla: "4 hours", popularity: 3 },
    ],
  },
  {
    id: "customer-success",
    name: "Customer Success",
    description: "Customer success and onboarding support",
    icon: null,
    color: "bg-purple-500",
    services: [
      { name: "Onboarding", description: "New customer onboarding assistance", sla: "1-2 days", popularity: 5 },
      { name: "Training Session", description: "Schedule product training", sla: "3-5 days", popularity: 4 },
      { name: "Best Practices", description: "Guidance on product best practices", sla: "1-2 days", popularity: 3 },
      { name: "Health Check", description: "Account health and optimization review", sla: "5-7 days", popularity: 2 },
      { name: "Success Planning", description: "Create success roadmap", sla: "10-14 days", popularity: 1 },
    ],
  },
]
