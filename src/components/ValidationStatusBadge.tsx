import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { ValidationStatus } from "@/lib/requirementValidation";

interface ValidationStatusBadgeProps {
  status: ValidationStatus;
  className?: string;
}

export const ValidationStatusBadge = ({ status, className = "" }: ValidationStatusBadgeProps) => {
  if (status === "pass") {
    return (
      <CheckCircle2 className={`h-4 w-4 text-green-600 ${className}`} />
    );
  }

  if (status === "fail") {
    return (
      <XCircle className={`h-4 w-4 text-red-600 ${className}`} />
    );
  }

  // missing
  return (
    <AlertCircle className={`h-4 w-4 text-yellow-600 ${className}`} />
  );
};
