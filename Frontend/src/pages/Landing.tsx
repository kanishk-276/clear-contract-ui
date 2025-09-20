import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Shield, Zap, FileText, MessageSquare, Upload } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/contexts/AuthContext";
import heroImage from "@/assets/hero-legal-ai.jpg";

const Landing = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const handleUploadDocument = () => {
    if (user) {
      // User is signed in, redirect to dashboard
      navigate("/dashboard");
    } else {
      // User is not signed in, redirect to auth page
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Navigation */}
      <nav className="border-b border-border/20 bg-background/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-hover rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">LegalAI</span>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4 mt-2 sm:mt-0">
            <ThemeToggle />
            <Link to="/auth">
              <Button variant="ghost" className="font-medium w-full sm:w-auto">
                Sign In
              </Button>
            </Link>
            <Button 
              className="btn-hero w-full sm:w-auto"
              onClick={handleUploadDocument}
              disabled={loading}
            >
              Get Started
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-12 sm:py-20 px-4 sm:px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="space-y-8 animate-fade-in">
              <div className="space-y-6">
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                  Demystify Legal Documents with{" "}
                  <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    AI
                  </span>
                </h1>
                <p className="text-base sm:text-xl text-muted-foreground leading-relaxed">
                  Transform complex legal documents into clear, understandable language. 
                  Get instant AI-powered analysis, summaries, and insights you can trust.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="btn-hero w-full sm:w-auto"
                  onClick={handleUploadDocument}
                  disabled={loading}
                >
                  <Upload className="mr-2 w-5 h-5" />
                  Upload Document
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="btn-secondary-outline w-full sm:w-auto"
                >
                  Watch Demo
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-6 pt-4">
                <div className="flex items-center space-x-2 text-accent">
                  <Shield className="w-5 h-5" />
                  <span className="text-sm font-medium">Bank-grade Security</span>
                </div>
                <div className="flex items-center space-x-2 text-accent">
                  <Zap className="w-5 h-5" />
                  <span className="text-sm font-medium">Instant Analysis</span>
                </div>
              </div>
            </div>

            <div className="relative animate-scale-in mt-8 lg:mt-0">
              <div className="card-hero">
                <img 
                  src={heroImage} 
                  alt="AI-powered legal document analysis" 
                  className="w-full h-auto rounded-2xl object-cover max-h-[320px] sm:max-h-[400px] lg:max-h-[500px]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 bg-gradient-to-b from-muted to-secondary/20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-6 mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-bold text-foreground">
              Powerful AI Legal Analysis
            </h2>
            <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Our advanced AI breaks down complex legal language into plain English, 
              highlighting key terms and potential risks.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                icon: <FileText className="w-8 h-8 text-primary" />,
                title: "Document Upload",
                description: "Drag & drop PDF or DOCX files for instant AI analysis"
              },
              {
                icon: <Zap className="w-8 h-8 text-accent" />,
                title: "Instant Summary",
                description: "Get plain-language summaries of complex legal documents"
              },
              {
                icon: <MessageSquare className="w-8 h-8 text-primary" />,
                title: "AI Chat Assistant", 
                description: "Ask questions about your documents and get instant answers"
              }
            ].map((feature, index) => (
              <Card 
                key={index} 
                className="card-elevated p-6 sm:p-8 text-center interactive-lift"
              >
                <div className="mb-4 flex justify-center">
                  {feature.icon}
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-20 px-4 sm:px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <Card className="card-hero">
            <div className="space-y-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                Ready to Simplify Legal Documents?
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground">
                Join thousands of professionals who trust LegalAI for clear, 
                reliable legal document analysis.
              </p>
              <Button 
                size="lg" 
                className="btn-hero w-full sm:w-auto"
                onClick={handleUploadDocument}
                disabled={loading}
              >
                Start Analyzing Documents
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 sm:py-12 px-4 sm:px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-br from-primary to-primary-hover rounded-md flex items-center justify-center">
                <FileText className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">LegalAI</span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
              © 2024 LegalAI. Transforming legal documents with AI.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;