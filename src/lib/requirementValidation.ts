import { ComparisonOperator } from "./certificateFields";

export type ValidationStatus = "pass" | "fail" | "missing";

export interface ValidationResult {
  fieldName: string;
  status: ValidationStatus;
  message?: string;
}

/**
 * Validates a single field value against a requirement rule
 */
export const validateField = (
  fieldValue: string | undefined | null,
  expectedValue: string,
  operator: ComparisonOperator
): ValidationStatus => {
  // If field is empty/missing
  if (!fieldValue || fieldValue.trim() === "") {
    return "missing";
  }

  const normalizedFieldValue = fieldValue.trim().toLowerCase();
  const normalizedExpectedValue = expectedValue.trim().toLowerCase();

  // Try to parse as numbers for numeric comparisons
  const fieldNum = parseFloat(fieldValue.replace(/[,$]/g, ""));
  const expectedNum = parseFloat(expectedValue.replace(/[,$]/g, ""));
  const isNumeric = !isNaN(fieldNum) && !isNaN(expectedNum);

  switch (operator) {
    case "equal_to":
      if (isNumeric) {
        return fieldNum === expectedNum ? "pass" : "fail";
      }
      return normalizedFieldValue === normalizedExpectedValue ? "pass" : "fail";

    case "not_equal_to":
      if (isNumeric) {
        return fieldNum !== expectedNum ? "pass" : "fail";
      }
      return normalizedFieldValue !== normalizedExpectedValue ? "pass" : "fail";

    case "greater_than":
      if (isNumeric) {
        return fieldNum > expectedNum ? "pass" : "fail";
      }
      return "fail"; // Can't compare non-numeric values

    case "less_than":
      if (isNumeric) {
        return fieldNum < expectedNum ? "pass" : "fail";
      }
      return "fail";

    case "greater_than_or_equal":
      if (isNumeric) {
        return fieldNum >= expectedNum ? "pass" : "fail";
      }
      return "fail";

    case "less_than_or_equal":
      if (isNumeric) {
        return fieldNum <= expectedNum ? "pass" : "fail";
      }
      return "fail";

    case "contains":
      return normalizedFieldValue.includes(normalizedExpectedValue) ? "pass" : "fail";

    case "not_contains":
      return !normalizedFieldValue.includes(normalizedExpectedValue) ? "pass" : "fail";

    default:
      return "fail";
  }
};

/**
 * Validates extracted data against a set of requirement rules
 */
export const validateExtractedData = (
  extractedData: any,
  rules: any[]
): Map<string, ValidationResult> => {
  const results = new Map<string, ValidationResult>();

  for (const rule of rules) {
    const fieldName = rule.field_name;
    let fieldValue: string | undefined;

    // Extract field value based on field name
    // Handle general fields
    if (fieldName === "named_insured") {
      fieldValue = extractedData.namedInsured;
    } else if (fieldName === "certificate_holder") {
      fieldValue = extractedData.certificateHolder;
    } else if (fieldName === "additional_insured") {
      fieldValue = extractedData.additionalInsured;
    } else if (fieldName === "cancellation_notice_period") {
      fieldValue = extractedData.cancellationNotice;
    } else if (fieldName === "form_type") {
      fieldValue = extractedData.formType;
    }
    // Handle GL fields
    else if (fieldName === "gl_company_name") {
      fieldValue = extractedData.coverages?.generalLiability?.insuranceCompany;
    } else if (fieldName === "gl_policy_number") {
      fieldValue = extractedData.coverages?.generalLiability?.policyNumber;
    } else if (fieldName === "gl_coverage_limits") {
      fieldValue = extractedData.coverages?.generalLiability?.coverageLimit;
    } else if (fieldName === "gl_coverage_currency") {
      fieldValue = extractedData.coverages?.generalLiability?.currency;
    } else if (fieldName === "gl_deductible") {
      fieldValue = extractedData.coverages?.generalLiability?.deductible;
    } else if (fieldName === "gl_deductible_currency") {
      fieldValue = extractedData.coverages?.generalLiability?.currency;
    } else if (fieldName === "gl_effective_date") {
      fieldValue = extractedData.coverages?.generalLiability?.effectiveDate;
    } else if (fieldName === "gl_expiry_date") {
      fieldValue = extractedData.coverages?.generalLiability?.expiryDate;
    }
    // Handle Auto fields
    else if (fieldName === "auto_company_name") {
      fieldValue = extractedData.coverages?.autoLiability?.insuranceCompany;
    } else if (fieldName === "auto_policy_number") {
      fieldValue = extractedData.coverages?.autoLiability?.policyNumber;
    } else if (fieldName === "auto_coverage_limits") {
      fieldValue = extractedData.coverages?.autoLiability?.coverageLimit;
    } else if (fieldName === "auto_coverage_currency") {
      fieldValue = extractedData.coverages?.autoLiability?.currency;
    } else if (fieldName === "auto_deductible") {
      fieldValue = extractedData.coverages?.autoLiability?.deductible;
    } else if (fieldName === "auto_deductible_currency") {
      fieldValue = extractedData.coverages?.autoLiability?.currency;
    } else if (fieldName === "auto_effective_date") {
      fieldValue = extractedData.coverages?.autoLiability?.effectiveDate;
    } else if (fieldName === "auto_expiry_date") {
      fieldValue = extractedData.coverages?.autoLiability?.expiryDate;
    }
    // Handle Trailer fields
    else if (fieldName === "trailer_company_name") {
      fieldValue = extractedData.coverages?.trailerLiability?.insuranceCompany;
    } else if (fieldName === "trailer_policy_number") {
      fieldValue = extractedData.coverages?.trailerLiability?.policyNumber;
    } else if (fieldName === "trailer_coverage_limits") {
      fieldValue = extractedData.coverages?.trailerLiability?.coverageLimit;
    } else if (fieldName === "trailer_coverage_currency") {
      fieldValue = extractedData.coverages?.trailerLiability?.currency;
    } else if (fieldName === "trailer_deductible") {
      fieldValue = extractedData.coverages?.trailerLiability?.deductible;
    } else if (fieldName === "trailer_deductible_currency") {
      fieldValue = extractedData.coverages?.trailerLiability?.currency;
    } else if (fieldName === "trailer_effective_date") {
      fieldValue = extractedData.coverages?.trailerLiability?.effectiveDate;
    } else if (fieldName === "trailer_expiry_date") {
      fieldValue = extractedData.coverages?.trailerLiability?.expiryDate;
    }

    const status = validateField(
      fieldValue,
      rule.expected_value || "",
      rule.comparison_operator
    );

    results.set(fieldName, {
      fieldName,
      status,
    });
  }

  return results;
};
