import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/Sidebar";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { Mic, Clock, TrendingUp } from "lucide-react";

export default function MockInterviewPage() {
  const { data: interviews, isLoading } = useQuery({
    queryKey: ["/api/mock-interviews"],
  });

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        <header className="bg-white border-b border-slate-200 px-8 py-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Mock Interview</h2>
            <p className="text-slate-600">Practice your interview skills with AI-powered feedback</p>
          </div>
        </header>

        <main className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Interview Practice */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Start New Interview</CardTitle>
                </CardHeader>
                <CardContent>
                  <VoiceRecorder />
                </CardContent>
              </Card>

              {/* Interview History */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Interview History</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-slate-600">Loading interviews...</p>
                    </div>
                  ) : !interviews || (interviews as any[]).length === 0 ? (
                    <div className="text-center py-8">
                      <Mic className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-600">No mock interviews yet. Start your first practice session!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {(interviews as any[]).map((interview: any) => (
                        <div key={interview.id} className="p-4 border border-slate-200 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <Mic className="h-5 w-5 text-slate-500" />
                              <span className="font-medium text-slate-800">{interview.jobRole}</span>
                              <Badge 
                                className={`${
                                  interview.score >= 8 ? 'bg-green-100 text-green-800' :
                                  interview.score >= 6 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}
                              >
                                Score: {interview.score}/10
                              </Badge>
                            </div>
                            <span className="text-sm text-slate-500 flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {new Date(interview.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          
                          <div className="mb-3">
                            <p className="text-sm font-medium text-slate-700 mb-1">Question:</p>
                            <p className="text-sm text-slate-600">{interview.question}</p>
                          </div>
                          
                          {interview.feedback && (
                            <div className="mb-3">
                              <p className="text-sm font-medium text-slate-700 mb-1">Feedback:</p>
                              <p className="text-sm text-slate-600">{interview.feedback}</p>
                            </div>
                          )}
                          
                          <div className="flex space-x-3">
                            <Button variant="ghost" size="sm">
                              View Details
                            </Button>
                            <Button variant="ghost" size="sm">
                              <TrendingUp className="h-4 w-4 mr-1" />
                              Retry Question
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Interview Tips */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Interview Tips</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-1">STAR Method</h4>
                    <p className="text-sm text-blue-700">Structure answers with Situation, Task, Action, and Result</p>
                  </div>
                  
                  <div className="p-3 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-1">Be Specific</h4>
                    <p className="text-sm text-green-700">Use concrete examples and quantify your achievements</p>
                  </div>
                  
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <h4 className="font-medium text-purple-800 mb-1">Ask Questions</h4>
                    <p className="text-sm text-purple-700">Prepare thoughtful questions about the role and company</p>
                  </div>
                  
                  <div className="p-3 bg-amber-50 rounded-lg">
                    <h4 className="font-medium text-amber-800 mb-1">Practice Regularly</h4>
                    <p className="text-sm text-amber-700">Regular practice builds confidence and improves delivery</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Common Questions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button variant="ghost" className="w-full justify-start text-left h-auto p-3">
                      <div>
                        <p className="font-medium">Tell me about yourself</p>
                        <p className="text-sm text-slate-500">General introduction question</p>
                      </div>
                    </Button>
                    
                    <Button variant="ghost" className="w-full justify-start text-left h-auto p-3">
                      <div>
                        <p className="font-medium">Why do you want this role?</p>
                        <p className="text-sm text-slate-500">Motivation and fit question</p>
                      </div>
                    </Button>
                    
                    <Button variant="ghost" className="w-full justify-start text-left h-auto p-3">
                      <div>
                        <p className="font-medium">Describe a challenge you overcame</p>
                        <p className="text-sm text-slate-500">Problem-solving question</p>
                      </div>
                    </Button>
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
