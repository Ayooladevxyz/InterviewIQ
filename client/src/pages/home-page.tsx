import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/Sidebar";
import { FileUpload } from "@/components/FileUpload";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { useAuth } from "@/hooks/use-auth";
import { 
  FileText, 
  Mic, 
  ChartLine, 
  Trophy, 
  TrendingUp,
  Download,
  Eye,
  ExternalLink,
  Crown
} from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();
  
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["/api/dashboard"],
    refetchInterval: 30000, // Refresh every 30 seconds
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

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  const progress = (dashboardData as any)?.progress || { cvScore: 0, interviewCount: 0, averageScore: 0, dayStreak: 0 };
  const recentInterviews = (dashboardData as any)?.recentInterviews || [];
  const latestCvAnalysis = (dashboardData as any)?.latestCvAnalysis || null;

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
              <p className="text-slate-600">Track your progress and improve your interview skills</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Crown className="h-4 w-4 mr-2" />
                Upgrade to Pro
              </Button>
            </div>
          </div>
        </header>

        <main className="p-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FileText className="text-primary h-6 w-6" />
                  </div>
                  <Badge variant="secondary" className="text-green-600 bg-green-50">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +12%
                  </Badge>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-1">{progress.cvScore}</h3>
                <p className="text-slate-600 text-sm">CV Score</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-violet-100 rounded-lg flex items-center justify-center">
                    <Mic className="text-violet-600 h-6 w-6" />
                  </div>
                  <Badge variant="secondary" className="text-green-600 bg-green-50">
                    +{recentInterviews.length}
                  </Badge>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-1">{progress.interviewCount}</h3>
                <p className="text-slate-600 text-sm">Mock Interviews</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <ChartLine className="text-green-600 h-6 w-6" />
                  </div>
                  <Badge variant="secondary" className="text-green-600 bg-green-50">
                    +15%
                  </Badge>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-1">{progress.averageScore}</h3>
                <p className="text-slate-600 text-sm">Avg Score</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Trophy className="text-amber-600 h-6 w-6" />
                  </div>
                  <Badge variant="secondary" className="text-green-600 bg-green-50">
                    New!
                  </Badge>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-1">{progress.dayStreak}</h3>
                <p className="text-slate-600 text-sm">Day Streak</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* CV Upload Section */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    CV Analysis
                    <Button variant="ghost" size="sm">View History</Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FileUpload />
                  
                  {latestCvAnalysis && (
                    <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-slate-800">Latest Analysis</h4>
                        <span className="text-sm text-slate-500">
                          {new Date(latestCvAnalysis.createdAt!).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <FileText className="text-green-600 h-4 w-4" />
                        </div>
                        <span className="font-medium text-slate-800">{latestCvAnalysis.filename}</span>
                        <Badge className="bg-green-100 text-green-800">
                          Score: {latestCvAnalysis.score}/100
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 mb-3">
                        {Array.isArray(latestCvAnalysis.suggestions) && latestCvAnalysis.suggestions.length > 0
                          ? latestCvAnalysis.suggestions[0]
                          : "Analysis complete. Check detailed feedback for improvements."}
                      </p>
                      <div className="flex space-x-3">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          Download Report
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Mock Interview Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Mock Interview
                    <Button>Start Interview</Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <VoiceRecorder />
                  
                  {recentInterviews.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-medium text-slate-800 mb-4">Recent Scores</h4>
                      <div className="space-y-3">
                        {recentInterviews.slice(0, 3).map((interview: any) => (
                          <div key={interview.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div>
                              <p className="font-medium text-slate-800">{interview.question}</p>
                              <p className="text-sm text-slate-600">
                                {interview.jobRole} • {new Date(interview.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-lg text-green-600">{interview.score}</span>
                              <p className="text-sm text-slate-500">/10</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Progress Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-600">Interview Skills</span>
                      <span className="font-medium text-slate-800">
                        {Math.min(100, (progress.averageScore / 10) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={Math.min(100, (progress.averageScore / 10) * 100)} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-600">CV Quality</span>
                      <span className="font-medium text-slate-800">{progress.cvScore}%</span>
                    </div>
                    <Progress value={progress.cvScore} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-600">Activity Streak</span>
                      <span className="font-medium text-slate-800">{progress.dayStreak} days</span>
                    </div>
                    <Progress value={Math.min(100, (progress.dayStreak / 30) * 100)} />
                  </div>

                  <div className="mt-6 p-4 bg-primary/5 rounded-lg">
                    <h4 className="font-medium text-primary-800 mb-1">Next Milestone</h4>
                    <p className="text-sm text-primary-700">
                      Complete {Math.max(0, 5 - progress.interviewCount)} more mock interviews to unlock advanced analytics
                    </p>
                    <div className="mt-2 flex items-center text-xs text-primary-600">
                      <Progress 
                        value={Math.min(100, (progress.interviewCount / 5) * 100)} 
                        className="flex-1 mr-2" 
                      />
                      <span>{Math.min(5, progress.interviewCount)}/5</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Career Insights */}
              <Card>
                <CardHeader>
                  <CardTitle>Career Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 border border-slate-200 rounded-lg hover:border-primary-300 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-slate-800">Frontend Developer</h4>
                      <ExternalLink className="h-4 w-4 text-slate-400" />
                    </div>
                    <p className="text-sm text-green-600 font-medium">$95K - $140K</p>
                    <p className="text-xs text-slate-500">Average US Salary</p>
                    
                    <div className="mt-3">
                      <p className="text-xs text-slate-600 mb-2">In-demand skills:</p>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="secondary" className="text-xs">React</Badge>
                        <Badge variant="secondary" className="text-xs">TypeScript</Badge>
                        <Badge variant="secondary" className="text-xs">Node.js</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <Button variant="ghost" className="w-full">
                    Explore All Roles <ExternalLink className="h-4 w-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>

              {/* Export Feedback */}
              <Card>
                <CardHeader>
                  <CardTitle>Feedback Report</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-4">
                    Export your complete feedback report with CV analysis, interview scores, and improvement suggestions.
                  </p>
                  <Button onClick={handleExportFeedback} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF Report
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
