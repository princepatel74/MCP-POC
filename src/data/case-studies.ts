export interface CaseStudy {
  id: string;
  title: string;
  client: string;
  summary: string;
  metric: string;
  metricLabel: string;
  tags: string[];
  image: string;
}

export const caseStudies: CaseStudy[] = [
  {
    id: "crystal-clear",
    title: "Cutting Manual Data Entry by 75% for a Leading Skincare Brand",
    client: "Crystal Clear",
    summary:
      "Crystal Clear struggled with multi-platform operations across Shopify, WooCommerce, HubSpot, Linnworks, Xero, and Stripe. Satva built a centralized web app that automated orders, inventory, customer data, and payments — syncing everything in real-time across B2B and B2C channels.",
    metric: "75%",
    metricLabel: "less manual data entry",
    tags: ["Shopify", "HubSpot", "Xero", "Stripe", "WooCommerce"],
    image:
      "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&h=500&fit=crop",
  },
  {
    id: "3nstar",
    title: "60% Less Manual Work for Global POS Distributor, 3nStar",
    client: "3nStar",
    summary:
      "3nStar struggled with manual inventory, warranty tracking, and warehouse workflows. Satva built a centralized platform integrated with QuickBooks Desktop — cutting manual tasks by 60% and improving accuracy, speed, and service center coordination.",
    metric: "60%",
    metricLabel: "less manual work",
    tags: ["QuickBooks Desktop", "Inventory", "Warehouse"],
    image:
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&h=500&fit=crop",
  },
  {
    id: "calxa-netsuite",
    title: "NetSuite Integration for Leading Australian Forecasting Software, Calxa",
    client: "Calxa",
    summary:
      "Calxa aimed to integrate NetSuite for smarter financial data management. Satva built a secure API integration with OAuth 2.0, automated monthly data syncing, and intuitive tax code mapping — enhancing efficiency for 1,300+ NFPs and businesses.",
    metric: "1,300+",
    metricLabel: "organizations served",
    tags: ["NetSuite", "OAuth 2.0", "Forecasting"],
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=500&fit=crop",
  },
  {
    id: "cost-allocation-pro",
    title: "How We Turned Excel Into a Profitable SaaS App in 9 Months",
    client: "Cost Allocation Pro",
    summary:
      "Satva helped Cost Allocation Pro transition from an error-prone Excel system to a cloud-based web application integrated with QuickBooks Online — automating data entry, streamlining workflows, and enhancing data accuracy for nonprofit financial operations.",
    metric: "9 mo",
    metricLabel: "to profitable SaaS",
    tags: ["QuickBooks Online", "SaaS", "Nonprofit"],
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=500&fit=crop",
  },
  {
    id: "fraxion",
    title: "Multi Accounting Integration for an eProcurement SaaS Software",
    client: "Fraxion",
    summary:
      "Fraxion faced challenges with manual data import/export and costly iPaaS fees. Satva integrated accounting processes across six platforms — QuickBooks Online, QuickBooks Desktop, Xero, NetSuite, Sage Intacct, and Dynamics 365 Business Central.",
    metric: "6",
    metricLabel: "accounting platforms",
    tags: ["eProcurement", "Multi-ERP", "SaaS"],
    image:
      "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&h=500&fit=crop",
  },
];
