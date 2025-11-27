import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { ValidationStatus } from "@/lib/validation";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ValidationIndicatorProps {
  status: ValidationStatus;
  message?: string;
}

export const ValidationIndicator = ({ status, message }: ValidationIndicatorProps) => {
  const Icon = {
    pass: CheckCircle2,
    fail: XCircle,
    missing: AlertCircle,
  }[status];

  const colorClass = {
    pass: "text-green-500",
    fail: "text-red-500",
    missing: "text-amber-500",
  }[status];

  const indicator = (
    <Icon className={`h-4 w-4 ${colorClass}`} />
  );

  if (!message) {
    return indicator;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-help">{indicator}</div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{message}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
