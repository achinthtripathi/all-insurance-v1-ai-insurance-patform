import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, FileText, Calendar, Eye, Pencil, Trash2, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { EditDocumentDialog } from "@/components/EditDocumentDialog";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const TEMP_USER_ID = "00000000-0000-0000-0000-000000000000";

const Documents = () => {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingDocument, setEditingDocument] = useState<any>(null);
  const [deletingDocument, setDeletingDocument] = useState<{ id: string; name: string; url: string } | null>(null);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          extracted_data (*)
        `)
        .eq('user_id', TEMP_USER_ID)
        .order('upload_date', { ascending: false });

      if (error) throw error;

      setDocuments(data || []);
    } catch (error) {
      console.error("Error loading documents:", error);
      toast({
        title: "Error",
        description: "Failed to load documents",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();

    // Set up realtime subscription
    const channel = supabase
      .channel('documents-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
          filter: `user_id=eq.${TEMP_USER_ID}`,
        },
        () => {
          loadDocuments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleDuplicate = async (doc: any) => {
    try {
      // Duplicate document record
      const { data: newDoc, error: docError } = await supabase
        .from('documents')
        .insert({
          user_id: TEMP_USER_ID,
          file_name: `${doc.file_name} (Copy)`,
          file_type: doc.file_type,
          file_url: doc.file_url,
          status: doc.status,
        })
        .select()
        .single();

      if (docError) throw docError;

      // Duplicate extracted data if exists
      if (doc.extracted_data && doc.extracted_data.length > 0) {
        const extractedData = doc.extracted_data[0];
        const { error: extractError } = await supabase
          .from('extracted_data')
          .insert({
            document_id: newDoc.id,
            named_insured: extractedData.named_insured,
            certificate_holder: extractedData.certificate_holder,
            additional_insured: extractedData.additional_insured,
            cancellation_notice_period: extractedData.cancellation_notice_period,
            form_type: extractedData.form_type,
            coverages: extractedData.coverages,
          });

        if (extractError) throw extractError;
      }

      toast({
        title: "Success",
        description: "Document duplicated successfully",
      });

      loadDocuments();
    } catch (error) {
      console.error("Error duplicating document:", error);
      toast({
        title: "Error",
        description: "Failed to duplicate document",
        variant: "destructive",
      });
    }
  };

  const filteredDocuments = documents.filter((doc) =>
    doc.file_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "uploaded":
        return "default";
      case "processing":
        return "secondary";
      case "pending":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Document Repository</h1>
        <p className="text-muted-foreground">
          Browse and search all uploaded insurance certificates
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      {isLoading ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Loading documents...
          </CardContent>
        </Card>
      ) : filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {searchQuery ? "No documents match your search" : "No documents uploaded yet"}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredDocuments.map((doc) => (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="h-8 w-8 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{doc.file_name}</h3>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(doc.upload_date).toLocaleDateString()}
                        </span>
                        <Badge variant={getStatusColor(doc.status) as any}>
                          {doc.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(doc.file_url, '_blank')}
                      className="gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          Actions
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingDocument(doc)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(doc)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeletingDocument({ id: doc.id, name: doc.file_name, url: doc.file_url })}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      {editingDocument && (
        <EditDocumentDialog
          document={editingDocument}
          open={!!editingDocument}
          onOpenChange={(open) => !open && setEditingDocument(null)}
          onSaved={loadDocuments}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deletingDocument && (
        <DeleteConfirmDialog
          documentId={deletingDocument.id}
          documentName={deletingDocument.name}
          fileUrl={deletingDocument.url}
          open={!!deletingDocument}
          onOpenChange={(open) => !open && setDeletingDocument(null)}
          onDeleted={loadDocuments}
        />
      )}
    </div>
  );
};

export default Documents;