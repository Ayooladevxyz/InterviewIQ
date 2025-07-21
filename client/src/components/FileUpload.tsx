import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CloudUpload, FileText, Loader2, Check } from "lucide-react";

export function FileUpload() {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("cv", file);

      const response = await fetch("/api/upload-cv", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Upload failed");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "CV Analysis Complete!",
        description: `Your CV scored ${data.score}/100. Check the suggestions for improvements.`,
      });
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/cv-analyses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      
      setUploadedFile(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFile = (file: File) => {
    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword"
    ];
    
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PDF or DOCX file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    setUploadedFile(file);
  };

  const handleUpload = () => {
    if (uploadedFile) {
      uploadMutation.mutate(uploadedFile);
    }
  };

  return (
    <Card 
      className={`border-2 border-dashed transition-colors cursor-pointer ${
        dragActive 
          ? "border-primary bg-primary/5" 
          : "border-slate-300 hover:border-primary/50"
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <div className="p-8 text-center">
        {uploadMutation.isPending ? (
          <div>
            <Loader2 className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" />
            <h4 className="text-lg font-medium text-slate-800 mb-2">Analyzing your CV...</h4>
            <p className="text-slate-600">This may take a few moments</p>
          </div>
        ) : uploadedFile && !uploadMutation.isPending ? (
          <div>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="text-green-600 h-8 w-8" />
            </div>
            <h4 className="text-lg font-medium text-slate-800 mb-2">{uploadedFile.name}</h4>
            <p className="text-slate-600 mb-4">Ready to analyze</p>
            <div className="flex space-x-3 justify-center">
              <Button onClick={handleUpload} disabled={uploadMutation.isPending}>
                <Check className="h-4 w-4 mr-2" />
                Analyze CV
              </Button>
              <Button variant="ghost" onClick={() => setUploadedFile(null)}>
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CloudUpload className="text-slate-400 h-8 w-8" />
            </div>
            <h4 className="text-lg font-medium text-slate-800 mb-2">Upload your CV</h4>
            <p className="text-slate-600 mb-4">Drag and drop your PDF or DOCX file here, or click to browse</p>
            
            <input
              type="file"
              accept=".pdf,.docx,.doc"
              onChange={handleFileInput}
              className="hidden"
              id="cv-upload"
            />
            <Button asChild>
              <label htmlFor="cv-upload" className="cursor-pointer">
                Choose File
              </label>
            </Button>
            
            <p className="text-sm text-slate-500 mt-2">Supports PDF and DOCX up to 10MB</p>
          </div>
        )}
      </div>
    </Card>
  );
}
