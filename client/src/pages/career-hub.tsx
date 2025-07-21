import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/Sidebar";
import { Search, TrendingUp, DollarSign, BookOpen, ExternalLink } from "lucide-react";

export default function CareerHubPage() {
  const [selectedRole, setSelectedRole] = useState("Frontend Developer");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: jobRoles } = useQuery({
    queryKey: ["/api/job-role-list", searchTerm],
    queryFn: () => fetch(`/api/job-role-list?search=${encodeURIComponent(searchTerm)}`).then(res => res.json()),
  });

  const { data: insights, isLoading: insightsLoading } = useQuery({
    queryKey: ["/api/job-role-insights", selectedRole],
    queryFn: () => fetch(`/api/job-role-insights?role=${encodeURIComponent(selectedRole)}`).then(res => res.json()),
    enabled: !!selectedRole,
  });

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        <header className="bg-white border-b border-slate-200 px-8 py-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Career Hub</h2>
            <p className="text-slate-600">Explore career insights, salary data, and skill requirements</p>
          </div>
        </header>

        <main className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Job Roles List */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Browse Roles</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <Input
                      placeholder="Search job roles..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    {jobRoles?.roles?.map((role: string) => (
                      <Button
                        key={role}
                        variant={selectedRole === role ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setSelectedRole(role)}
                      >
                        {role}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Role Details */}
            <div className="lg:col-span-2">
              {insightsLoading ? (
                <Card>
                  <CardContent className="p-8">
                    <div className="text-center">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-slate-600">Loading career insights...</p>
                    </div>
                  </CardContent>
                </Card>
              ) : insights ? (
                <div className="space-y-6">
                  {/* Role Header */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <TrendingUp className="h-6 w-6 text-primary" />
                        <span>{selectedRole}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
                          <p className="font-semibold text-green-800">{insights.averageSalaryUS}</p>
                          <p className="text-sm text-green-600">US Average</p>
                        </div>
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <DollarSign className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                          <p className="font-semibold text-blue-800">{insights.averageSalaryUK}</p>
                          <p className="text-sm text-blue-600">UK Average</p>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <DollarSign className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                          <p className="font-semibold text-purple-800">{insights.averageSalaryRemote}</p>
                          <p className="text-sm text-purple-600">Remote Average</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* In-Demand Skills */}
                  <Card>
                    <CardHeader>
                      <CardTitle>In-Demand Skills</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {insights.inDemandSkills?.map((skill: string, index: number) => (
                          <Badge key={index} variant="secondary" className="px-3 py-1">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Career Path */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Career Progression</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {insights.careerPath?.map((step: string, index: number) => (
                          <div key={index} className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-primary font-semibold text-sm">{index + 1}</span>
                            </div>
                            <p className="text-slate-700">{step}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Learning Resources */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Learning Resources</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {insights.topResources?.map((resource: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:border-primary-300 transition-colors">
                            <div className="flex items-center space-x-3">
                              <BookOpen className="h-5 w-5 text-slate-500" />
                              <div>
                                <p className="font-medium text-slate-800">{resource.title}</p>
                                <Badge variant="outline" className="text-xs">
                                  {resource.type}
                                </Badge>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" asChild>
                              <a href={resource.url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8">
                    <div className="text-center">
                      <TrendingUp className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-600">Select a job role to view career insights</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
