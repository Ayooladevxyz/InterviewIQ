import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Mic, Square, Play, Send, Loader2 } from "lucide-react";

export function VoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [jobRole, setJobRole] = useState("");
  const [question, setQuestion] = useState("");
  const [textAnswer, setTextAnswer] = useState("");
  const [recordingTime, setRecordingTime] = useState(0);
  const [useTextMode, setUseTextMode] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const audioMutation = useMutation({
    mutationFn: async ({ audioBlob, question, jobRole }: { audioBlob: Blob; question: string; jobRole: string }) => {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.wav");
      formData.append("question", question);
      formData.append("jobRole", jobRole);

      const response = await fetch("/api/upload-audio", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Audio upload failed");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Interview Feedback Ready!",
        description: `You scored ${data.score}/10. Check your feedback for improvements.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/mock-interviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      
      // Reset form
      setAudioBlob(null);
      setQuestion("");
      setJobRole("");
      setRecordingTime(0);
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/wav" });
        setAudioBlob(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      intervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

    } catch (error) {
      toast({
        title: "Recording Failed",
        description: "Please ensure microphone access is granted.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSubmitAudio = () => {
    if (audioBlob && question && jobRole) {
      audioMutation.mutate({ audioBlob, question, jobRole });
    }
  };

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
        <Label htmlFor="jobRole" className="text-sm font-medium text-slate-700 mb-2 block">
          Select Job Role
        </Label>
        <Select value={jobRole} onValueChange={setJobRole}>
          <SelectTrigger>
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
        <Label htmlFor="question" className="text-sm font-medium text-slate-700 mb-2 block">
          Interview Question
        </Label>
        <Select value={question} onValueChange={setQuestion}>
          <SelectTrigger>
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
        />
      </div>

      {/* Mode Selection */}
      <div className="flex space-x-4">
        <Button
          variant={!useTextMode ? "default" : "outline"}
          onClick={() => setUseTextMode(false)}
          size="sm"
        >
          <Mic className="h-4 w-4 mr-2" />
          Voice Recording
        </Button>
        <Button
          variant={useTextMode ? "default" : "outline"}
          onClick={() => setUseTextMode(true)}
          size="sm"
        >
          <Send className="h-4 w-4 mr-2" />
          Text Answer
        </Button>
      </div>

      {/* Voice Recording Interface */}
      {!useTextMode && (
        <Card>
          <CardContent className="p-6 text-center">
            {!isRecording && !audioBlob && (
              <div>
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mic className="text-red-600 h-8 w-8" />
                </div>
                <h4 className="font-medium text-slate-800 mb-2">Ready to Practice?</h4>
                <p className="text-slate-600 mb-4">Click the microphone to start recording your answer</p>
                <Button
                  onClick={startRecording}
                  disabled={!question || !jobRole}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Mic className="h-4 w-4 mr-2" />
                  Start Recording
                </Button>
              </div>
            )}

            {isRecording && (
              <div>
                <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <Square className="text-white h-8 w-8" />
                </div>
                <h4 className="font-medium text-slate-800 mb-2">Recording...</h4>
                <p className="text-slate-600 mb-4">Time: {formatTime(recordingTime)}</p>
                <Button onClick={stopRecording} variant="outline">
                  <Square className="h-4 w-4 mr-2" />
                  Stop Recording
                </Button>
              </div>
            )}

            {audioBlob && !isRecording && (
              <div>
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Play className="text-green-600 h-8 w-8" />
                </div>
                <h4 className="font-medium text-slate-800 mb-2">Recording Complete!</h4>
                <p className="text-slate-600 mb-4">Duration: {formatTime(recordingTime)}</p>
                <div className="flex space-x-3 justify-center">
                  <Button
                    onClick={handleSubmitAudio}
                    disabled={audioMutation.isPending}
                  >
                    {audioMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Submit for Analysis
                  </Button>
                  <Button variant="outline" onClick={() => setAudioBlob(null)}>
                    Record Again
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Text Answer Interface */}
      {useTextMode && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="textAnswer" className="text-sm font-medium text-slate-700 mb-2 block">
              Your Answer
            </Label>
            <Textarea
              id="textAnswer"
              placeholder="Type your answer to the interview question..."
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              rows={6}
            />
          </div>
          
          <Button
            onClick={handleSubmitText}
            disabled={!textAnswer || !question || !jobRole || textMutation.isPending}
            className="w-full"
          >
            {textMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Submit Answer for Analysis
          </Button>
        </div>
      )}
    </div>
  );
}
