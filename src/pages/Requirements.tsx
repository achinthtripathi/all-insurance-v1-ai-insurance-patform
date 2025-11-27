import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit2, Trash2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { RequirementRuleRow } from "@/components/RequirementRuleRow";
import { RequirementSet, FieldRule, CERTIFICATE_FIELDS } from "@/types/requirements";

const Requirements = () => {
  const { toast } = useToast();
  const [requirementSets, setRequirementSets] = useState<RequirementSet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newSetName, setNewSetName] = useState("");
  const [newSetDescription, setNewSetDescription] = useState("");
  const [editingRules, setEditingRules] = useState<FieldRule[]>([]);

  useEffect(() => {
    // Load requirement sets from localStorage
    const stored = localStorage.getItem("requirementSets");
    if (stored) {
      setRequirementSets(JSON.parse(stored));
    }
    setIsLoading(false);
  }, []);

  const initializeRules = () => {
    return CERTIFICATE_FIELDS.map(field => ({
      fieldName: field.name,
      fieldLabel: field.label,
      expectedValue: "",
      comparisonOperator: "equals" as const,
      logicalOperator: "and" as const,
      enabled: false,
    }));
  };

  const openCreateDialog = () => {
    setEditingRules(initializeRules());
    setNewSetName("");
    setNewSetDescription("");
    setIsDialogOpen(true);
  };

  const createRequirementSet = () => {
    if (!newSetName.trim()) {
      toast({
        title: "Validation error",
        description: "Requirement set name is required",
        variant: "destructive",
      });
      return;
    }

    const enabledRules = editingRules.filter(rule => rule.enabled);
    if (enabledRules.length === 0) {
      toast({
        title: "Validation error",
        description: "Please enable and configure at least one field rule",
        variant: "destructive",
      });
      return;
    }

    const newSet: RequirementSet = {
      id: crypto.randomUUID(),
      name: newSetName,
      description: newSetDescription,
      rules: editingRules,
      createdAt: new Date().toISOString(),
    };

    const updatedSets = [...requirementSets, newSet];
    setRequirementSets(updatedSets);
    localStorage.setItem("requirementSets", JSON.stringify(updatedSets));

    toast({
      title: "Success",
      description: `Requirement set "${newSetName}" created with ${enabledRules.length} rules`,
    });
    
    setNewSetName("");
    setNewSetDescription("");
    setIsDialogOpen(false);
  };

  const updateRule = (index: number, updatedRule: FieldRule) => {
    const newRules = [...editingRules];
    newRules[index] = updatedRule;
    setEditingRules(newRules);
  };

  const deleteRequirementSet = (id: string, name: string) => {
    const updatedSets = requirementSets.filter(set => set.id !== id);
    setRequirementSets(updatedSets);
    localStorage.setItem("requirementSets", JSON.stringify(updatedSets));
    
    toast({
      title: "Deleted",
      description: `Requirement set "${name}" has been deleted`,
    });
  };

  const groupedFields = CERTIFICATE_FIELDS.reduce((acc, field) => {
    if (!acc[field.category]) {
      acc[field.category] = [];
    }
    acc[field.category].push(field);
    return acc;
  }, {} as Record<string, typeof CERTIFICATE_FIELDS>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Requirements Management</h1>
          <p className="text-muted-foreground">
            Define and manage insurance requirement sets for compliance checking
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={openCreateDialog}>
              <Plus className="h-4 w-4" />
              New Requirement Set
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Create Requirement Set</DialogTitle>
              <DialogDescription>
                Define validation rules for certificate fields. Enable fields you want to validate.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="set-name">Name</Label>
                <Input
                  id="set-name"
                  placeholder="e.g., Standard Commercial Requirements"
                  value={newSetName}
                  onChange={(e) => setNewSetName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="set-description">Description</Label>
                <Textarea
                  id="set-description"
                  placeholder="Describe this requirement set..."
                  value={newSetDescription}
                  onChange={(e) => setNewSetDescription(e.target.value)}
                  rows={2}
                />
              </div>

              <Separator />

              <ScrollArea className="h-[50vh] pr-4">
                <div className="space-y-6">
                  <div className="grid grid-cols-12 gap-3 text-xs font-medium text-muted-foreground mb-2">
                    <div className="col-span-1">Enable</div>
                    <div className="col-span-3">Field</div>
                    <div className="col-span-2">Comparison</div>
                    <div className="col-span-3">Expected Value</div>
                    <div className="col-span-3">Logic (with next)</div>
                  </div>

                  {Object.entries(groupedFields).map(([category, fields]) => (
                    <div key={category}>
                      <h3 className="text-sm font-semibold mb-3 text-foreground">{category}</h3>
                      <div className="space-y-3">
                        {fields.map((field, idx) => {
                          const ruleIndex = editingRules.findIndex(r => r.fieldName === field.name);
                          const isLastInCategory = idx === fields.length - 1;
                          const isLastOverall = category === Object.keys(groupedFields)[Object.keys(groupedFields).length - 1] && isLastInCategory;
                          
                          return (
                            <RequirementRuleRow
                              key={field.name}
                              rule={editingRules[ruleIndex]}
                              onChange={(updated) => updateRule(ruleIndex, updated)}
                              showLogicalOperator={!isLastOverall}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <Separator />

              <Button onClick={createRequirementSet} className="w-full gap-2">
                <Save className="h-4 w-4" />
                Create Requirement Set
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Loading requirement sets...
          </CardContent>
        </Card>
      ) : requirementSets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              No requirement sets yet. Create your first one to get started.
            </p>
            <Button onClick={openCreateDialog} className="gap-2">
              <Plus className="h-4 w-4" />
              Create First Requirement Set
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {requirementSets.map((set) => (
            <Card key={set.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="truncate">{set.name}</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => deleteRequirementSet(set.id, set.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {set.description || "No description"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    {set.rules.filter((r: FieldRule) => r.enabled).length} active rules
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Created {new Date(set.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Requirements;