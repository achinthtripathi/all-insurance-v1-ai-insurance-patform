import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, FileText, Calendar, Eye } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Document {
  id: string;
  file_name: string;
  file_type: string;
  upload_date: string;
  status: string;
  file_url: string;
  extracted_data?: {
    named_insured: string;
    certificate_holder: string;
    additional_insured: string;
    form_type: string;
    cancellation_notice_period: string;
  }[];
}

const Documents = () => {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          extracted_data (
            named_insured,
            certificate_holder,
            additional_insured,
            form_type,
            cancellation_notice_period
          )
        `)
        .order('upload_date', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
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

      {/* Documents Table */}
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
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Named Insured</TableHead>
                  <TableHead>Certificate Holder</TableHead>
                  <TableHead>Form Type</TableHead>
                  <TableHead>Upload Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => {
                  const extractedData = doc.extracted_data?.[0];
                  return (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          {doc.file_name}
                        </div>
                      </TableCell>
                      <TableCell>{extractedData?.named_insured || "-"}</TableCell>
                      <TableCell>{extractedData?.certificate_holder || "-"}</TableCell>
                      <TableCell>{extractedData?.form_type || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(doc.upload_date).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(doc.status) as any}>
                          {doc.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => window.open(doc.file_url, '_blank')}
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Documents;