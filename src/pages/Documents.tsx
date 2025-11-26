import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, FileText, Calendar, Eye } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface Document {
  id: string;
  file_name: string;
  file_type: string;
  file_url: string;
  upload_date: string;
  status: string;
  extracted_data?: {
    named_insured: string | null;
    certificate_holder: string | null;
    additional_insured: string | null;
    cancellation_notice_period: string | null;
    form_type: string | null;
    coverages: any;
  };
}

const Documents = () => {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      
      // Fetch documents with extracted data
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          extracted_data (
            named_insured,
            certificate_holder,
            additional_insured,
            cancellation_notice_period,
            form_type,
            coverages
          )
        `)
        .order('upload_date', { ascending: false });

      if (error) throw error;

      // Flatten the extracted_data array (should only be one per document)
      const formattedData = data.map(doc => ({
        ...doc,
        extracted_data: doc.extracted_data?.[0] || null
      }));

      setDocuments(formattedData);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast({
        title: "Error",
        description: "Failed to load documents",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDocuments = documents.filter((doc) =>
    doc.file_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "uploaded":
        return "success";
      case "processing":
        return "warning";
      case "pending":
        return "secondary";
      default:
        return "secondary";
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
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Header with file info and actions */}
                  <div className="flex items-start justify-between">
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
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-2 flex-shrink-0"
                      onClick={() => window.open(doc.file_url, '_blank')}
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                  </div>

                  {/* Extracted Data */}
                  {doc.extracted_data && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <p className="text-xs text-muted-foreground">Named Insured</p>
                        <p className="text-sm font-medium">{doc.extracted_data.named_insured || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Certificate Holder</p>
                        <p className="text-sm font-medium">{doc.extracted_data.certificate_holder || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Form Type</p>
                        <p className="text-sm font-medium">{doc.extracted_data.form_type || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Cancellation Notice Period</p>
                        <p className="text-sm font-medium">{doc.extracted_data.cancellation_notice_period || 'N/A'}</p>
                      </div>
                      {doc.extracted_data.coverages && Array.isArray(doc.extracted_data.coverages) && doc.extracted_data.coverages.length > 0 && (
                        <div className="md:col-span-2">
                          <p className="text-xs text-muted-foreground mb-2">Coverages</p>
                          <div className="space-y-2">
                            {doc.extracted_data.coverages.map((coverage: any, idx: number) => (
                              <div key={idx} className="text-sm bg-muted/50 p-2 rounded">
                                <span className="font-medium">{coverage.type}</span>
                                {coverage.policyNumber && (
                                  <span className="text-muted-foreground ml-2">
                                    • Policy: {coverage.policyNumber}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Documents;