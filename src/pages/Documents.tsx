import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, FileText, Calendar, Eye } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

const Documents = () => {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // TODO: Load documents when auth is enabled
    // For now, show empty state
    setIsLoading(false);
  }, []);

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
                  <Button variant="outline" size="sm" className="gap-2 flex-shrink-0">
                    <Eye className="h-4 w-4" />
                    View
                  </Button>
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