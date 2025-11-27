import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import {
  CERTIFICATE_FIELDS,
  COMPARISON_OPERATORS,
  LOGICAL_OPERATORS,
  DATE_FIELDS,
  CertificateFieldKey,
  ComparisonOperator,
  LogicalOperator,
} from "@/lib/certificateFields";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface RequirementRule {
  id?: string;
  field_name: string;
  comparison_operator: ComparisonOperator;
  expected_value: string;
  logical_operator: LogicalOperator;
}

interface RequirementRuleFormProps {
  onSave: (rule: RequirementRule) => void;
  onCancel: () => void;
  existingRule?: RequirementRule;
}

export const RequirementRuleForm = ({
  onSave,
  onCancel,
  existingRule,
}: RequirementRuleFormProps) => {
  const [fieldName, setFieldName] = useState(existingRule?.field_name || "");
  const [comparisonOperator, setComparisonOperator] = useState<ComparisonOperator>(
    existingRule?.comparison_operator || "equal_to"
  );
  const [expectedValue, setExpectedValue] = useState(existingRule?.expected_value || "");
  const [logicalOperator, setLogicalOperator] = useState<LogicalOperator>(
    existingRule?.logical_operator || "and"
  );

  const isDateField = DATE_FIELDS.has(fieldName);
  const isWithinDaysOperator = comparisonOperator === "within_days";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldName || !expectedValue) return;

    onSave({
      id: existingRule?.id,
      field_name: fieldName,
      comparison_operator: comparisonOperator,
      expected_value: expectedValue,
      logical_operator: logicalOperator,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-muted/30">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          {existingRule ? "Edit Validation Rule" : "Add Validation Rule"}
        </h3>
        <Button type="button" variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="field-name">Certificate Field</Label>
          <Select value={fieldName} onValueChange={setFieldName}>
            <SelectTrigger id="field-name" className="bg-background">
              <SelectValue placeholder="Select a field..." />
            </SelectTrigger>
            <SelectContent className="bg-background max-h-[300px]">
              {Object.entries(CERTIFICATE_FIELDS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="comparison-operator">Comparison</Label>
          <Select
            value={comparisonOperator}
            onValueChange={(value) => setComparisonOperator(value as ComparisonOperator)}
          >
            <SelectTrigger id="comparison-operator" className="bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background">
              {Object.entries(COMPARISON_OPERATORS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="expected-value">
            {isWithinDaysOperator ? "Number of Days" : "Expected Value"}
          </Label>
          {isDateField && !isWithinDaysOperator ? (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal bg-background",
                    !expectedValue && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {expectedValue ? format(new Date(expectedValue), "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={expectedValue ? new Date(expectedValue) : undefined}
                  onSelect={(date) => setExpectedValue(date ? date.toISOString() : "")}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          ) : (
            <Input
              id="expected-value"
              type={isWithinDaysOperator ? "number" : "text"}
              placeholder={isWithinDaysOperator ? "Enter number of days (e.g., 30)" : "Enter expected value..."}
              value={expectedValue}
              onChange={(e) => setExpectedValue(e.target.value)}
              className="bg-background"
              min={isWithinDaysOperator ? "1" : undefined}
            />
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="logical-operator">Combine with next rule using</Label>
          <Select
            value={logicalOperator}
            onValueChange={(value) => setLogicalOperator(value as LogicalOperator)}
          >
            <SelectTrigger id="logical-operator" className="bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background">
              {Object.entries(LOGICAL_OPERATORS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!fieldName || !expectedValue}>
          <Plus className="h-4 w-4 mr-2" />
          {existingRule ? "Update Rule" : "Add Rule"}
        </Button>
      </div>
    </form>
  );
};
