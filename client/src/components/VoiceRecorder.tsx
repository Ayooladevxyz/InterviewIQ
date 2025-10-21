import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Send, Loader2 } from "lucide-react";

export function VoiceRecorder() {
  const [jobRole, setJobRole] = useState("");
  const [question, setQuestion] = useState("");
  const [textAnswer, setTextAnswer] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const textMutation = useMutation({
    mutationFn: async ({ answer, question, jobRole }: { answer: string; question: string; jobRole: string }) => {
      const response = await fetch("/api/submit-answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question, answer, jobRole }),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Submission failed");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Answer Evaluated!",
        description: `You scored ${data.score}/10. Check your feedback for improvements.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/mock-interviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      
      // Reset form
      setTextAnswer("");
      setQuestion("");
      setJobRole("");
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmitText = () => {
    if (textAnswer && question && jobRole) {
      textMutation.mutate({ answer: textAnswer, question, jobRole });
    }
  };

  const jobRoles = [
    "Frontend Developer",
    "Backend Developer", 
    "Full Stack Developer",
    "Data Scientist",
    "Product Manager",
    "UX Designer",
    "DevOps Engineer",
    "Mobile Developer"
  ];

  const commonQuestions = [
    "Tell me about yourself",
    "Why do you want to work here?",
    "What are your greatest strengths?",
    "Describe a challenging project you worked on",
    "Where do you see yourself in 5 years?",
    "What is your biggest weakness?",
    "Why are you leaving your current job?",
    "How do you handle stress and pressure?"
  ];

  return (
    <div className="space-y-6">
      {/* Job Role Selection */}
      <div>
        <Label htmlFor="jobRole" className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
          Select Job Role
        </Label>
        <Select value={jobRole} onValueChange={setJobRole}>
          <SelectTrigger data-testid="select-job-role">
            <SelectValue placeholder="Choose a job role" />
          </SelectTrigger>
          <SelectContent>
            {jobRoles.map((role) => (
              <SelectItem key={role} value={role}>
                {role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Question Input */}
      <div>
        <Label htmlFor="question" className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
          Interview Question
        </Label>
        <Select value={question} onValueChange={setQuestion}>
          <SelectTrigger data-testid="select-question">
            <SelectValue placeholder="Select a question or type your own" />
          </SelectTrigger>
          <SelectContent>
            {commonQuestions.map((q) => (
              <SelectItem key={q} value={q}>
                {q}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder="Or type a custom question..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="mt-2"
          data-testid="input-custom-question"
        />
      </div>

      {/* Text Answer Interface */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="textAnswer" className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
            Your Answer
          </Label>
          <Textarea
            id="textAnswer"
            placeholder="Type your answer to the interview question..."
            value={textAnswer}
            onChange={(e) => setTextAnswer(e.target.value)}
            rows={6}
            data-testid="textarea-answer"
          />
        </div>
        
        <Button
          onClick={handleSubmitText}
          disabled={!textAnswer || !question || !jobRole || textMutation.isPending}
          className="w-full"
          data-testid="button-submit-answer"
        >
          {textMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          <Send className="h-4 w-4 mr-2" />
          Submit Answer for Analysis
        </Button>
      </div>

      <div className="text-sm text-slate-500 dark:text-slate-400 italic">
        Note: Audio recording is not available. Please type your answers.
      </div>
    </div>
  );
}
