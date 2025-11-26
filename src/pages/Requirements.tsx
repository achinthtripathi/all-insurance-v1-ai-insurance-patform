import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit2, Trash2, Save } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const Requirements = () => {
  const { toast } = useToast();
  const [requirementSets, setRequirementSets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newSetName, setNewSetName] = useState("");
  const [newSetDescription, setNewSetDescription] = useState("");

  useEffect(() => {
    loadRequirementSets();
  }, []);

  const loadRequirementSets = async () => {
    try {
      const { data, error } = await supabase
        .from("requirement_sets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequirementSets(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading requirement sets",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createRequirementSet = async () => {
    if (!newSetName.trim()) {
      toast({
        title: "Validation error",
        description: "Requirement set name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("requirement_sets").insert({
        user_id: user.id,
        name: newSetName,
        description: newSetDescription,
      });

      if (error) throw error;

      await supabase.from("audit_logs").insert({
        user_id: user.id,
        action_type: "create",
        entity_type: "requirement_set",
        details: { name: newSetName },
      });

      toast({
        title: "Success",
        description: "Requirement set created successfully",
      });

      setNewSetName("");
      setNewSetDescription("");
      setIsDialogOpen(false);
      loadRequirementSets();
    } catch (error: any) {
      toast({
        title: "Error creating requirement set",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteRequirementSet = async (id: string, name: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("requirement_sets")
        .delete()
        .eq("id", id);

      if (error) throw error;

      await supabase.from("audit_logs").insert({
        user_id: user.id,
        action_type: "delete",
        entity_type: "requirement_set",
        entity_id: id,
        details: { name },
      });

      toast({
        title: "Success",
        description: "Requirement set deleted successfully",
      });

      loadRequirementSets();
    } catch (error: any) {
      toast({
        title: "Error deleting requirement set",
        description: error.message,
        variant: "destructive",
      });
    }
  };

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
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Requirement Set
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Requirement Set</DialogTitle>
              <DialogDescription>
                Define a new set of insurance requirements for certificate validation
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
                />
              </div>
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
            <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
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
                <div className="text-sm text-muted-foreground">
                  Created {new Date(set.created_at).toLocaleDateString()}
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