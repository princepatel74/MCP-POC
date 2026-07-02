export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export const faqs: FaqItem[] = [
  {
    id: "specialization",
    question: "What does Satva Solutions specialize in?",
    answer:
      "Satva Solutions specializes in accounting integrations, ERP integrations, finance automation, SaaS product development, reporting dashboards, and custom business system integrations. The team combines finance domain knowledge with engineering expertise.",
    category: "General",
  },
  {
    id: "platforms",
    question: "Which accounting and ERP systems can Satva Solutions integrate?",
    answer:
      "We work with QuickBooks, Xero, MYOB, FreshBooks, Zoho Books, SAP, Oracle NetSuite, Sage, Microsoft Dynamics 365 Business Central, Odoo, and Acumatica — helping businesses connect finance data and reduce manual data entry.",
    category: "Integrations",
  },
  {
    id: "saas-integrations",
    question: "Can Satva Solutions help SaaS companies build accounting integrations?",
    answer:
      "Yes. We help SaaS companies build accounting and ERP integrations including API integration, authentication, data mapping, bi-directional sync, marketplace launch support, and ongoing maintenance.",
    category: "SaaS",
  },
  {
    id: "automation",
    question: "What business processes can Satva Solutions automate?",
    answer:
      "Invoice processing, accounts payable, accounts receivable, bank reconciliation, order sync, inventory updates, payment matching, payroll journal posting, financial reporting, and document processing.",
    category: "Automation",
  },
  {
    id: "dashboards",
    question: "Does Satva Solutions build financial reporting dashboards?",
    answer:
      "Yes. We build dashboards connecting accounting, ERP, CRM, payroll, eCommerce, and inventory systems — showing cash flow, revenue, profitability, reconciliation status, and business KPIs.",
    category: "Reporting",
  },
  {
    id: "connected-systems",
    question: "Can Satva Solutions connect CRM, eCommerce, payroll, and accounting systems?",
    answer:
      "Yes. We connect Salesforce, HubSpot, Shopify, WooCommerce, payroll systems, payment gateways, inventory tools, and accounting software into connected workflows.",
    category: "Integrations",
  },
  {
    id: "reduce-manual-work",
    question: "How can Satva Solutions reduce manual accounting work?",
    answer:
      "By replacing spreadsheets, CSV imports, and duplicate data entry with API integrations, workflow automation, smart document processing, and accounting-aware validation rules.",
    category: "Automation",
  },
  {
    id: "staff-augmentation",
    question: "Does Satva Solutions offer IT staff augmentation?",
    answer:
      "Yes. We offer staff augmentation for accounting and FinTech projects — developers, integration specialists, QA engineers, AI/ML engineers, and product engineers with finance-domain expertise.",
    category: "Services",
  },
];
