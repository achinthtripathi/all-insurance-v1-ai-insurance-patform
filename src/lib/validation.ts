import { ComparisonOperator } from "./certificateFields";

export type ValidationStatus = "pass" | "fail" | "missing";

export interface ValidationResult {
  status: ValidationStatus;
  message?: string;
}

/**
 * Validates a field value against a requirement rule
 */
export const validateField = (
  value: string | undefined,
  expectedValue: string,
  operator: ComparisonOperator
): ValidationResult => {
  // Check if field is missing
  if (!value || value.trim() === "") {
    return {
      status: "missing",
      message: "Field is empty",
    };
  }

  const actualValue = value.trim();
  const expected = expectedValue.trim();

  try {
    switch (operator) {
      case "equal_to":
        return {
          status: actualValue === expected ? "pass" : "fail",
          message: actualValue === expected ? "Matches requirement" : `Expected: ${expected}`,
        };

      case "not_equal_to":
        return {
          status: actualValue !== expected ? "pass" : "fail",
          message: actualValue !== expected ? "Does not match" : `Should not equal: ${expected}`,
        };

      case "contains":
        return {
          status: actualValue.toLowerCase().includes(expected.toLowerCase()) ? "pass" : "fail",
          message: actualValue.toLowerCase().includes(expected.toLowerCase())
            ? "Contains required text"
            : `Must contain: ${expected}`,
        };

      case "not_contains":
        return {
          status: !actualValue.toLowerCase().includes(expected.toLowerCase()) ? "pass" : "fail",
          message: !actualValue.toLowerCase().includes(expected.toLowerCase())
            ? "Does not contain text"
            : `Must not contain: ${expected}`,
        };

      case "greater_than": {
        const actualNum = parseFloat(actualValue.replace(/[^0-9.-]/g, ""));
        const expectedNum = parseFloat(expected.replace(/[^0-9.-]/g, ""));
        
        if (isNaN(actualNum) || isNaN(expectedNum)) {
          return {
            status: "fail",
            message: "Invalid number format",
          };
        }
        
        return {
          status: actualNum > expectedNum ? "pass" : "fail",
          message: actualNum > expectedNum
            ? `${actualNum.toLocaleString()} > ${expectedNum.toLocaleString()}`
            : `Must be greater than ${expectedNum.toLocaleString()}`,
        };
      }

      case "less_than": {
        const actualNum = parseFloat(actualValue.replace(/[^0-9.-]/g, ""));
        const expectedNum = parseFloat(expected.replace(/[^0-9.-]/g, ""));
        
        if (isNaN(actualNum) || isNaN(expectedNum)) {
          return {
            status: "fail",
            message: "Invalid number format",
          };
        }
        
        return {
          status: actualNum < expectedNum ? "pass" : "fail",
          message: actualNum < expectedNum
            ? `${actualNum.toLocaleString()} < ${expectedNum.toLocaleString()}`
            : `Must be less than ${expectedNum.toLocaleString()}`,
        };
      }

      case "greater_than_or_equal": {
        const actualNum = parseFloat(actualValue.replace(/[^0-9.-]/g, ""));
        const expectedNum = parseFloat(expected.replace(/[^0-9.-]/g, ""));
        
        if (isNaN(actualNum) || isNaN(expectedNum)) {
          return {
            status: "fail",
            message: "Invalid number format",
          };
        }
        
        return {
          status: actualNum >= expectedNum ? "pass" : "fail",
          message: actualNum >= expectedNum
            ? `${actualNum.toLocaleString()} ≥ ${expectedNum.toLocaleString()}`
            : `Must be at least ${expectedNum.toLocaleString()}`,
        };
      }

      case "less_than_or_equal": {
        const actualNum = parseFloat(actualValue.replace(/[^0-9.-]/g, ""));
        const expectedNum = parseFloat(expected.replace(/[^0-9.-]/g, ""));
        
        if (isNaN(actualNum) || isNaN(expectedNum)) {
          return {
            status: "fail",
            message: "Invalid number format",
          };
        }
        
        return {
          status: actualNum <= expectedNum ? "pass" : "fail",
          message: actualNum <= expectedNum
            ? `${actualNum.toLocaleString()} ≤ ${expectedNum.toLocaleString()}`
            : `Must be at most ${expectedNum.toLocaleString()}`,
        };
      }

      default:
        return {
          status: "fail",
          message: "Unknown operator",
        };
    }
  } catch (error) {
    return {
      status: "fail",
      message: "Validation error",
    };
  }
};
