export interface Solution {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: "business" | "saas" | "startup";
}

/** Used by homepage features component and MCP server parser */
export const features = [
  {
    title: "System Integration",
    description:
      "API integration, B2B integration, and accounting integration across QuickBooks, HubSpot, Stripe, and NetSuite for seamless communication and real-time insights.",
    icon: "bx:bx-link-alt",
  },
  {
    title: "Business Automation",
    description:
      "Automate repetitive tasks with RPA and streamline workflows. Consolidate financial data from multiple sources into accurate, timely reporting.",
    icon: "bx:bx-bot",
  },
  {
    title: "Financial Reporting & Dashboards",
    description:
      "CXO dashboards with real-time business performance data from accounting, ERP, CRM, payroll, and eCommerce systems in one reporting view.",
    icon: "bx:bx-bar-chart-alt-2",
  },
  {
    title: "Multiple Accounting Integration",
    description:
      "Integrate your SaaS platform with QuickBooks, Xero, Zoho Books, and more. Real-time updates and bi-directional sync across platforms.",
    icon: "bx:bx-calculator",
  },
  {
    title: "Multiple ERP Integration",
    description:
      "Connect to SAP, NetSuite, Sage, and Dynamics 365. Ready-to-deploy integrations on AWS, Azure, and Google Cloud with full source code ownership.",
    icon: "bx:bx-server",
  },
  {
    title: "FinTech Solutions",
    description:
      "Purchasing, accounting, payroll software, budgeting, admin & asset management, and MIS dashboards for finance teams and SaaS platforms.",
    icon: "bx:bx-wallet",
  },
];

export const solutionCategories = [
  {
    id: "for-business",
    title: "For Business",
    items: [
      {
        title: "Accounting Automation",
        description: "AP, AR, reconciliation & close automation.",
        href: "/solutions",
      },
      {
        title: "Financial Reporting & Dashboards",
        description: "Real-time financial visibility across systems.",
        href: "/solutions",
      },
      {
        title: "Connected Business Systems",
        description: "ERP, CRM & integration across your stack.",
        href: "/solutions",
      },
      {
        title: "Autonomous Finance Operations",
        description: "Workflows & anomaly detection for finance teams.",
        href: "/solutions",
      },
    ],
  },
  {
    id: "for-saas",
    title: "For SaaS Platforms",
    items: [
      {
        title: "Unified Integration Platform",
        description: "One API for multiple ERPs and accounting systems.",
        href: "/solutions",
      },
      {
        title: "Accounting Product Development",
        description: "Build accounting features faster with domain experts.",
        href: "/solutions",
      },
      {
        title: "Multi-Platform Integrations",
        description: "Connect to 50+ systems with production-tested patterns.",
        href: "/solutions",
      },
      {
        title: "Staff Augmentation",
        description: "Extend your engineering team with finance-domain experts.",
        href: "/contact",
      },
    ],
  },
];
