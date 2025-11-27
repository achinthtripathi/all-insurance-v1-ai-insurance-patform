import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface Coverage {
  insuranceCompany: string;
  policyNumber: string;
  limits: string;
  limitsCurrency: string;
  deductible: string;
  deductibleCurrency: string;
  effectiveDate: string;
  expiryDate: string;
}

interface ExtractedData {
  id: string;
  named_insured: string | null;
  certificate_holder: string | null;
  additional_insured: string | null;
  cancellation_notice_period: string | null;
  form_type: string | null;
  coverages: {
    generalLiability: Coverage;
    automobileLiability: Coverage;
    nonOwnedTrailer: Coverage;
  } | null;
}

interface Document {
  id: string;
  file_name: string;
  file_type: string;
  file_url: string;
  status: string | null;
  upload_date: string | null;
  extracted_data: ExtractedData[];
}

interface EditDocumentDialogProps {
  document: Document;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export const EditDocumentDialog = ({ document, open, onOpenChange, onSaved }: EditDocumentDialogProps) => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  const extractedData = document.extracted_data[0];
  const coverages = extractedData?.coverages || {
    generalLiability: { insuranceCompany: "", policyNumber: "", limits: "", limitsCurrency: "USD", deductible: "", deductibleCurrency: "USD", effectiveDate: "", expiryDate: "" },
    automobileLiability: { insuranceCompany: "", policyNumber: "", limits: "", limitsCurrency: "USD", deductible: "", deductibleCurrency: "USD", effectiveDate: "", expiryDate: "" },
    nonOwnedTrailer: { insuranceCompany: "", policyNumber: "", limits: "", limitsCurrency: "USD", deductible: "", deductibleCurrency: "USD", effectiveDate: "", expiryDate: "" },
  };

  const [formData, setFormData] = useState({
    file_name: document.file_name,
    named_insured: extractedData?.named_insured || "",
    certificate_holder: extractedData?.certificate_holder || "",
    additional_insured: extractedData?.additional_insured || "",
    cancellation_notice_period: extractedData?.cancellation_notice_period || "",
    form_type: extractedData?.form_type || "",
    coverages: coverages,
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Update document metadata
      const { error: docError } = await supabase
        .from('documents')
        .update({ file_name: formData.file_name })
        .eq('id', document.id);

      if (docError) throw docError;

      // Update extracted data
      if (extractedData) {
        const { error: extractError } = await supabase
          .from('extracted_data')
          .update({
            named_insured: formData.named_insured,
            certificate_holder: formData.certificate_holder,
            additional_insured: formData.additional_insured,
            cancellation_notice_period: formData.cancellation_notice_period,
            form_type: formData.form_type,
            coverages: formData.coverages as any,
          })
          .eq('id', extractedData.id);

        if (extractError) throw extractError;
      }

      toast({
        title: "Success",
        description: "Document updated successfully",
      });

      onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating document:", error);
      toast({
        title: "Error",
        description: "Failed to update document",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Document</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Document Metadata */}
          <div className="space-y-2">
            <Label htmlFor="file_name">File Name</Label>
            <Input
              id="file_name"
              value={formData.file_name}
              onChange={(e) => setFormData({ ...formData, file_name: e.target.value })}
            />
          </div>

          {/* General Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">General Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="named_insured">Named Insured</Label>
              <Input
                id="named_insured"
                value={formData.named_insured}
                onChange={(e) => setFormData({ ...formData, named_insured: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="certificate_holder">Certificate Holder</Label>
              <Input
                id="certificate_holder"
                value={formData.certificate_holder}
                onChange={(e) => setFormData({ ...formData, certificate_holder: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="additional_insured">Additional Insured</Label>
              <Input
                id="additional_insured"
                value={formData.additional_insured}
                onChange={(e) => setFormData({ ...formData, additional_insured: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cancellation_notice">Cancellation Notice Period</Label>
              <Input
                id="cancellation_notice"
                value={formData.cancellation_notice_period}
                onChange={(e) => setFormData({ ...formData, cancellation_notice_period: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="form_type">Form Type</Label>
              <Input
                id="form_type"
                value={formData.form_type}
                onChange={(e) => setFormData({ ...formData, form_type: e.target.value })}
              />
            </div>
          </div>

          {/* Coverage Sections */}
          {(['generalLiability', 'automobileLiability', 'nonOwnedTrailer'] as const).map((coverageType) => (
            <div key={coverageType} className="space-y-4 border-t pt-4">
              <h3 className="font-semibold text-lg">
                {coverageType === 'generalLiability' ? 'Commercial General Liability' :
                 coverageType === 'automobileLiability' ? 'Automobile Liability' :
                 'Non-Owned Trailer Liability'}
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Insurance Company</Label>
                  <Input
                    value={formData.coverages[coverageType].insuranceCompany}
                    onChange={(e) => setFormData({
                      ...formData,
                      coverages: {
                        ...formData.coverages,
                        [coverageType]: { ...formData.coverages[coverageType], insuranceCompany: e.target.value }
                      }
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Policy Number</Label>
                  <Input
                    value={formData.coverages[coverageType].policyNumber}
                    onChange={(e) => setFormData({
                      ...formData,
                      coverages: {
                        ...formData.coverages,
                        [coverageType]: { ...formData.coverages[coverageType], policyNumber: e.target.value }
                      }
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Coverage Limits</Label>
                  <Input
                    value={formData.coverages[coverageType].limits}
                    onChange={(e) => setFormData({
                      ...formData,
                      coverages: {
                        ...formData.coverages,
                        [coverageType]: { ...formData.coverages[coverageType], limits: e.target.value }
                      }
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Deductible</Label>
                  <Input
                    value={formData.coverages[coverageType].deductible}
                    onChange={(e) => setFormData({
                      ...formData,
                      coverages: {
                        ...formData.coverages,
                        [coverageType]: { ...formData.coverages[coverageType], deductible: e.target.value }
                      }
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Effective Date</Label>
                  <Input
                    type="date"
                    value={formData.coverages[coverageType].effectiveDate}
                    onChange={(e) => setFormData({
                      ...formData,
                      coverages: {
                        ...formData.coverages,
                        [coverageType]: { ...formData.coverages[coverageType], effectiveDate: e.target.value }
                      }
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Expiry Date</Label>
                  <Input
                    type="date"
                    value={formData.coverages[coverageType].expiryDate}
                    onChange={(e) => setFormData({
                      ...formData,
                      coverages: {
                        ...formData.coverages,
                        [coverageType]: { ...formData.coverages[coverageType], expiryDate: e.target.value }
                      }
                    })}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
