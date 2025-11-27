export type ComparisonOperator = "equals" | "greater_than" | "less_than" | "contains" | "not_equals";
export type LogicalOperator = "and" | "or" | "not";

export interface FieldRule {
  fieldName: string;
  fieldLabel: string;
  expectedValue: string;
  comparisonOperator: ComparisonOperator;
  logicalOperator?: LogicalOperator;
  enabled: boolean;
}

export interface RequirementSet {
  id: string;
  name: string;
  description: string;
  rules: FieldRule[];
  createdAt: string;
}

export const CERTIFICATE_FIELDS = [
  // General Information
  { name: "namedInsured", label: "Named Insured", category: "General" },
  { name: "certificateHolder", label: "Certificate Holder", category: "General" },
  { name: "additionalInsured", label: "Additional Insured", category: "General" },
  { name: "cancellationNoticePeriod", label: "Cancellation Notice Period", category: "General" },
  { name: "formType", label: "Form Type", category: "General" },
  
  // Commercial General Liability
  { name: "gl_company", label: "GL - Insurance Company", category: "Commercial General Liability" },
  { name: "gl_policyNumber", label: "GL - Policy Number", category: "Commercial General Liability" },
  { name: "gl_limits", label: "GL - Coverage Limits", category: "Commercial General Liability" },
  { name: "gl_deductible", label: "GL - Deductible", category: "Commercial General Liability" },
  { name: "gl_effectiveDate", label: "GL - Effective Date", category: "Commercial General Liability" },
  { name: "gl_expiryDate", label: "GL - Expiry Date", category: "Commercial General Liability" },
  
  // Automobile Liability
  { name: "auto_company", label: "Auto - Insurance Company", category: "Automobile Liability" },
  { name: "auto_policyNumber", label: "Auto - Policy Number", category: "Automobile Liability" },
  { name: "auto_limits", label: "Auto - Coverage Limits", category: "Automobile Liability" },
  { name: "auto_deductible", label: "Auto - Deductible", category: "Automobile Liability" },
  { name: "auto_effectiveDate", label: "Auto - Effective Date", category: "Automobile Liability" },
  { name: "auto_expiryDate", label: "Auto - Expiry Date", category: "Automobile Liability" },
  
  // Non-Owned Trailer Liability
  { name: "trailer_company", label: "Trailer - Insurance Company", category: "Non-Owned Trailer Liability" },
  { name: "trailer_policyNumber", label: "Trailer - Policy Number", category: "Non-Owned Trailer Liability" },
  { name: "trailer_limits", label: "Trailer - Coverage Limits", category: "Non-Owned Trailer Liability" },
  { name: "trailer_deductible", label: "Trailer - Deductible", category: "Non-Owned Trailer Liability" },
  { name: "trailer_effectiveDate", label: "Trailer - Effective Date", category: "Non-Owned Trailer Liability" },
  { name: "trailer_expiryDate", label: "Trailer - Expiry Date", category: "Non-Owned Trailer Liability" },
];
