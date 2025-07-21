import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/Sidebar";
import { FileUpload } from "@/components/FileUpload";
import { FileText, Download, TrendingUp } from "lucide-react";

export default function CvAnalysisPage() {
  const { data: cvAnalyses, isLoading } = useQuery({
    queryKey: ["/api/cv-analyses"],
  });

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        <header className="bg-white border-b border-slate-200 px-8 py-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">CV Analysis</h2>
            <p className="text-slate-600">Upload and analyze your CV with AI-powered insights</p>
          </div>
        </header>

        <main className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Upload Section */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Upload Your CV</CardTitle>
                </CardHeader>
                <CardContent>
                  <FileUpload />
                </CardContent>
              </Card>

              {/* Analysis History */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Analysis History</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-slate-600">Loading analyses...</p>
                    </div>
                  ) : !cvAnalyses || (cvAnalyses as any[]).length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-600">No CV analyses yet. Upload your first CV to get started!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {(cvAnalyses as any[]).map((analysis: any) => (
                        <div key={analysis.id} className="p-4 border border-slate-200 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <FileText className="h-5 w-5 text-slate-500" />
                              <span className="font-medium text-slate-800">{analysis.filename}</span>
                              <Badge className="bg-green-100 text-green-800">
                                Score: {analysis.score}/100
                              </Badge>
                            </div>
                            <span className="text-sm text-slate-500">
                              {new Date(analysis.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          
                          {analysis.suggestions && Array.isArray(analysis.suggestions) && (
                            <div className="mb-3">
                              <h4 className="text-sm font-medium text-slate-700 mb-2">Key Suggestions:</h4>
                              <ul className="text-sm text-slate-600 space-y-1">
                                {analysis.suggestions.slice(0, 3).map((suggestion: string, idx: number) => (
                                  <li key={idx} className="flex items-start space-x-2">
                                    <TrendingUp className="h-3 w-3 text-green-500 mt-1 flex-shrink-0" />
                                    <span>{suggestion}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          <div className="flex space-x-3">
                            <Button variant="ghost" size="sm">
                              View Details
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Tips Section */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>CV Tips</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-1">Use Action Verbs</h4>
                    <p className="text-sm text-blue-700">Start bullet points with strong action verbs like "led", "developed", "improved"</p>
                  </div>
                  
                  <div className="p-3 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-1">Quantify Achievements</h4>
                    <p className="text-sm text-green-700">Include numbers and percentages to show impact: "Increased sales by 25%"</p>
                  </div>
                  
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <h4 className="font-medium text-purple-800 mb-1">Tailor for Each Role</h4>
                    <p className="text-sm text-purple-700">Customize your CV for each job application to match requirements</p>
                  </div>
                  
                  <div className="p-3 bg-amber-50 rounded-lg">
                    <h4 className="font-medium text-amber-800 mb-1">Keep It Concise</h4>
                    <p className="text-sm text-amber-700">Aim for 1-2 pages maximum and use clear, readable formatting</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
