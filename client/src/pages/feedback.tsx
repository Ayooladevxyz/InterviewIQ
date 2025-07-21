import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/Sidebar";
import { Download, FileText, Mic, TrendingUp, CheckCircle, AlertCircle } from "lucide-react";

export default function FeedbackPage() {
  const { data: cvAnalyses, isLoading: cvLoading } = useQuery({
    queryKey: ["/api/cv-analyses"],
  });

  const { data: interviews, isLoading: interviewLoading } = useQuery({
    queryKey: ["/api/mock-interviews"],
  });

  const handleExportFeedback = async () => {
    try {
      const response = await fetch("/api/export-feedback", {
        credentials: "include",
      });
      
      if (!response.ok) throw new Error("Failed to export feedback");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "feedback-report.pdf";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const isLoading = cvLoading || interviewLoading;

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        <header className="bg-white border-b border-slate-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Feedback Center</h2>
              <p className="text-slate-600">Review all your feedback and track improvements</p>
            </div>
            <Button onClick={handleExportFeedback}>
              <Download className="h-4 w-4 mr-2" />
              Export Full Report
            </Button>
          </div>
        </header>

        <main className="p-8">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600">Loading feedback...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* CV Feedback */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>CV Analysis Feedback</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!cvAnalyses || (cvAnalyses as any[]).length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-600">No CV feedback available. Upload your CV to get started!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {(cvAnalyses as any[]).slice(0, 5).map((analysis: any) => (
                        <div key={analysis.id} className="p-4 border border-slate-200 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                analysis.score >= 80 ? 'bg-green-100' : 
                                analysis.score >= 60 ? 'bg-yellow-100' : 'bg-red-100'
                              }`}>
                                {analysis.score >= 80 ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-slate-800">{analysis.filename}</p>
                                <p className="text-sm text-slate-500">
                                  {new Date(analysis.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <Badge className={
                              analysis.score >= 80 ? 'bg-green-100 text-green-800' :
                              analysis.score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }>
                              {analysis.score}/100
                            </Badge>
                          </div>
                          
                          {analysis.suggestions && Array.isArray(analysis.suggestions) && (
                            <div>
                              <p className="text-sm font-medium text-slate-700 mb-2">Key Improvements:</p>
                              <ul className="text-sm text-slate-600 space-y-1">
                                {analysis.suggestions.slice(0, 2).map((suggestion: string, idx: number) => (
                                  <li key={idx} className="flex items-start space-x-2">
                                    <TrendingUp className="h-3 w-3 text-blue-500 mt-1 flex-shrink-0" />
                                    <span>{suggestion}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {(cvAnalyses as any[]).length > 5 && (
                        <Button variant="ghost" className="w-full">
                          View All CV Feedback ({(cvAnalyses as any[]).length} total)
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Interview Feedback */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Mic className="h-5 w-5" />
                    <span>Interview Feedback</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!interviews || (interviews as any[]).length === 0 ? (
                    <div className="text-center py-8">
                      <Mic className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-600">No interview feedback available. Start practicing interviews!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {(interviews as any[]).slice(0, 5).map((interview: any) => (
                        <div key={interview.id} className="p-4 border border-slate-200 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                interview.score >= 8 ? 'bg-green-100' : 
                                interview.score >= 6 ? 'bg-yellow-100' : 'bg-red-100'
                              }`}>
                                {interview.score >= 8 ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-slate-800">{interview.jobRole}</p>
                                <p className="text-sm text-slate-500">
                                  {new Date(interview.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <Badge className={
                              interview.score >= 8 ? 'bg-green-100 text-green-800' :
                              interview.score >= 6 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }>
                              {interview.score}/10
                            </Badge>
                          </div>
                          
                          <div className="mb-2">
                            <p className="text-sm font-medium text-slate-700">Question:</p>
                            <p className="text-sm text-slate-600">{interview.question}</p>
                          </div>
                          
                          {interview.feedback && (
                            <div>
                              <p className="text-sm font-medium text-slate-700 mb-1">Feedback:</p>
                              <p className="text-sm text-slate-600">{interview.feedback.substring(0, 150)}...</p>
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {(interviews as any[]).length > 5 && (
                        <Button variant="ghost" className="w-full">
                          View All Interview Feedback ({(interviews as any[]).length} total)
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{(cvAnalyses as any[])?.length || 0}</p>
                    <p className="text-sm text-slate-600">CV Analyses</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Mic className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{(interviews as any[])?.length || 0}</p>
                    <p className="text-sm text-slate-600">Mock Interviews</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">
                      {(interviews as any[])?.length > 0 
                        ? ((interviews as any[]).reduce((sum: number, i: any) => sum + i.score, 0) / (interviews as any[]).length).toFixed(1)
                        : "0.0"
                      }
                    </p>
                    <p className="text-sm text-slate-600">Avg Score</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
