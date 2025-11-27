import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Edit2, Trash2, Plus, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { RequirementRuleForm } from "./RequirementRuleForm";
import {
  CERTIFICATE_FIELDS,
  COMPARISON_OPERATORS,
  ComparisonOperator,
  LogicalOperator,
} from "@/lib/certificateFields";

interface RequirementSet {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

interface RequirementRule {
  id: string;
  requirement_set_id: string;
  field_name: string;
  comparison_operator: ComparisonOperator;
  expected_value: string;
  logical_operator: LogicalOperator;
}

interface RequirementSetEditorProps {
  requirementSetId: string;
  onBack: () => void;
}

export const RequirementSetEditor = ({
  requirementSetId,
  onBack,
}: RequirementSetEditorProps) => {
  const { toast } = useToast();
  const [requirementSet, setRequirementSet] = useState<RequirementSet | null>(null);
  const [rules, setRules] = useState<RequirementRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRule, setEditingRule] = useState<RequirementRule | null>(null);

  useEffect(() => {
    loadRequirementSetAndRules();
  }, [requirementSetId]);

  const loadRequirementSetAndRules = async () => {
    setIsLoading(true);
    try {
      // Load requirement set
      const { data: setData, error: setError } = await supabase
        .from("requirement_sets")
        .select("*")
        .eq("id", requirementSetId)
        .single();

      if (setError) throw setError;
      setRequirementSet(setData);
      setEditedName(setData.name);
      setEditedDescription(setData.description || "");

      // Load rules
      const { data: rulesData, error: rulesError } = await supabase
        .from("requirements")
        .select("*")
        .eq("requirement_set_id", requirementSetId)
        .order("created_at", { ascending: true });

      if (rulesError) throw rulesError;
      setRules(rulesData || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSetDetails = async () => {
    try {
      const { error } = await supabase
        .from("requirement_sets")
        .update({
          name: editedName,
          description: editedDescription,
        })
        .eq("id", requirementSetId);

      if (error) throw error;

      setRequirementSet((prev) =>
        prev ? { ...prev, name: editedName, description: editedDescription } : null
      );
      setIsEditing(false);

      toast({
        title: "Success",
        description: "Requirement set updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSaveRule = async (rule: any) => {
    try {
      if (rule.id) {
        // Update existing rule
        const { error } = await supabase
          .from("requirements")
          .update({
            field_name: rule.field_name,
            comparison_operator: rule.comparison_operator,
            expected_value: rule.expected_value,
            logical_operator: rule.logical_operator,
          })
          .eq("id", rule.id);

        if (error) throw error;
      } else {
        // Create new rule
        const { error } = await supabase.from("requirements").insert({
          requirement_set_id: requirementSetId,
          field_name: rule.field_name,
          comparison_operator: rule.comparison_operator,
          expected_value: rule.expected_value,
          logical_operator: rule.logical_operator,
          coverage_type: "general", // placeholder for compatibility
        });

        if (error) throw error;
      }

      await loadRequirementSetAndRules();
      setShowAddForm(false);
      setEditingRule(null);

      toast({
        title: "Success",
        description: rule.id ? "Rule updated successfully" : "Rule added successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      const { error } = await supabase.from("requirements").delete().eq("id", ruleId);

      if (error) throw error;

      setRules((prev) => prev.filter((r) => r.id !== ruleId));

      toast({
        title: "Success",
        description: "Rule deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Loading requirement set...
        </CardContent>
      </Card>
    );
  }

  if (!requirementSet) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground mb-4">Requirement set not found</p>
          <Button onClick={onBack}>Go Back</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to Requirements
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="set-name">Name</Label>
                    <Input
                      id="set-name"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="set-description">Description</Label>
                    <Textarea
                      id="set-description"
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveSetDetails} size="sm" className="gap-2">
                      <Save className="h-4 w-4" />
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setEditedName(requirementSet.name);
                        setEditedDescription(requirementSet.description || "");
                      }}
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <CardTitle className="flex items-center gap-2">
                    {requirementSet.name}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    {requirementSet.description || "No description"}
                  </CardDescription>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Validation Rules ({rules.length})</h3>
              {!showAddForm && !editingRule && (
                <Button onClick={() => setShowAddForm(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Rule
                </Button>
              )}
            </div>

            {showAddForm && (
              <RequirementRuleForm
                onSave={handleSaveRule}
                onCancel={() => setShowAddForm(false)}
              />
            )}

            {editingRule && (
              <RequirementRuleForm
                onSave={handleSaveRule}
                onCancel={() => setEditingRule(null)}
                existingRule={editingRule}
              />
            )}

            {rules.length === 0 && !showAddForm ? (
              <div className="text-center py-8 text-muted-foreground">
                No validation rules yet. Add your first rule to start validating certificates.
              </div>
            ) : (
              <div className="space-y-2">
                {rules.map((rule, index) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          {CERTIFICATE_FIELDS[rule.field_name as keyof typeof CERTIFICATE_FIELDS] ||
                            rule.field_name}
                        </span>
                        <span className="text-muted-foreground">
                          {COMPARISON_OPERATORS[
                            rule.comparison_operator as keyof typeof COMPARISON_OPERATORS
                          ] || rule.comparison_operator}
                        </span>
                        <span className="font-mono text-sm">{rule.expected_value}</span>
                      </div>
                      {index < rules.length - 1 && (
                        <span className="text-xs text-muted-foreground uppercase">
                          {rule.logical_operator}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setEditingRule(rule)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDeleteRule(rule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
