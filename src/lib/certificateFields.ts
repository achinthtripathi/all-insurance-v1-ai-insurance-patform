// Certificate field definitions for validation rules
export const CERTIFICATE_FIELDS = {
  // General Information
  named_insured: "Named Insured",
  certificate_holder: "Certificate Holder",
  additional_insured: "Additional Insured",
  cancellation_notice_period: "Cancellation Notice Period",
  form_type: "Form Type",
  
  // General Liability Coverage
  gl_company_name: "GL - Company Name",
  gl_policy_number: "GL - Policy Number",
  gl_coverage_limits: "GL - Coverage Limits",
  gl_coverage_currency: "GL - Coverage Currency",
  gl_deductible: "GL - Deductible",
  gl_deductible_currency: "GL - Deductible Currency",
  gl_effective_date: "GL - Effective Date",
  gl_expiry_date: "GL - Expiry Date",
  
  // Automobile Liability Coverage
  auto_company_name: "Auto - Company Name",
  auto_policy_number: "Auto - Policy Number",
  auto_coverage_limits: "Auto - Coverage Limits",
  auto_coverage_currency: "Auto - Coverage Currency",
  auto_deductible: "Auto - Deductible",
  auto_deductible_currency: "Auto - Deductible Currency",
  auto_effective_date: "Auto - Effective Date",
  auto_expiry_date: "Auto - Expiry Date",
  
  // Non-Owned Trailer Liability Coverage
  trailer_company_name: "Trailer - Company Name",
  trailer_policy_number: "Trailer - Policy Number",
  trailer_coverage_limits: "Trailer - Coverage Limits",
  trailer_coverage_currency: "Trailer - Coverage Currency",
  trailer_deductible: "Trailer - Deductible",
  trailer_deductible_currency: "Trailer - Deductible Currency",
  trailer_effective_date: "Trailer - Effective Date",
  trailer_expiry_date: "Trailer - Expiry Date",
} as const;

export type CertificateFieldKey = keyof typeof CERTIFICATE_FIELDS;

export const COMPARISON_OPERATORS = {
  equal_to: "Equal to (=)",
  not_equal_to: "Not equal to (≠)",
  greater_than: "Greater than (>)",
  less_than: "Less than (<)",
  greater_than_or_equal: "Greater than or equal (≥)",
  less_than_or_equal: "Less than or equal (≤)",
  contains: "Contains",
  not_contains: "Does not contain",
} as const;

export type ComparisonOperator = keyof typeof COMPARISON_OPERATORS;

export const LOGICAL_OPERATORS = {
  and: "AND",
  or: "OR",
  not: "NOT",
} as const;

export type LogicalOperator = keyof typeof LOGICAL_OPERATORS;
