import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import jsPDF from 'jspdf';



import { 
  Upload, 
  FileText, 
  MessageSquare, 
  Settings, 
  Home,
  FolderOpen,
  BookOpen,
  LogOut,
  Plus,
  Search,
  Loader2
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/theme-toggle";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { useAuth } from "@/contexts/AuthContext";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import DocumentService from "@/services/documentService";
import { toast } from "sonner";
import { saveSummaryToFirebase } from "@/services/firebaseSummaryService";
import { fetchUserSummaries } from "@/services/firebaseFetchSummaries";

const Dashboard = () => {
  const { user, loading } = useAuth();
  const { logout } = useFirebaseAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("home");
  const [dragActive, setDragActive] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [processingResult, setProcessingResult] = useState<any>(null);
  const [aiSummary, setAiSummary] = useState<null | { summary: string; highlightedClauses: { clause: string; explanation: string }[] }>(null);
  const [summarizing, setSummarizing] = useState(false);
  const [userSummaries, setUserSummaries] = useState<any[]>([]);

  useEffect(() => {
    async function loadSummaries() {
      if (user?.uid) {
        const summaries = await fetchUserSummaries(user.uid);
        setUserSummaries(summaries);
      }
    }
    loadSummaries();
  }, [user]);

  // Redirect to auth page if user is not signed in
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handleTabChange = (tabId: string) => {
    if (tabId === activeTab) return;
    if (tabId === "settings") {
      navigate("/profile");
      return;
    }
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveTab(tabId);
      setIsTransitioning(false);
    }, 150);
  };

  const handleFileUpload = async (file?: File) => {
    if (!file) return;
    setUploadingFile(true);
    setProcessingResult(null);
    setAiSummary(null);
    try {
      toast.info(`Processing ${file.name}...`);
      const extractedText = await DocumentService.extractTextFromFile(file);
      // Directly summarize using Gemini API
      const result = await DocumentService.summarizeLegalDocument(extractedText);
      setAiSummary(result);
      setProcessingResult({ filename: file.name });

      // Save summary to Firebase
      if (user?.uid) {
        // For demo, riskTag is always "low risk". You can set logic to determine risk.
        const riskTag: "high risk" | "low risk" = "low risk";
        await saveSummaryToFirebase(user.uid, file.name, result.summary, riskTag);
      }

      toast.success(`Successfully processed and summarized ${file.name}!`);
      setActiveTab("results");
    } catch (error) {
      console.error('Document processing error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process document');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if user is not authenticated (will redirect)
  if (!user) {
    return null;
  }

  const sidebarItems = [
  { id: "home", label: "Home", icon: Home },
  { id: "documents", label: "My Documents", icon: FolderOpen },
  { id: "results", label: "Processing Results", icon: BookOpen },
  { id: "settings", label: "Settings", icon: Settings },
  ];

  const recentDocuments = [
    // Deprecated: replaced by userSummaries
  ];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleSummarizeWithAI = async () => {
    if (!processingResult?.extractedText) return;
    setSummarizing(true);
    setAiSummary(null);
    try {
      const result = await DocumentService.summarizeLegalDocument(processingResult.extractedText);
      setAiSummary(result);
    } catch (err) {
      toast.error("AI summarization failed");
    } finally {
      setSummarizing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-64 lg:bg-card lg:border-r lg:border-border sidebar-desktop">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-hover rounded-lg flex items-center justify-center icon-bounce">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">LegalAI</span>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {sidebarItems.map((item) => (
            <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 btn-animated ${
                activeTab === item.id
                  ? "bg-primary text-primary-foreground shadow-lg scale-105"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <item.icon className="w-5 h-5 icon-bounce" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="absolute bottom-6 left-4 right-4">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-muted-foreground btn-animated"
            onClick={() => navigate("/")}
          >
            <LogOut className="mr-3 w-5 h-5 icon-bounce" />
            Back to Home
          </Button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border navbar-mobile">
        <div className="grid grid-cols-5 h-16">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`flex flex-col items-center justify-center space-y-1 transition-all duration-300 btn-animated ${
                activeTab === item.id
                  ? "text-primary bg-primary/10 scale-105"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              <item.icon className="w-5 h-5 icon-bounce" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen pb-16 lg:pb-0">
        <header className="bg-card border-b border-border p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-foreground">Dashboard</h1>
                <p className="text-sm lg:text-base text-muted-foreground hidden sm:block">
                  Welcome back, {user?.displayName || user?.email || 'User'}!
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 lg:space-x-4">
              <ThemeToggle />
              <div className="relative hidden md:block">
                <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <input
                  placeholder="Search documents..."
                  className="pl-10 pr-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary w-48 lg:w-64"
                />
              </div>
              <Button className="btn-hero text-sm lg:text-base px-3 lg:px-6 btn-animated">
                <Plus className="mr-1 lg:mr-2 w-4 h-4 icon-bounce" />
                <span className="hidden sm:inline">New Analysis</span>
                <span className="sm:hidden">New</span>
              </Button>
              <ProfileAvatar user={user} />
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-6 space-y-6 lg:space-y-8">
          {activeTab === "home" && (
            <>
              {/* Upload Zone */}
              <Card className="card-elevated">
                <div className="p-6 lg:p-8">
                  <div className="text-center space-y-4 mb-6">
                    <h2 className="text-lg lg:text-xl font-semibold text-foreground">
                      Upload Legal Document
                    </h2>
                    <p className="text-sm lg:text-base text-muted-foreground">
                      Drag & drop your PDF or DOCX files for AI-powered analysis
                    </p>
                  </div>

                  <div
                    className={`upload-zone p-8 lg:p-12 text-center cursor-pointer ${
                      dragActive ? "drag-over" : ""
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <Upload className={`w-10 h-10 lg:w-12 lg:h-12 text-muted-foreground mx-auto mb-4 icon-bounce ${uploadingFile ? 'animate-spin' : ''}`} />
                    <p className="text-base lg:text-lg font-medium text-foreground mb-2">
                      {uploadingFile ? "Uploading..." : "Drop files here or click to browse"}
                    </p>
                    <p className="text-xs lg:text-sm text-muted-foreground mb-6">
                      Supports PDF, DOCX files up to 10MB
                    </p>
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      accept=".pdf,.png,.jpg,.jpeg,.tiff,.gif"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(file);
                        }
                      }}
                      disabled={uploadingFile}
                    />
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className={`w-full sm:w-auto upload-btn-animated btn-animated ${uploadingFile ? 'btn-pulse' : ''}`}
                      onClick={() => document.getElementById('file-upload')?.click()}
                      disabled={uploadingFile}
                    >
                      <Upload className="mr-2 w-4 h-4 icon-bounce" />
                      {uploadingFile ? "Processing..." : "Choose Files"}
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Recent Documents */}
              <Card className="card-elevated">
                <div className="p-4 lg:p-6 border-b border-border">
                  <h3 className="text-base lg:text-lg font-semibold text-foreground">Recent Documents</h3>
                </div>
                <div className="p-4 lg:p-6 space-y-4">
                  {userSummaries.slice(-3).reverse().map((doc, index) => (
                    <div
                      key={doc.id}
                      className="document-card flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-xl bg-secondary/20 hover:bg-secondary/40 transition-all duration-300 cursor-pointer space-y-3 sm:space-y-0"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 icon-bounce">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground text-sm lg:text-base">{doc.fileName}</h4>
                          <p className="text-xs lg:text-sm text-muted-foreground">{doc.createdAt ? new Date(doc.createdAt).toLocaleString() : ""}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 self-start sm:self-center">
                        <Badge 
                          variant={doc.riskTag === "low risk" ? "secondary" : "destructive"}
                          className="capitalize text-xs btn-animated"
                        >
                          {doc.riskTag}
                        </Badge>
                        <Badge variant="secondary" className="text-xs btn-animated">
                          Analyzed
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Quick Actions */}
              {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {[
                  {
                    title: "AI Summary",
                    description: "Get instant plain-language summaries",
                    icon: <BookOpen className="w-6 h-6 text-primary" />,
                    action: "View Summaries"
                  },
                  {
                    title: "Document Chat",
                    description: "Ask questions about your documents",
                    icon: <MessageSquare className="w-6 h-6 text-accent" />,
                    action: "Start Chat"
                  },
                  {
                    title: "Risk Analysis",
                    description: "Identify potential legal risks",
                    icon: <FileText className="w-6 h-6 text-destructive" />,
                    action: "Analyze Risks"
                  }
                ].map((action, index) => (
                  <Card key={index} className="card-elevated interactive-lift cursor-pointer btn-animated" style={{ animationDelay: `${index * 150}ms` }}>
                    <div className="p-4 lg:p-6 text-center space-y-4">
                      <div className="flex justify-center icon-bounce">
                        {action.icon}
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground mb-2 text-sm lg:text-base">{action.title}</h4>
                        <p className="text-xs lg:text-sm text-muted-foreground mb-4">{action.description}</p>
                        <Button variant="outline" size="sm" className="w-full text-xs lg:text-sm btn-animated">
                          {action.action}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div> */}
            </>
          )}

          {activeTab === "documents" && (
            <div className="page-enter">
              {/* Documents Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div>
                  <h2 className="text-xl lg:text-2xl font-bold text-foreground">My Documents</h2>
                  <p className="text-sm lg:text-base text-muted-foreground">Manage and analyze your legal documents</p>
                </div>
                <Button className="btn-hero w-full sm:w-auto text-sm lg:text-base px-4 lg:px-6 btn-animated">
                  <Plus className="mr-2 w-4 h-4 icon-bounce" />
                  <span className="hidden sm:inline">Upload New Document</span>
                  <span className="sm:hidden">Upload Document</span>
                </Button>
              </div>

              {/* Document Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
                {(() => {
                  const total = userSummaries.length;
                  const analyzed = total; // All are analyzed
                  const highRisk = userSummaries.filter(doc => doc.riskTag === "high risk").length;
                  const lowRisk = userSummaries.filter(doc => doc.riskTag === "low risk").length;
                  return [
                    { label: "Total Documents", value: total, icon: <FileText className="w-4 h-4 lg:w-5 lg:h-5" />, color: "primary" },
                    { label: "Analyzed", value: analyzed, icon: <BookOpen className="w-4 h-4 lg:w-5 lg:h-5" />, color: "accent" },
                    { label: "High Risk", value: highRisk, icon: <FileText className="w-4 h-4 lg:w-5 lg:h-5 text-destructive" />, color: "destructive" },
                    { label: "Low Risk", value: lowRisk, icon: <FileText className="w-4 h-4 lg:w-5 lg:h-5 text-secondary" />, color: "secondary" },
                  ].map((stat, index) => (
                    <Card key={index} className="card-elevated p-4 lg:p-6 stats-card" style={{ animationDelay: `${index * 100}ms` }}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs lg:text-sm text-muted-foreground">{stat.label}</p>
                          <p className="text-lg lg:text-2xl font-bold text-foreground">{stat.value}</p>
                        </div>
                        <div className={`p-2 lg:p-3 rounded-xl bg-${stat.color}/10 icon-bounce`}>
                          <div className={`text-${stat.color}">`}>{stat.icon}</div>
                        </div>
                      </div>
                    </Card>
                  ));
                })()}
              </div>

              {/* All Documents */}
              <Card className="card-elevated">
                <div className="p-4 lg:p-6 border-b border-border">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                    <h3 className="text-base lg:text-lg font-semibold text-foreground">All Documents</h3>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" className="text-xs lg:text-sm">Filter</Button>
                      <Button variant="outline" size="sm" className="text-xs lg:text-sm">Sort</Button>
                    </div>
                  </div>
                </div>
                <div className="p-4 lg:p-6">
                  <div className="grid gap-3 lg:gap-4">
                    {userSummaries.slice().reverse().map((doc, index) => (
                      <div
                        key={doc.id}
                        className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-4 rounded-xl bg-secondary/20 hover:bg-secondary/40 transition-colors interactive-scale cursor-pointer group space-y-3 lg:space-y-0"
                      >
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="w-10 h-10 lg:w-12 lg:h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 lg:w-6 lg:h-6 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-foreground group-hover:text-primary transition-colors text-sm lg:text-base truncate">{doc.fileName}</h4>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mt-1 space-y-1 sm:space-y-0">
                              <p className="text-xs lg:text-sm text-muted-foreground">{doc.createdAt ? new Date(doc.createdAt).toLocaleString() : ""}</p>
                              <div className="flex items-center space-x-2">
                                <Badge 
                                  variant={doc.riskTag === "low risk" ? "secondary" : "destructive"}
                                  className="capitalize text-xs"
                                >
                                  {doc.riskTag}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  Analyzed
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="sm" className="text-xs lg:text-sm">View</Button>
                          <Button variant="ghost" size="sm" className="text-xs lg:text-sm hidden sm:inline-flex">Download</Button>
                          <Button variant="ghost" size="sm" className="text-xs lg:text-sm hidden sm:inline-flex">Delete</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Processing Results Tab */}
          {activeTab === "results" && (
            <div className="page-enter">
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                  <div>
                    <h2 className="text-xl lg:text-2xl font-bold text-foreground">Processing Results</h2>
                    <p className="text-sm lg:text-base text-muted-foreground">
                      {processingResult ? `Results for ${processingResult.filename}` : "No documents processed yet"}
                    </p>
                  </div>
                </div>

                {processingResult ? (
                  <div className="space-y-6">
                    {/* Only show AI Summary Section */}
                    {aiSummary && (
                      <Card className="card-elevated mt-6 relative">
                        {/* Floating Download Button */}
                        <button
                          onClick={() => {
                            // Download summary as PDF with proper wrapping and page breaks
                            const doc = new jsPDF();
                            const pageWidth = doc.internal.pageSize.getWidth();
                            const pageHeight = doc.internal.pageSize.getHeight();
                            const margin = 15;
                            const lineHeight = 10;
                            let y = margin;

                            // Title
                            doc.setFontSize(16);
                            doc.text('AI Summary', margin, y);
                            y += lineHeight * 2;

                            // Summary
                            doc.setFontSize(12);
                            const summaryLines = doc.splitTextToSize(aiSummary.summary, pageWidth - margin * 2);
                            summaryLines.forEach(line => {
                              if (y + lineHeight > pageHeight - margin) {
                                doc.addPage();
                                y = margin;
                              }
                              doc.text(line, margin, y);
                              y += lineHeight;
                            });

                            y += lineHeight;
                            doc.setFontSize(14);
                            doc.text('Highlighted Clauses', margin, y);
                            y += lineHeight * 1.5;

                            doc.setFontSize(12);
                            aiSummary.highlightedClauses.forEach((c, i) => {
                              const clauseText = `${i + 1}. ${c.clause}: ${c.explanation}`;
                              const clauseLines = doc.splitTextToSize(clauseText, pageWidth - margin * 2);
                              clauseLines.forEach(line => {
                                if (y + lineHeight > pageHeight - margin) {
                                  doc.addPage();
                                  y = margin;
                                }
                                doc.text(line, margin, y);
                                y += lineHeight;
                              });
                              y += lineHeight * 0.5;
                            });

                            doc.save(`${processingResult?.filename || 'summary'}.pdf`);
                          }}
                          className="absolute top-4 right-4 z-20 bg-primary text-primary-foreground rounded-full shadow-lg p-2 hover:bg-primary/80 transition"
                          title="Download PDF"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 16v-8m0 8l-4-4m4 4l4-4M4 20h16" /></svg>
                        </button>
                        <div className="p-4 lg:p-6 border-b border-border">
                          <h3 className="text-base lg:text-lg font-semibold text-foreground">AI Summary</h3>
                        </div>
                        <div className="p-4 lg:p-6">
                          <p className="text-base whitespace-pre-wrap mb-4">{aiSummary.summary}</p>
                          <h4 className="font-semibold mb-2">Highlighted Clauses</h4>
                          <ul className="space-y-2">
                            {aiSummary.highlightedClauses.map((c, i) => (
                              <li key={i} className="bg-secondary/10 rounded p-2">
                                <strong>{c.clause}</strong>: {c.explanation}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </Card>
                    )}

                    {/* Entities */}
                    {processingResult.entities && processingResult.entities.length > 0 && (
                      <Card className="card-elevated">
                        <div className="p-4 lg:p-6 border-b border-border">
                          <h3 className="text-base lg:text-lg font-semibold text-foreground">Detected Entities</h3>
                        </div>
                        <div className="p-4 lg:p-6">
                          <div className="grid gap-3">
                            {processingResult.entities.map((entity: any, index: number) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg">
                                <div>
                                  <p className="font-medium">{entity.text}</p>
                                  <p className="text-sm text-muted-foreground">{entity.type}</p>
                                </div>
                                <Badge variant="secondary">
                                  {Math.round(entity.confidence * 100)}%
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      </Card>
                    )}

                    {/* Tables */}
                    {processingResult.tables && processingResult.tables.length > 0 && (
                      <Card className="card-elevated">
                        <div className="p-4 lg:p-6 border-b border-border">
                          <h3 className="text-base lg:text-lg font-semibold text-foreground">Detected Tables</h3>
                        </div>
                        <div className="p-4 lg:p-6">
                          <div className="space-y-4">
                            {processingResult.tables.map((table: any, tableIndex: number) => (
                              <div key={tableIndex} className="bg-secondary/20 rounded-lg p-4">
                                <h4 className="font-medium mb-3">Table {table.tableIndex} (Page {table.pageIndex})</h4>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-sm">
                                    <tbody>
                                      {table.rows.map((row: string[], rowIndex: number) => (
                                        <tr key={rowIndex}>
                                          {row.map((cell: string, cellIndex: number) => (
                                            <td key={cellIndex} className="border border-border/50 px-2 py-1">
                                              {cell}
                                            </td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>
                ) : (
                  <Card className="card-elevated p-6 lg:p-8 text-center">
                    <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Results Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Upload a document to see processing results here.
                    </p>
                    <Button onClick={() => setActiveTab("home")} className="btn-hero">
                      Upload Document
                    </Button>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* Other tab contents can be added here */}
          {activeTab !== "home" && activeTab !== "documents" && activeTab !== "results" && (
            <Card className="card-elevated p-6 lg:p-8 text-center">
              <h2 className="text-lg lg:text-xl font-semibold text-foreground mb-4">Coming Soon</h2>
              <p className="text-sm lg:text-base text-muted-foreground">This feature is under development.</p>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;