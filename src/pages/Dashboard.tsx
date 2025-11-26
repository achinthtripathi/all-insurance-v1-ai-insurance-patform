import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Loader2, Eye, Calendar } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";

interface UploadedDocument {
  id: string;
  fileName: string;
  fileType: string;
  uploadDate: Date;
  status: string;
  fileUrl: string;
}

const Dashboard = () => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF or image file (JPG, PNG, WEBP)",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 10MB",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      // Create a local URL for the uploaded file (development mode)
      const fileUrl = URL.createObjectURL(selectedFile);
      
      const newDocument: UploadedDocument = {
        id: Date.now().toString(),
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        uploadDate: new Date(),
        status: "processing",
        fileUrl: fileUrl,
      };
      
      // Add to documents list
      setUploadedDocuments(prev => [newDocument, ...prev]);
      
      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });

      setSelectedFile(null);
      
      // Start processing simulation
      setIsProcessing(true);
      toast({
        title: "Processing",
        description: "Extracting certificate data...",
      });
      
      setTimeout(() => {
        setIsProcessing(false);
        
        // Update document status to completed
        setUploadedDocuments(prev => 
          prev.map(doc => 
            doc.id === newDocument.id 
              ? { ...doc, status: "completed" }
              : doc
          )
        );
        
        toast({
          title: "Processing complete",
          description: "Certificate data extracted successfully",
        });
      }, 3000);
      
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Document Upload</h1>
        <p className="text-muted-foreground">
          Upload insurance certificates and covernotes for AI-powered parsing
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upload Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Upload Certificate</CardTitle>
            <CardDescription>
              Supported formats: PDF, JPG, PNG, WEBP (max 10MB)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 hover:border-primary transition-colors">
              <Upload className="h-10 w-10 text-muted-foreground mb-3" />
              <div className="text-center space-y-2">
                <p className="text-sm font-medium">
                  {selectedFile ? selectedFile.name : "Choose a file or drag it here"}
                </p>
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="text-sm text-primary hover:underline">Browse files</span>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept=".pdf,image/jpeg,image/png,image/webp"
                    onChange={handleFileSelect}
                  />
                </label>
              </div>
            </div>
            
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading || isProcessing}
              className="w-full"
            >
              {isUploading || isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isUploading ? "Uploading..." : "Processing..."}
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Upload & Process
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>What Gets Extracted</CardTitle>
            <CardDescription>
              AI-powered parsing extracts key certificate data
            </CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="font-medium">General Information</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Named Insured</li>
                <li>Certificate Holder Name</li>
                <li>Additional Insured</li>
                <li>Cancellation Notice Period</li>
                <li>Form Type</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Coverage Details</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Commercial General Liability</li>
                <li>Automobile Liability</li>
                <li>Non-Owned Trailer Liability</li>
                <li>Policy numbers, limits, dates</li>
                <li>Deductibles and currency</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Uploaded Documents Section */}
      {uploadedDocuments.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Uploaded Documents</h2>
            <Badge variant="secondary">{uploadedDocuments.length} document(s)</Badge>
          </div>
          
          <div className="space-y-3">
            {uploadedDocuments.map((doc) => (
              <Card key={doc.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText className="h-8 w-8 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{doc.fileName}</h3>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {doc.uploadDate.toLocaleDateString()} at {doc.uploadDate.toLocaleTimeString()}
                          </span>
                          <Badge variant={doc.status === "completed" ? "default" : "secondary"}>
                            {doc.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2 flex-shrink-0">
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;