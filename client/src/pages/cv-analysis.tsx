import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/Sidebar";
import { FileUpload } from "@/components/FileUpload";
import { 
  FileText, Download, TrendingUp, TrendingDown, 
  CheckCircle, XCircle, Target, Briefcase, 
  DollarSign, Award, ChevronDown, ChevronUp 
} from "lucide-react";

function AnalysisDetailCard({ analysis }: { analysis: any }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="p-4 border border-slate-200 rounded-lg" data-testid={`analysis-card-${analysis.id}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <FileText className="h-5 w-5 text-slate-500" />
          <span className="font-medium text-slate-800" data-testid={`text-filename-${analysis.id}`}>{analysis.filename}</span>
          <Badge className="bg-green-100 text-green-800" data-testid={`badge-score-${analysis.id}`}>
            Score: {analysis.score}/100
          </Badge>
          {analysis.detectedJobRole && (
            <Badge className="bg-blue-100 text-blue-800" data-testid={`badge-job-role-${analysis.id}`}>
              <Briefcase className="h-3 w-3 mr-1" />
              {analysis.detectedJobRole}
            </Badge>
          )}
        </div>
        <span className="text-sm text-slate-500">
          {new Date(analysis.createdAt).toLocaleDateString()}
        </span>
      </div>
      
      {/* Strengths */}
      {analysis.strengths && Array.isArray(analysis.strengths) && analysis.strengths.length > 0 && (
        <div className="mb-3 p-3 bg-green-50 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <h4 className="text-sm font-medium text-green-800">Strengths</h4>
          </div>
          <ul className="text-sm text-green-700 space-y-1 ml-6">
            {analysis.strengths.slice(0, expanded ? undefined : 3).map((strength: string, idx: number) => (
              <li key={idx} data-testid={`strength-${analysis.id}-${idx}`}>• {strength}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Weaknesses */}
      {analysis.weaknesses && Array.isArray(analysis.weaknesses) && analysis.weaknesses.length > 0 && (
        <div className="mb-3 p-3 bg-red-50 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <XCircle className="h-4 w-4 text-red-600" />
            <h4 className="text-sm font-medium text-red-800">Areas for Improvement</h4>
          </div>
          <ul className="text-sm text-red-700 space-y-1 ml-6">
            {analysis.weaknesses.slice(0, expanded ? undefined : 3).map((weakness: string, idx: number) => (
              <li key={idx} data-testid={`weakness-${analysis.id}-${idx}`}>• {weakness}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Extracted Skills */}
      {analysis.extractedSkills && Array.isArray(analysis.extractedSkills) && analysis.extractedSkills.length > 0 && (
        <div className="mb-3 p-3 bg-purple-50 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Award className="h-4 w-4 text-purple-600" />
            <h4 className="text-sm font-medium text-purple-800">Extracted Skills</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {analysis.extractedSkills.slice(0, expanded ? undefined : 8).map((skill: string, idx: number) => (
              <Badge key={idx} variant="outline" className="bg-white text-purple-700 border-purple-200" data-testid={`skill-${analysis.id}-${idx}`}>
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {expanded && (
        <>
          {/* Next Steps */}
          {analysis.nextSteps && Array.isArray(analysis.nextSteps) && analysis.nextSteps.length > 0 && (
            <div className="mb-3 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Target className="h-4 w-4 text-blue-600" />
                <h4 className="text-sm font-medium text-blue-800">Next Steps</h4>
              </div>
              <ul className="text-sm text-blue-700 space-y-1 ml-6">
                {analysis.nextSteps.map((step: string, idx: number) => (
                  <li key={idx} data-testid={`next-step-${analysis.id}-${idx}`}>• {step}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Career Trajectory */}
          {analysis.careerTrajectory && Array.isArray(analysis.careerTrajectory) && analysis.careerTrajectory.length > 0 && (
            <div className="mb-3 p-3 bg-amber-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="h-4 w-4 text-amber-600" />
                <h4 className="text-sm font-medium text-amber-800">Career Growth Trajectory</h4>
              </div>
              <ul className="text-sm text-amber-700 space-y-1 ml-6">
                {analysis.careerTrajectory.map((item: string, idx: number) => (
                  <li key={idx} data-testid={`career-trajectory-${analysis.id}-${idx}`}>• {item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Salary Insights */}
          {analysis.salaryInsights && typeof analysis.salaryInsights === 'object' && (
            <div className="mb-3 p-3 bg-emerald-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                <h4 className="text-sm font-medium text-emerald-800">Salary Insights</h4>
              </div>
              <div className="text-sm text-emerald-700 space-y-2">
                <p data-testid={`salary-role-${analysis.id}`}><strong>Role:</strong> {analysis.salaryInsights.roleTitle || 'Not detected'}</p>
                <p data-testid={`salary-experience-${analysis.id}`}><strong>Experience Level:</strong> {analysis.salaryInsights.experienceLevel || 'Not specified'}</p>
                <div className="mt-2 space-y-1">
                  <p data-testid={`salary-us-${analysis.id}`}><strong>US:</strong> {analysis.salaryInsights.salaryRangeUS || 'Data not available'}</p>
                  <p data-testid={`salary-uk-${analysis.id}`}><strong>UK:</strong> {analysis.salaryInsights.salaryRangeUK || 'Data not available'}</p>
                  <p data-testid={`salary-remote-${analysis.id}`}><strong>Remote:</strong> {analysis.salaryInsights.salaryRangeRemote || 'Data not available'}</p>
                </div>
                {analysis.salaryInsights.factors && Array.isArray(analysis.salaryInsights.factors) && analysis.salaryInsights.factors.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium mb-1">Key Factors:</p>
                    <ul className="ml-4 space-y-1">
                      {analysis.salaryInsights.factors.map((factor: string, idx: number) => (
                        <li key={idx} data-testid={`salary-factor-${analysis.id}-${idx}`}>• {factor}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Original Suggestions */}
          {analysis.suggestions && Array.isArray(analysis.suggestions) && (
            <div className="mb-3">
              <h4 className="text-sm font-medium text-slate-700 mb-2">Key Suggestions:</h4>
              <ul className="text-sm text-slate-600 space-y-1">
                {analysis.suggestions.map((suggestion: string, idx: number) => (
                  <li key={idx} className="flex items-start space-x-2" data-testid={`suggestion-${analysis.id}-${idx}`}>
                    <TrendingUp className="h-3 w-3 text-green-500 mt-1 flex-shrink-0" />
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
      
      <div className="flex space-x-3 mt-3">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setExpanded(!expanded)}
          data-testid={`button-toggle-details-${analysis.id}`}
        >
          {expanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-1" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-1" />
              View Full Analysis
            </>
          )}
        </Button>
        <Button variant="ghost" size="sm" data-testid={`button-download-${analysis.id}`}>
          <Download className="h-4 w-4 mr-1" />
          Download
        </Button>
      </div>
    </div>
  );
}

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
                        <AnalysisDetailCard key={analysis.id} analysis={analysis} />
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
