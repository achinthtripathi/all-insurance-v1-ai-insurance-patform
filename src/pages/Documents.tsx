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
import { logAuditEvent } from "@/lib/auditLog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Documents = () => {
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingDocument, setEditingDocument] = useState<any>(null);
  const [deletingDocument, setDeletingDocument] = useState<{ id: string; name: string; url: string } | null>(null);

  // Get user ID on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });
  }, []);

  const loadDocuments = async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          extracted_data (*)
        `)
        .eq('user_id', userId)
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
    if (userId) {
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
            filter: `user_id=eq.${userId}`,
          },
          () => {
            loadDocuments();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [userId]);

  const handleDuplicate = async (doc: any) => {
    if (!userId) return;
    
    try {
      // Duplicate document record
      const { data: newDoc, error: docError } = await supabase
        .from('documents')
        .insert({
          user_id: userId,
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

      // Log audit event for document duplication
      logAuditEvent('duplicate', 'document', newDoc.id, {
        original_id: doc.id,
        original_name: doc.file_name,
        new_name: newDoc.file_name,
      });
      
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

  const handleOpenDocument = (doc: any) => {
    if (doc.file_url) {
      // Log audit event for document view
      logAuditEvent('view', 'document', doc.id, {
        file_name: doc.file_name,
      });
      
      window.open(doc.file_url, "_blank");
    }
  };

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
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-3 py-2 text-left font-medium">File Name</th>
                <th className="px-3 py-2 text-left font-medium">Upload Date</th>
                <th className="px-3 py-2 text-left font-medium">Status</th>
                <th className="px-3 py-2 text-left font-medium">Named Insured</th>
                <th className="px-3 py-2 text-left font-medium">Certificate Holder</th>
                <th className="px-3 py-2 text-left font-medium">Additional Insured</th>
                <th className="px-3 py-2 text-left font-medium">Cancellation Notice</th>
                <th className="px-3 py-2 text-left font-medium">Form Type</th>
                {/* General Liability */}
                <th className="px-3 py-2 text-left font-medium">GL Company</th>
                <th className="px-3 py-2 text-left font-medium">GL Policy #</th>
                <th className="px-3 py-2 text-left font-medium">GL Limit</th>
                <th className="px-3 py-2 text-left font-medium">GL Currency</th>
                <th className="px-3 py-2 text-left font-medium">GL Deductible</th>
                <th className="px-3 py-2 text-left font-medium">GL Effective</th>
                <th className="px-3 py-2 text-left font-medium">GL Expiry</th>
                {/* Auto Liability */}
                <th className="px-3 py-2 text-left font-medium">Auto Company</th>
                <th className="px-3 py-2 text-left font-medium">Auto Policy #</th>
                <th className="px-3 py-2 text-left font-medium">Auto Limit</th>
                <th className="px-3 py-2 text-left font-medium">Auto Currency</th>
                <th className="px-3 py-2 text-left font-medium">Auto Deductible</th>
                <th className="px-3 py-2 text-left font-medium">Auto Effective</th>
                <th className="px-3 py-2 text-left font-medium">Auto Expiry</th>
                {/* Trailer Liability */}
                <th className="px-3 py-2 text-left font-medium">Trailer Company</th>
                <th className="px-3 py-2 text-left font-medium">Trailer Policy #</th>
                <th className="px-3 py-2 text-left font-medium">Trailer Limit</th>
                <th className="px-3 py-2 text-left font-medium">Trailer Currency</th>
                <th className="px-3 py-2 text-left font-medium">Trailer Deductible</th>
                <th className="px-3 py-2 text-left font-medium">Trailer Effective</th>
                <th className="px-3 py-2 text-left font-medium">Trailer Expiry</th>
                <th className="px-3 py-2 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocuments.map((doc) => {
                const extracted = doc.extracted_data?.[0];
                const coverages = extracted?.coverages || {};
                const gl = coverages.generalLiability || {};
                const auto = coverages.automobileLiability || {};
                const trailer = coverages.nonOwnedTrailer || {};

                return (
                  <tr
                    key={doc.id}
                    className="border-b hover:bg-muted/40 cursor-pointer"
                    onClick={() => handleOpenDocument(doc)}
                  >
                    <td className="px-3 py-2 max-w-xs truncate">{doc.file_name}</td>
                    <td className="px-3 py-2">
                      {doc.upload_date ? new Date(doc.upload_date).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant={getStatusColor(doc.status) as any}>{doc.status}</Badge>
                    </td>
                    <td className="px-3 py-2 max-w-xs truncate">{extracted?.named_insured || "-"}</td>
                    <td className="px-3 py-2 max-w-xs truncate">{extracted?.certificate_holder || "-"}</td>
                    <td className="px-3 py-2 max-w-xs truncate">{extracted?.additional_insured || "-"}</td>
                    <td className="px-3 py-2 max-w-xs truncate">{extracted?.cancellation_notice_period || "-"}</td>
                    <td className="px-3 py-2 max-w-xs truncate">{extracted?.form_type || "-"}</td>
                    {/* GL */}
                    <td className="px-3 py-2 max-w-xs truncate">{gl.insuranceCompany || "-"}</td>
                    <td className="px-3 py-2 max-w-xs truncate">{gl.policyNumber || "-"}</td>
                    <td className="px-3 py-2 max-w-xs truncate">{gl.coverageLimit || "-"}</td>
                    <td className="px-3 py-2 max-w-xs truncate">{gl.currency || "-"}</td>
                    <td className="px-3 py-2 max-w-xs truncate">{gl.deductible || "-"}</td>
                    <td className="px-3 py-2 max-w-xs truncate">{gl.effectiveDate || "-"}</td>
                    <td className="px-3 py-2 max-w-xs truncate">{gl.expiryDate || "-"}</td>
                    {/* Auto */}
                    <td className="px-3 py-2 max-w-xs truncate">{auto.insuranceCompany || "-"}</td>
                    <td className="px-3 py-2 max-w-xs truncate">{auto.policyNumber || "-"}</td>
                    <td className="px-3 py-2 max-w-xs truncate">{auto.coverageLimit || "-"}</td>
                    <td className="px-3 py-2 max-w-xs truncate">{auto.currency || "-"}</td>
                    <td className="px-3 py-2 max-w-xs truncate">{auto.deductible || "-"}</td>
                    <td className="px-3 py-2 max-w-xs truncate">{auto.effectiveDate || "-"}</td>
                    <td className="px-3 py-2 max-w-xs truncate">{auto.expiryDate || "-"}</td>
                    {/* Trailer */}
                    <td className="px-3 py-2 max-w-xs truncate">{trailer.insuranceCompany || "-"}</td>
                    <td className="px-3 py-2 max-w-xs truncate">{trailer.policyNumber || "-"}</td>
                    <td className="px-3 py-2 max-w-xs truncate">{trailer.coverageLimit || "-"}</td>
                    <td className="px-3 py-2 max-w-xs truncate">{trailer.currency || "-"}</td>
                    <td className="px-3 py-2 max-w-xs truncate">{trailer.deductible || "-"}</td>
                    <td className="px-3 py-2 max-w-xs truncate">{trailer.effectiveDate || "-"}</td>
                    <td className="px-3 py-2 max-w-xs truncate">{trailer.expiryDate || "-"}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDocument(doc)}
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
                              onClick={() =>
                                setDeletingDocument({ id: doc.id, name: doc.file_name, url: doc.file_url })
                              }
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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