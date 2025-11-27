import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldRule, ComparisonOperator, LogicalOperator } from "@/types/requirements";

interface RequirementRuleRowProps {
  rule: FieldRule;
  onChange: (rule: FieldRule) => void;
  showLogicalOperator: boolean;
}

export const RequirementRuleRow = ({ rule, onChange, showLogicalOperator }: RequirementRuleRowProps) => {
  return (
    <div className="grid grid-cols-12 gap-3 items-end border-b border-border pb-3">
      <div className="col-span-1 flex items-center justify-center">
        <Checkbox
          checked={rule.enabled}
          onCheckedChange={(checked) => onChange({ ...rule, enabled: !!checked })}
        />
      </div>
      
      <div className="col-span-3">
        <Label className="text-xs text-muted-foreground">{rule.fieldLabel}</Label>
      </div>
      
      <div className="col-span-2">
        <Select
          value={rule.comparisonOperator}
          onValueChange={(value) => onChange({ ...rule, comparisonOperator: value as ComparisonOperator })}
        >
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="equals">Equals</SelectItem>
            <SelectItem value="not_equals">Not Equals</SelectItem>
            <SelectItem value="greater_than">Greater Than</SelectItem>
            <SelectItem value="less_than">Less Than</SelectItem>
            <SelectItem value="contains">Contains</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="col-span-3">
        <Input
          value={rule.expectedValue}
          onChange={(e) => onChange({ ...rule, expectedValue: e.target.value })}
          placeholder="Expected value"
          className="h-9"
          disabled={!rule.enabled}
        />
      </div>
      
      <div className="col-span-3">
        {showLogicalOperator && (
          <Select
            value={rule.logicalOperator || "and"}
            onValueChange={(value) => onChange({ ...rule, logicalOperator: value as LogicalOperator })}
            disabled={!rule.enabled}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="and">AND</SelectItem>
              <SelectItem value="or">OR</SelectItem>
              <SelectItem value="not">NOT</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
};
