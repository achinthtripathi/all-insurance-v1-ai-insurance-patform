import Example2Pdf from "@/assets/Example2.pdf";

export interface MockCertificate {
  id: string;
  name: string;
  fileName: string;
  pdfUrl: string;
  data: {
    namedInsured: string;
    certificateHolder: string;
    additionalInsured: string;
    cancellationNotice: string;
    formType: string;
    coverages: {
      generalLiability: {
        insuranceCompany: string;
        policyNumber: string;
        coverageLimit: string;
        currency: string;
        deductible: string;
        effectiveDate: string;
        expiryDate: string;
      };
      autoLiability: {
        insuranceCompany: string;
        policyNumber: string;
        coverageLimit: string;
        currency: string;
        deductible: string;
        effectiveDate: string;
        expiryDate: string;
      };
      trailerLiability: {
        insuranceCompany: string;
        policyNumber: string;
        coverageLimit: string;
        currency: string;
        deductible: string;
        effectiveDate: string;
        expiryDate: string;
      };
    };
  };
}

export const MOCK_CERTIFICATES: MockCertificate[] = [
  {
    id: "example2",
    name: "Example 2 - General Freight Hauling Ltd.",
    fileName: "Example2.pdf",
    pdfUrl: Example2Pdf,
    data: {
      namedInsured: "General Freight Hauling Ltd.\n9623 25 Ave NW, Edmonton, AB, T6N 1H7",
      certificateHolder: "EDM Trailer Rentals Ltd.\n9623 25 Ave NW, Edmonton, AB",
      additionalInsured: "Edm Trailer Rentals Ltd.\n9623 25 Ave NW, Edmonton, AB",
      cancellationNotice: "30",
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
    },
  },
];
