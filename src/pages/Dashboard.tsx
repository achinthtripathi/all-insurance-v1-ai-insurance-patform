import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Loader2, Eye, Calendar, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import PDFViewer from "@/components/PDFViewer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { validateExtractedData, ValidationResult } from "@/lib/requirementValidation";
import { ValidationStatusBadge } from "@/components/ValidationStatusBadge";
import { CERTIFICATE_FIELDS } from "@/lib/certificateFields";

interface UploadedDocument {
  id: string;
  fileName: string;
  fileType: string;
  uploadDate: Date;
  status: string;
  fileUrl: string;
}

interface ExtractedData {
  namedInsured: string;
  certificateHolder: string;
  additionalInsured: string;
  cancellationNotice: string;
  formType: string;
  coverages: {
    generalLiability: CoverageDetail;
    autoLiability: CoverageDetail;
    trailerLiability: CoverageDetail;
  };
}

interface CoverageDetail {
  insuranceCompany: string;
  policyNumber: string;
  coverageLimit: string;
  currency: string;
  deductible: string;
  effectiveDate: string;
  expiryDate: string;
}

const Dashboard = () => {
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [imageZoom, setImageZoom] = useState(100);
  const [processedFileType, setProcessedFileType] = useState<string | null>(null);
  const [requirementSets, setRequirementSets] = useState<any[]>([]);
  const [selectedRequirementSetId, setSelectedRequirementSetId] = useState<string>("");
  const [requirementRules, setRequirementRules] = useState<any[]>([]);
  const [validationResults, setValidationResults] = useState<Map<string, ValidationResult>>(new Map());
  const [extractedData, setExtractedData] = useState<ExtractedData>({
    namedInsured: "",
    certificateHolder: "",
    additionalInsured: "",
    cancellationNotice: "",
    formType: "",
    coverages: {
      generalLiability: {
        insuranceCompany: "",
        policyNumber: "",
        coverageLimit: "",
        currency: "USD",
        deductible: "",
        effectiveDate: "",
        expiryDate: "",
      },
      autoLiability: {
        insuranceCompany: "",
        policyNumber: "",
        coverageLimit: "",
        currency: "USD",
        deductible: "",
        effectiveDate: "",
        expiryDate: "",
      },
      trailerLiability: {
        insuranceCompany: "",
        policyNumber: "",
        coverageLimit: "",
        currency: "USD",
        deductible: "",
        effectiveDate: "",
        expiryDate: "",
      },
    },
  });

  // Get user ID on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
  }, []);

  // Load requirement sets on mount
  useEffect(() => {
    if (userId) {
      loadRequirementSets();
    }
  }, [userId]);

  // Load rules when requirement set is selected
  useEffect(() => {
    if (selectedRequirementSetId) {
      loadRequirementRules(selectedRequirementSetId);
    } else {
      setRequirementRules([]);
      setValidationResults(new Map());
    }
  }, [selectedRequirementSetId]);

  // Validate extracted data when rules or data change
  useEffect(() => {
    if (requirementRules.length > 0 && extractedData.namedInsured) {
      const results = validateExtractedData(extractedData, requirementRules);
      setValidationResults(results);
    }
  }, [requirementRules, extractedData]);

  const loadRequirementSets = async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from("requirement_sets")
        .select("id, name, description")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequirementSets(data || []);
    } catch (error: any) {
      console.error("Error loading requirement sets:", error);
    }
  };

  const loadRequirementRules = async (requirementSetId: string) => {
    try {
      const { data, error } = await supabase
        .from("requirements")
        .select("*")
        .eq("requirement_set_id", requirementSetId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setRequirementRules(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading requirements",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getValidationStatus = (fieldName: string): ValidationResult | undefined => {
    return validationResults.get(fieldName);
  };

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
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setSelectedFile(file);
      setFilePreviewUrl(previewUrl);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !userId) return;

    setIsUploading(true);
    try {
      // 1. Upload file to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}_${selectedFile.name}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      // 2. Insert document record to database
      const { data: docData, error: docError } = await supabase
        .from('documents')
        .insert({
          user_id: userId,
          file_name: selectedFile.name,
          file_type: selectedFile.type,
          file_url: urlData.publicUrl,
          status: 'processing',
        })
        .select()
        .single();

      if (docError) throw docError;
      
      const newDocument: UploadedDocument = {
        id: docData.id,
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        uploadDate: new Date(),
        status: "processing",
        fileUrl: urlData.publicUrl,
      };
      
      // Add to documents list
      setUploadedDocuments(prev => [newDocument, ...prev]);
      
      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });

      // Store file type for preview after processing
      setProcessedFileType(selectedFile.type);
      
      // Start processing simulation
      setIsProcessing(true);
      toast({
        title: "Processing",
        description: "Extracting certificate data...",
      });
      
      setTimeout(async () => {
        // Simulate extracted data
        const simulatedData: ExtractedData = {
          namedInsured: "EDM Express Inc.\n9623 25 Ave NW, Edmonton, AB, T6N 1H7",
          certificateHolder: "EDM Trailer Rentals,\n9623 25 Ave, Edmonton, AB",
          additionalInsured: "EDM Trailer Rentals,\n9623 25 Ave, Edmonton, AB",
          cancellationNotice: "30 days written notice",
          formType: "CSIO C0910ECL - CERTIFICATE OF LIABILITY INSURANCE - 2010/09",
          coverages: {
            generalLiability: {
              insuranceCompany: "Intact Insurance Co.",
              policyNumber: "654321",
              coverageLimit: "2,000,000",
              currency: "CAD",
              deductible: "0",
              effectiveDate: "2025-11-24",
              expiryDate: "2026-11-24",
            },
            autoLiability: {
              insuranceCompany: "Intact Insurance Co.",
              policyNumber: "123456",
              coverageLimit: "2,000,000",
              currency: "CAD",
              deductible: "0",
              effectiveDate: "2025-11-24",
              expiryDate: "2026-11-24",
            },
            trailerLiability: {
              insuranceCompany: "Intact Insurance Co.",
              policyNumber: "123456",
              coverageLimit: "85,000",
              currency: "CAD",
              deductible: "5,000",
              effectiveDate: "2025-11-24",
              expiryDate: "2026-11-24",
            },
          },
        };

        setExtractedData(simulatedData);

        // 3. Save extracted data to database
        const { error: extractError } = await supabase
          .from('extracted_data')
          .insert({
            document_id: docData.id,
            named_insured: simulatedData.namedInsured,
            certificate_holder: simulatedData.certificateHolder,
            additional_insured: simulatedData.additionalInsured,
            cancellation_notice_period: simulatedData.cancellationNotice,
            form_type: simulatedData.formType,
            coverages: {
              generalLiability: simulatedData.coverages.generalLiability,
              automobileLiability: simulatedData.coverages.autoLiability,
              nonOwnedTrailer: simulatedData.coverages.trailerLiability,
            } as any,
          });

        if (extractError) {
          console.error("Error saving extracted data:", extractError);
          toast({
            title: "Warning",
            description: "Document uploaded but extraction data failed to save",
            variant: "destructive",
          });
        }

        // 4. Update document status to completed
        const { error: updateError } = await supabase
          .from('documents')
          .update({ status: 'completed' })
          .eq('id', docData.id);

        if (updateError) {
          console.error("Error updating document status:", updateError);
        }

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
          description: "Certificate data extracted and saved to database",
        });
      }, 3000);
      
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadNew = () => {
    setSelectedFile(null);
    setFilePreviewUrl(null);
    setProcessedFileType(null);
    setImageZoom(100);
    // Reset extracted data to empty state
    setExtractedData({
      namedInsured: "",
      certificateHolder: "",
      additionalInsured: "",
      cancellationNotice: "",
      formType: "",
      coverages: {
        generalLiability: {
          insuranceCompany: "",
          policyNumber: "",
          coverageLimit: "",
          currency: "USD",
          deductible: "",
          effectiveDate: "",
          expiryDate: "",
        },
        autoLiability: {
          insuranceCompany: "",
          policyNumber: "",
          coverageLimit: "",
          currency: "USD",
          deductible: "",
          effectiveDate: "",
          expiryDate: "",
        },
        trailerLiability: {
          insuranceCompany: "",
          policyNumber: "",
          coverageLimit: "",
          currency: "USD",
          deductible: "",
          effectiveDate: "",
          expiryDate: "",
        },
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Document Upload</h1>
        <p className="text-muted-foreground">
          Upload insurance certificates and covernotes for AI-powered parsing
        </p>
      </div>

      {/* Requirement Set Selection */}
      {requirementSets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Requirement Set</CardTitle>
            <CardDescription>
              Select a requirement set to validate extracted data against defined rules
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedRequirementSetId} onValueChange={setSelectedRequirementSetId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a requirement set..." />
              </SelectTrigger>
              <SelectContent>
                {requirementSets.map((set) => (
                  <SelectItem key={set.id} value={set.id}>
                    {set.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedRequirementSetId && requirementRules.length > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                {requirementRules.length} validation rule{requirementRules.length !== 1 ? "s" : ""} active
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upload & Preview Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Upload Certificate</CardTitle>
            <CardDescription>
              Supported formats: PDF, JPG, PNG, WEBP (max 10MB)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!filePreviewUrl ? (
              <>
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
              </>
            ) : (
              <>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">
                      {selectedFile?.name || uploadedDocuments[0]?.fileName}
                    </p>
                  </div>
                  
                  <div className="border rounded-lg overflow-hidden bg-muted">
                    {(selectedFile?.type || processedFileType) === "application/pdf" ? (
                      filePreviewUrl && <PDFViewer fileUrl={filePreviewUrl} />
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-end gap-2 p-2 bg-background/50">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setImageZoom(Math.max(50, imageZoom - 25))}
                            disabled={imageZoom <= 50}
                          >
                            <ZoomOut className="h-4 w-4" />
                          </Button>
                          <span className="text-xs text-muted-foreground min-w-[3rem] text-center">
                            {imageZoom}%
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setImageZoom(Math.min(200, imageZoom + 25))}
                            disabled={imageZoom >= 200}
                          >
                            <ZoomIn className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setImageZoom(100)}
                          >
                            <Maximize2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="overflow-auto max-h-[500px]">
                          <img
                            src={filePreviewUrl || ""}
                            alt="Certificate preview"
                            style={{ width: `${imageZoom}%` }}
                            className="mx-auto"
                            onError={(e) => {
                              e.currentTarget.alt = "Certificate preview unavailable";
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
            
            {uploadedDocuments.length === 0 || !processedFileType ? (
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
            ) : (
              <Button
                onClick={handleUploadNew}
                variant="outline"
                className="w-full"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload New Certificate
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Extracted Data Form Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Extracted Certificate Data</CardTitle>
            <CardDescription>
              Review and edit extracted fields
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* General Information Section */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">General Information</h4>
              
              <div className="space-y-2">
                <Label htmlFor="namedInsured" className="flex items-center gap-2">
                  Named Insured
                  {selectedRequirementSetId && getValidationStatus("named_insured") && (
                    <ValidationStatusBadge status={getValidationStatus("named_insured")!.status} />
                  )}
                </Label>
                <Input
                  id="namedInsured"
                  value={extractedData.namedInsured}
                  onChange={(e) => setExtractedData({ ...extractedData, namedInsured: e.target.value })}
                  placeholder="Enter named insured"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="certificateHolder" className="flex items-center gap-2">
                  Certificate Holder
                  {selectedRequirementSetId && getValidationStatus("certificate_holder") && (
                    <ValidationStatusBadge status={getValidationStatus("certificate_holder")!.status} />
                  )}
                </Label>
                <Input
                  id="certificateHolder"
                  value={extractedData.certificateHolder}
                  onChange={(e) => setExtractedData({ ...extractedData, certificateHolder: e.target.value })}
                  placeholder="Enter certificate holder"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="additionalInsured" className="flex items-center gap-2">
                  Additional Insured
                  {selectedRequirementSetId && getValidationStatus("additional_insured") && (
                    <ValidationStatusBadge status={getValidationStatus("additional_insured")!.status} />
                  )}
                </Label>
                <Input
                  id="additionalInsured"
                  value={extractedData.additionalInsured}
                  onChange={(e) => setExtractedData({ ...extractedData, additionalInsured: e.target.value })}
                  placeholder="Enter additional insured"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cancellationNotice" className="flex items-center gap-2">
                    Cancellation Notice
                    {selectedRequirementSetId && getValidationStatus("cancellation_notice_period") && (
                      <ValidationStatusBadge status={getValidationStatus("cancellation_notice_period")!.status} />
                    )}
                  </Label>
                  <Input
                    id="cancellationNotice"
                    value={extractedData.cancellationNotice}
                    onChange={(e) => setExtractedData({ ...extractedData, cancellationNotice: e.target.value })}
                    placeholder="e.g., 30 days"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="formType" className="flex items-center gap-2">
                    Form Type
                    {selectedRequirementSetId && getValidationStatus("form_type") && (
                      <ValidationStatusBadge status={getValidationStatus("form_type")!.status} />
                    )}
                  </Label>
                  <Input
                    id="formType"
                    value={extractedData.formType}
                    onChange={(e) => setExtractedData({ ...extractedData, formType: e.target.value })}
                    placeholder="e.g., ACORD 25"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Coverages Section */}
            <div className="space-y-6">
              <h4 className="font-semibold text-sm">Coverage Details</h4>
              
              {/* Commercial General Liability */}
              <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                <h5 className="font-medium text-sm">Commercial General Liability</h5>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs flex items-center gap-2">
                      Insurance Company
                      {selectedRequirementSetId && getValidationStatus("gl_company_name") && (
                        <ValidationStatusBadge status={getValidationStatus("gl_company_name")!.status} />
                      )}
                    </Label>
                    <Input
                      value={extractedData.coverages.generalLiability.insuranceCompany}
                      onChange={(e) => setExtractedData({
                        ...extractedData,
                        coverages: {
                          ...extractedData.coverages,
                          generalLiability: { ...extractedData.coverages.generalLiability, insuranceCompany: e.target.value }
                        }
                      })}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs flex items-center gap-2">
                      Policy Number
                      {selectedRequirementSetId && getValidationStatus("gl_policy_number") && (
                        <ValidationStatusBadge status={getValidationStatus("gl_policy_number")!.status} />
                      )}
                    </Label>
                    <Input
                      value={extractedData.coverages.generalLiability.policyNumber}
                      onChange={(e) => setExtractedData({
                        ...extractedData,
                        coverages: {
                          ...extractedData.coverages,
                          generalLiability: { ...extractedData.coverages.generalLiability, policyNumber: e.target.value }
                        }
                      })}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs flex items-center gap-2">
                      Coverage Limit
                      {selectedRequirementSetId && getValidationStatus("gl_coverage_limits") && (
                        <ValidationStatusBadge status={getValidationStatus("gl_coverage_limits")!.status} />
                      )}
                    </Label>
                    <Input
                      value={extractedData.coverages.generalLiability.coverageLimit}
                      onChange={(e) => setExtractedData({
                        ...extractedData,
                        coverages: {
                          ...extractedData.coverages,
                          generalLiability: { ...extractedData.coverages.generalLiability, coverageLimit: e.target.value }
                        }
                      })}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs flex items-center gap-2">
                      Deductible
                      {selectedRequirementSetId && getValidationStatus("gl_deductible") && (
                        <ValidationStatusBadge status={getValidationStatus("gl_deductible")!.status} />
                      )}
                    </Label>
                    <Input
                      value={extractedData.coverages.generalLiability.deductible}
                      onChange={(e) => setExtractedData({
                        ...extractedData,
                        coverages: {
                          ...extractedData.coverages,
                          generalLiability: { ...extractedData.coverages.generalLiability, deductible: e.target.value }
                        }
                      })}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs flex items-center gap-2">
                      Effective Date
                      {selectedRequirementSetId && getValidationStatus("gl_effective_date") && (
                        <ValidationStatusBadge status={getValidationStatus("gl_effective_date")!.status} />
                      )}
                    </Label>
                    <Input
                      type="date"
                      value={extractedData.coverages.generalLiability.effectiveDate}
                      onChange={(e) => setExtractedData({
                        ...extractedData,
                        coverages: {
                          ...extractedData.coverages,
                          generalLiability: { ...extractedData.coverages.generalLiability, effectiveDate: e.target.value }
                        }
                      })}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs flex items-center gap-2">
                      Expiry Date
                      {selectedRequirementSetId && getValidationStatus("gl_expiry_date") && (
                        <ValidationStatusBadge status={getValidationStatus("gl_expiry_date")!.status} />
                      )}
                    </Label>
                    <Input
                      type="date"
                      value={extractedData.coverages.generalLiability.expiryDate}
                      onChange={(e) => setExtractedData({
                        ...extractedData,
                        coverages: {
                          ...extractedData.coverages,
                          generalLiability: { ...extractedData.coverages.generalLiability, expiryDate: e.target.value }
                        }
                      })}
                      className="h-9"
                    />
                  </div>
                </div>
              </div>

              {/* Automobile Liability */}
              <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                <h5 className="font-medium text-sm">Automobile Liability</h5>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs flex items-center gap-2">
                      Insurance Company
                      {selectedRequirementSetId && getValidationStatus("auto_company_name") && (
                        <ValidationStatusBadge status={getValidationStatus("auto_company_name")!.status} />
                      )}
                    </Label>
                    <Input
                      value={extractedData.coverages.autoLiability.insuranceCompany}
                      onChange={(e) => setExtractedData({
                        ...extractedData,
                        coverages: {
                          ...extractedData.coverages,
                          autoLiability: { ...extractedData.coverages.autoLiability, insuranceCompany: e.target.value }
                        }
                      })}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs flex items-center gap-2">
                      Policy Number
                      {selectedRequirementSetId && getValidationStatus("auto_policy_number") && (
                        <ValidationStatusBadge status={getValidationStatus("auto_policy_number")!.status} />
                      )}
                    </Label>
                    <Input
                      value={extractedData.coverages.autoLiability.policyNumber}
                      onChange={(e) => setExtractedData({
                        ...extractedData,
                        coverages: {
                          ...extractedData.coverages,
                          autoLiability: { ...extractedData.coverages.autoLiability, policyNumber: e.target.value }
                        }
                      })}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs flex items-center gap-2">
                      Coverage Limit
                      {selectedRequirementSetId && getValidationStatus("auto_coverage_limits") && (
                        <ValidationStatusBadge status={getValidationStatus("auto_coverage_limits")!.status} />
                      )}
                    </Label>
                    <Input
                      value={extractedData.coverages.autoLiability.coverageLimit}
                      onChange={(e) => setExtractedData({
                        ...extractedData,
                        coverages: {
                          ...extractedData.coverages,
                          autoLiability: { ...extractedData.coverages.autoLiability, coverageLimit: e.target.value }
                        }
                      })}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs flex items-center gap-2">
                      Deductible
                      {selectedRequirementSetId && getValidationStatus("auto_deductible") && (
                        <ValidationStatusBadge status={getValidationStatus("auto_deductible")!.status} />
                      )}
                    </Label>
                    <Input
                      value={extractedData.coverages.autoLiability.deductible}
                      onChange={(e) => setExtractedData({
                        ...extractedData,
                        coverages: {
                          ...extractedData.coverages,
                          autoLiability: { ...extractedData.coverages.autoLiability, deductible: e.target.value }
                        }
                      })}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs flex items-center gap-2">
                      Effective Date
                      {selectedRequirementSetId && getValidationStatus("auto_effective_date") && (
                        <ValidationStatusBadge status={getValidationStatus("auto_effective_date")!.status} />
                      )}
                    </Label>
                    <Input
                      type="date"
                      value={extractedData.coverages.autoLiability.effectiveDate}
                      onChange={(e) => setExtractedData({
                        ...extractedData,
                        coverages: {
                          ...extractedData.coverages,
                          autoLiability: { ...extractedData.coverages.autoLiability, effectiveDate: e.target.value }
                        }
                      })}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs flex items-center gap-2">
                      Expiry Date
                      {selectedRequirementSetId && getValidationStatus("auto_expiry_date") && (
                        <ValidationStatusBadge status={getValidationStatus("auto_expiry_date")!.status} />
                      )}
                    </Label>
                    <Input
                      type="date"
                      value={extractedData.coverages.autoLiability.expiryDate}
                      onChange={(e) => setExtractedData({
                        ...extractedData,
                        coverages: {
                          ...extractedData.coverages,
                          autoLiability: { ...extractedData.coverages.autoLiability, expiryDate: e.target.value }
                        }
                      })}
                      className="h-9"
                    />
                  </div>
                </div>
              </div>

              {/* Non-Owned Trailer Liability */}
              <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                <h5 className="font-medium text-sm">Non-Owned Trailer Liability</h5>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs flex items-center gap-2">
                      Insurance Company
                      {selectedRequirementSetId && getValidationStatus("trailer_company_name") && (
                        <ValidationStatusBadge status={getValidationStatus("trailer_company_name")!.status} />
                      )}
                    </Label>
                    <Input
                      value={extractedData.coverages.trailerLiability.insuranceCompany}
                      onChange={(e) => setExtractedData({
                        ...extractedData,
                        coverages: {
                          ...extractedData.coverages,
                          trailerLiability: { ...extractedData.coverages.trailerLiability, insuranceCompany: e.target.value }
                        }
                      })}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs flex items-center gap-2">
                      Policy Number
                      {selectedRequirementSetId && getValidationStatus("trailer_policy_number") && (
                        <ValidationStatusBadge status={getValidationStatus("trailer_policy_number")!.status} />
                      )}
                    </Label>
                    <Input
                      value={extractedData.coverages.trailerLiability.policyNumber}
                      onChange={(e) => setExtractedData({
                        ...extractedData,
                        coverages: {
                          ...extractedData.coverages,
                          trailerLiability: { ...extractedData.coverages.trailerLiability, policyNumber: e.target.value }
                        }
                      })}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs flex items-center gap-2">
                      Coverage Limit
                      {selectedRequirementSetId && getValidationStatus("trailer_coverage_limits") && (
                        <ValidationStatusBadge status={getValidationStatus("trailer_coverage_limits")!.status} />
                      )}
                    </Label>
                    <Input
                      value={extractedData.coverages.trailerLiability.coverageLimit}
                      onChange={(e) => setExtractedData({
                        ...extractedData,
                        coverages: {
                          ...extractedData.coverages,
                          trailerLiability: { ...extractedData.coverages.trailerLiability, coverageLimit: e.target.value }
                        }
                      })}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs flex items-center gap-2">
                      Deductible
                      {selectedRequirementSetId && getValidationStatus("trailer_deductible") && (
                        <ValidationStatusBadge status={getValidationStatus("trailer_deductible")!.status} />
                      )}
                    </Label>
                    <Input
                      value={extractedData.coverages.trailerLiability.deductible}
                      onChange={(e) => setExtractedData({
                        ...extractedData,
                        coverages: {
                          ...extractedData.coverages,
                          trailerLiability: { ...extractedData.coverages.trailerLiability, deductible: e.target.value }
                        }
                      })}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs flex items-center gap-2">
                      Effective Date
                      {selectedRequirementSetId && getValidationStatus("trailer_effective_date") && (
                        <ValidationStatusBadge status={getValidationStatus("trailer_effective_date")!.status} />
                      )}
                    </Label>
                    <Input
                      type="date"
                      value={extractedData.coverages.trailerLiability.effectiveDate}
                      onChange={(e) => setExtractedData({
                        ...extractedData,
                        coverages: {
                          ...extractedData.coverages,
                          trailerLiability: { ...extractedData.coverages.trailerLiability, effectiveDate: e.target.value }
                        }
                      })}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs flex items-center gap-2">
                      Expiry Date
                      {selectedRequirementSetId && getValidationStatus("trailer_expiry_date") && (
                        <ValidationStatusBadge status={getValidationStatus("trailer_expiry_date")!.status} />
                      )}
                    </Label>
                    <Input
                      type="date"
                      value={extractedData.coverages.trailerLiability.expiryDate}
                      onChange={(e) => setExtractedData({
                        ...extractedData,
                        coverages: {
                          ...extractedData.coverages,
                          trailerLiability: { ...extractedData.coverages.trailerLiability, expiryDate: e.target.value }
                        }
                      })}
                      className="h-9"
                    />
                  </div>
                </div>
              </div>
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