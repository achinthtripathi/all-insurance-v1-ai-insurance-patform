import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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
      // TODO: Implement with authentication later
      // For now, just show success message
      toast({
        title: "Success",
        description: "Document uploaded successfully (auth disabled for development)",
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

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upload Card */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Certificate</CardTitle>
            <CardDescription>
              Supported formats: PDF, JPG, PNG, WEBP (max 10MB)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12 hover:border-primary transition-colors">
              <Upload className="h-12 w-12 text-muted-foreground mb-4" />
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
        <Card>
          <CardHeader>
            <CardTitle>What Gets Extracted</CardTitle>
            <CardDescription>
              AI-powered parsing extracts key certificate data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
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
    </div>
  );
};

export default Dashboard;