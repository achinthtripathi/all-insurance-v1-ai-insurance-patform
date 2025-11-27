import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, FileText } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CoverageDetail {
  insuranceCompany: string;
  policyNumber: string;
  coverageLimit: string;
  currency: string;
  deductible: string;
  effectiveDate: string;
  expiryDate: string;
  description?: string;
}

interface ExtractedDataRaw {
  named_insured: string | null;
  certificate_holder: string | null;
  additional_insured: string | null;
  cancellation_notice_period: string | null;
  form_type: string | null;
  coverages: any;
}

interface ExtractedData {
  named_insured: string | null;
  certificate_holder: string | null;
  additional_insured: string | null;
  cancellation_notice_period: string | null;
  form_type: string | null;
  coverages: {
    generalLiability: CoverageDetail;
    autoLiability: CoverageDetail;
    trailerLiability: CoverageDetail;
  } | null;
}

interface Document {
  id: string;
  file_name: string;
  upload_date: string;
  status: string;
  file_url: string;
  extracted_data: ExtractedDataRaw[];
}

const Documents = () => {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          extracted_data (*)
        `)
        .order('upload_date', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: "Error",
        description: "Failed to load documents",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    const extractedData = doc.extracted_data?.[0];
    const matchesSearch = 
      doc.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      extractedData?.named_insured?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      extractedData?.certificate_holder?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      extractedData?.coverages?.generalLiability?.policyNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      extractedData?.coverages?.autoLiability?.policyNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      extractedData?.coverages?.trailerLiability?.policyNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Document Repository</h1>
        <p className="text-muted-foreground">
          Browse and search all uploaded insurance certificates
        </p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by file name, insured, holder, or policy number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="uploaded">Uploaded</SelectItem>
              </SelectContent>
            </Select>
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
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchQuery ? "No documents match your search" : "No documents uploaded yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <ScrollArea className="w-full">
            <div className="min-w-max">
              <Table>
                <TableHeader>
                  <TableRow>
                    {/* Document Info */}
                    <TableHead className="sticky left-0 bg-background z-10 min-w-[200px]">File Name</TableHead>
                    <TableHead className="min-w-[120px]">Upload Date</TableHead>
                    <TableHead className="min-w-[100px]">Status</TableHead>
                    
                    {/* General Info */}
                    <TableHead className="min-w-[250px] bg-muted/50">Named Insured</TableHead>
                    <TableHead className="min-w-[200px] bg-muted/50">Certificate Holder</TableHead>
                    <TableHead className="min-w-[200px] bg-muted/50">Additional Insured</TableHead>
                    <TableHead className="min-w-[150px] bg-muted/50">Cancellation Notice</TableHead>
                    <TableHead className="min-w-[200px] bg-muted/50">Form Type</TableHead>
                    
                    {/* General Liability */}
                    <TableHead className="min-w-[180px] bg-primary/5">GL Insurance Company</TableHead>
                    <TableHead className="min-w-[150px] bg-primary/5">GL Policy Number</TableHead>
                    <TableHead className="min-w-[150px] bg-primary/5">GL Coverage Limit</TableHead>
                    <TableHead className="min-w-[100px] bg-primary/5">GL Currency</TableHead>
                    <TableHead className="min-w-[120px] bg-primary/5">GL Deductible</TableHead>
                    <TableHead className="min-w-[130px] bg-primary/5">GL Effective Date</TableHead>
                    <TableHead className="min-w-[130px] bg-primary/5">GL Expiry Date</TableHead>
                    
                    {/* Auto Liability */}
                    <TableHead className="min-w-[180px] bg-secondary/20">Auto Insurance Company</TableHead>
                    <TableHead className="min-w-[150px] bg-secondary/20">Auto Policy Number</TableHead>
                    <TableHead className="min-w-[150px] bg-secondary/20">Auto Coverage Limit</TableHead>
                    <TableHead className="min-w-[100px] bg-secondary/20">Auto Currency</TableHead>
                    <TableHead className="min-w-[120px] bg-secondary/20">Auto Deductible</TableHead>
                    <TableHead className="min-w-[130px] bg-secondary/20">Auto Effective Date</TableHead>
                    <TableHead className="min-w-[130px] bg-secondary/20">Auto Expiry Date</TableHead>
                    
                    {/* Trailer Liability */}
                    <TableHead className="min-w-[180px] bg-accent/20">Trailer Insurance Company</TableHead>
                    <TableHead className="min-w-[150px] bg-accent/20">Trailer Policy Number</TableHead>
                    <TableHead className="min-w-[150px] bg-accent/20">Trailer Coverage Limit</TableHead>
                    <TableHead className="min-w-[100px] bg-accent/20">Trailer Currency</TableHead>
                    <TableHead className="min-w-[120px] bg-accent/20">Trailer Deductible</TableHead>
                    <TableHead className="min-w-[130px] bg-accent/20">Trailer Effective Date</TableHead>
                    <TableHead className="min-w-[130px] bg-accent/20">Trailer Expiry Date</TableHead>
                    <TableHead className="min-w-[200px] bg-accent/20">Trailer Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((doc) => {
                    const extracted = doc.extracted_data?.[0];
                    const gl = extracted?.coverages?.generalLiability;
                    const auto = extracted?.coverages?.autoLiability;
                    const trailer = extracted?.coverages?.trailerLiability;
                    
                    return (
                      <TableRow key={doc.id}>
                        {/* Document Info */}
                        <TableCell className="sticky left-0 bg-background font-medium">{doc.file_name}</TableCell>
                        <TableCell>{new Date(doc.upload_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            doc.status === 'uploaded' ? 'bg-green-100 text-green-800' :
                            doc.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {doc.status}
                          </span>
                        </TableCell>
                        
                        {/* General Info */}
                        <TableCell className="bg-muted/50">{extracted?.named_insured || '-'}</TableCell>
                        <TableCell className="bg-muted/50">{extracted?.certificate_holder || '-'}</TableCell>
                        <TableCell className="bg-muted/50">{extracted?.additional_insured || '-'}</TableCell>
                        <TableCell className="bg-muted/50">{extracted?.cancellation_notice_period || '-'}</TableCell>
                        <TableCell className="bg-muted/50">{extracted?.form_type || '-'}</TableCell>
                        
                        {/* General Liability */}
                        <TableCell className="bg-primary/5">{gl?.insuranceCompany || '-'}</TableCell>
                        <TableCell className="bg-primary/5">{gl?.policyNumber || '-'}</TableCell>
                        <TableCell className="bg-primary/5">{gl?.coverageLimit || '-'}</TableCell>
                        <TableCell className="bg-primary/5">{gl?.currency || '-'}</TableCell>
                        <TableCell className="bg-primary/5">{gl?.deductible || '-'}</TableCell>
                        <TableCell className="bg-primary/5">{gl?.effectiveDate || '-'}</TableCell>
                        <TableCell className="bg-primary/5">{gl?.expiryDate || '-'}</TableCell>
                        
                        {/* Auto Liability */}
                        <TableCell className="bg-secondary/20">{auto?.insuranceCompany || '-'}</TableCell>
                        <TableCell className="bg-secondary/20">{auto?.policyNumber || '-'}</TableCell>
                        <TableCell className="bg-secondary/20">{auto?.coverageLimit || '-'}</TableCell>
                        <TableCell className="bg-secondary/20">{auto?.currency || '-'}</TableCell>
                        <TableCell className="bg-secondary/20">{auto?.deductible || '-'}</TableCell>
                        <TableCell className="bg-secondary/20">{auto?.effectiveDate || '-'}</TableCell>
                        <TableCell className="bg-secondary/20">{auto?.expiryDate || '-'}</TableCell>
                        
                        {/* Trailer Liability */}
                        <TableCell className="bg-accent/20">{trailer?.insuranceCompany || '-'}</TableCell>
                        <TableCell className="bg-accent/20">{trailer?.policyNumber || '-'}</TableCell>
                        <TableCell className="bg-accent/20">{trailer?.coverageLimit || '-'}</TableCell>
                        <TableCell className="bg-accent/20">{trailer?.currency || '-'}</TableCell>
                        <TableCell className="bg-accent/20">{trailer?.deductible || '-'}</TableCell>
                        <TableCell className="bg-accent/20">{trailer?.effectiveDate || '-'}</TableCell>
                        <TableCell className="bg-accent/20">{trailer?.expiryDate || '-'}</TableCell>
                        <TableCell className="bg-accent/20">{trailer?.description || '-'}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </Card>
      )}
    </div>
  );
};

export default Documents;
