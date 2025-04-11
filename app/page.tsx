"use client"

import React from 'react';
import { useState, useRef, useEffect } from "react"
import { Bell, Search, Clock, X, ThumbsUp, ThumbsDown, Copy, Send, Paperclip, Mic, Image, Globe, Save, Settings2, User, Mail, Lock, LogOut, Sun, Moon, Code, MessageSquare, Plus, Menu } from "lucide-react"

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatHistory {
  id: string;
  title: string;
  messages: Message[];
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  timestamp: Date;
}

export default function AIChatHelper() {
  const [activeTab, setActiveTab] = useState("JS")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState("en")
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isLogin, setIsLogin] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [showHistory, setShowHistory] = useState(false)
  const [chatHistories, setChatHistories] = useState<ChatHistory[]>([])
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') as 'light' | 'dark' || 'light';
    }
    return 'light';
  });
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    avatar: "U"
  })
  const [authData, setAuthData] = useState({
    email: "",
    password: "",
    name: ""
  })
  const [currentChatId, setCurrentChatId] = useState<string>(Date.now().toString())
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Theme effect
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Load chat histories from localStorage on component mount
  useEffect(() => {
    const savedHistories = localStorage.getItem('chatHistories');
    if (savedHistories) {
      setChatHistories(JSON.parse(savedHistories));
    }
  }, []);

  // Save chat histories to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('chatHistories', JSON.stringify(chatHistories));
  }, [chatHistories]);

  // Save current chat to history when messages change
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant') {
        const title = messages[0].content.slice(0, 30) + (messages[0].content.length > 30 ? '...' : '');
        const newHistory: ChatHistory = {
          id: Date.now().toString(),
          title,
          messages: [...messages],
          timestamp: new Date()
        };
        setChatHistories(prev => [newHistory, ...prev]);
      }
    }
  }, [messages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsProcessing(true);

    try {
      console.log("Sending message to Flask backend...");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://verseo-backend.onrender.com';
      const response = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          message: inputMessage
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Response from Flask backend:", data);

      if (!data.response) {
        throw new Error('Invalid response format from server');
      }
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      // Add error message to chat
      const errorMessage: Message = {
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to process request'}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)
    try {
      // Here you would typically make an API call to your authentication endpoint
      console.log("Auth data:", authData)
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Set user data and logged in state
      setUserData({
        name: authData.name || "User",
        email: authData.email,
        avatar: authData.name?.[0]?.toUpperCase() || "U"
      })
      setIsLoggedIn(true)
      setShowAuthModal(false)
      // Reset form
      setAuthData({ email: "", password: "", name: "" })
    } catch (error) {
      console.error("Authentication error:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setUserData({ name: "", email: "", avatar: "U" })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setAuthData(prev => ({ ...prev, [name]: value }))
  }

  const loadChatHistory = (history: ChatHistory) => {
    setMessages(history.messages);
    setShowHistory(false);
  };

  const deleteChatHistory = (id: string) => {
    setChatHistories(prev => prev.filter(history => history.id !== id));
  };

  const createNewChat = () => {
    // Save current chat if it has messages
    if (messages.length > 0) {
      const title = messages[0].content.slice(0, 30) + (messages[0].content.length > 30 ? '...' : '');
      const currentChat: ChatSession = {
        id: currentChatId,
        title,
        messages: [...messages],
        timestamp: new Date()
      };
      setChatSessions(prev => [currentChat, ...prev]);
    }
    
    // Clear messages and create new chat ID
    setMessages([]);
    setCurrentChatId(Date.now().toString());
  };

  const loadChatSession = (session: ChatSession) => {
    setMessages(session.messages);
    setCurrentChatId(session.id);
    setShowHistory(false);
  };

  const deleteChatSession = (id: string) => {
    setChatSessions(prev => prev.filter(session => session.id !== id));
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-background">
      {/* Mobile Menu Button - Only visible on mobile */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 text-muted-foreground hover:text-foreground p-2 hover:bg-muted/50 rounded-xl transition-all duration-200"
      >
        <Menu size={24} />
      </button>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card rounded-xl p-6 w-96 border border-border/50 shadow-lg shadow-primary/5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-foreground font-semibold text-lg">
                {isLogin ? "Welcome back" : "Create an account"}
              </h2>
              <button 
                onClick={() => setShowAuthModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-sm text-foreground/80">Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                    <input
                      type="text"
                      name="name"
                      value={authData.name}
                      onChange={handleInputChange}
                      placeholder="Enter your name"
                      className="w-full bg-muted/50 text-foreground text-sm rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200 placeholder:text-muted-foreground"
                      required={!isLogin}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm text-foreground/80">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                  <input
                    type="email"
                    name="email"
                    value={authData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    className="w-full bg-muted/50 text-foreground text-sm rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200 placeholder:text-muted-foreground"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-foreground/80">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                  <input
                    type="password"
                    name="password"
                    value={authData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    className="w-full bg-muted/50 text-foreground text-sm rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200 placeholder:text-muted-foreground"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-primary to-secondary text-white rounded-xl py-2.5 text-sm font-medium hover:shadow-lg hover:shadow-primary/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? "Processing..." : (isLogin ? "Login" : "Sign Up")}
              </button>

              <div className="text-center text-sm text-muted-foreground">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  {isLogin ? "Sign Up" : "Login"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sidebar - Hidden on mobile by default */}
      <aside
        className={`fixed lg:relative bg-card border-r border-border ${
          sidebarCollapsed ? "w-16" : "w-64"
        } flex flex-col transition-all duration-300 h-full z-50 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Close button for mobile menu */}
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="lg:hidden absolute top-4 right-4 text-muted-foreground hover:text-foreground p-2 hover:bg-muted/50 rounded-xl transition-all duration-200"
        >
          <X size={20} />
        </button>

        <div className="p-4 flex items-center gap-3 border-b border-border">
          <div className="bg-gradient-to-br from-primary to-secondary h-8 w-8 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-white font-bold text-sm">V</span>
          </div>
          {!sidebarCollapsed && <span className="text-foreground font-semibold text-lg tracking-tight">Verseo</span>}
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)} 
            className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? "→" : "←"}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
          <NavItem
            icon={
              <div className="w-6 h-6 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                AI
              </div>
            }
            label="AI Chat Helper"
            active={true}
            collapsed={sidebarCollapsed}
          />
          <NavItem
            icon={<div className="w-6 h-6 text-destructive opacity-90">□</div>}
            label="Templates"
            badge="Pro"
            collapsed={sidebarCollapsed}
          />
          <NavItem
            icon={<div className="w-6 h-6 text-emerald-500 opacity-90">□</div>}
            label="My projects"
            badge="Pro"
            collapsed={sidebarCollapsed}
          />
          <NavItem
            icon={<div className="w-6 h-6 text-emerald-500 opacity-90">□</div>}
            label="Statistics"
            badge="Pro"
            collapsed={sidebarCollapsed}
          />
          <NavItem
            icon={<div className="w-6 h-6 text-amber-500 opacity-90">⚙</div>}
            label="Settings"
            collapsed={sidebarCollapsed}
          />
          <NavItem
            icon={<div className="w-6 h-6 text-secondary opacity-90">?</div>}
            label="Updates & FAQ"
            collapsed={sidebarCollapsed}
          />
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border/50 space-y-3">
          <div className="bg-gradient-to-r from-primary to-secondary rounded-xl p-4 relative shadow-lg shadow-primary/20">
            <button className="absolute top-2 right-2 text-white/70 hover:text-white transition-colors">
              <X size={14} />
            </button>
            <h3 className="text-white font-semibold text-sm mb-1">Pro Plan</h3>
            <p className="text-white/80 text-xs mb-2">Strengthen artificial intelligence: get plan!</p>
            <div className="text-white font-semibold text-sm mb-2">$10 / mo</div>
            <button className="w-full bg-white hover:bg-gray-50 text-primary rounded-lg py-1.5 text-sm font-medium transition-colors shadow-md">
              Get PRO
            </button>
          </div>

          {isLoggedIn ? (
            <div className="space-y-3">
              {/* User Profile */}
              <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white font-medium">
                  {userData.avatar}
                </div>
                {!sidebarCollapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="text-foreground font-medium text-sm truncate">{userData.name}</div>
                    <div className="text-muted-foreground text-xs truncate">{userData.email}</div>
                  </div>
                )}
              </div>

              {/* Logout Button */}
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 text-destructive hover:bg-destructive/10 rounded-xl p-2 text-sm font-medium transition-all duration-200"
              >
                <LogOut size={16} />
                {!sidebarCollapsed && <span>Logout</span>}
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  setIsLogin(true)
                  setShowAuthModal(true)
                }}
                className="flex-1 flex items-center justify-center gap-2 text-foreground bg-gradient-to-r from-primary/10 to-secondary/10 hover:from-primary/20 hover:to-secondary/20 rounded-xl p-2 text-sm font-medium transition-all duration-200"
              >
                <span>Login</span>
              </button>
              <button 
                onClick={() => {
                  setIsLogin(false)
                  setShowAuthModal(true)
                }}
                className="flex-1 flex items-center justify-center gap-2 text-white bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/20 rounded-xl p-2 text-sm font-medium transition-all duration-200"
              >
                <span>Sign Up</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Backdrop for mobile menu */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-background h-full">
        {/* Header */}
        <header className="border-b border-border p-4 flex items-center bg-card">
          <div className="flex items-center gap-3 ml-8 lg:ml-0">
            <h1 className="text-foreground font-medium text-sm">AI Chat Helper</h1>
            <button
              onClick={createNewChat}
              className="flex items-center gap-2 text-sm bg-gradient-to-r from-primary to-secondary text-white px-3 py-1.5 rounded-lg hover:shadow-lg hover:shadow-primary/20 transition-all duration-200"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          </div>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <div className="relative group hidden sm:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground group-hover:text-primary transition-colors" size={16} />
              <input
                type="text"
                placeholder="Search"
                className="bg-muted text-foreground text-sm rounded-lg pl-9 pr-3 py-1.5 w-56 focus:outline-none focus:ring-2 focus:ring-primary transition-all placeholder:text-muted-foreground"
              />
            </div>
            <button 
              onClick={toggleTheme}
              className="text-muted-foreground hover:text-foreground transition-colors p-1.5 hover:bg-muted rounded-lg"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button className="text-muted-foreground hover:text-foreground transition-colors p-1.5 hover:bg-muted rounded-lg sm:block hidden">
              <Bell size={18} />
            </button>
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm p-1.5 hover:bg-muted rounded-lg transition-colors"
            >
              <Clock size={18} />
              <span className="hidden sm:inline">History</span>
            </button>
            <span className="text-muted-foreground text-sm bg-muted px-2 py-0.5 rounded-lg hidden sm:block">6/50</span>
          </div>
        </header>

        {/* Chat History Panel */}
        <div className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-card border-l border-border transform transition-transform duration-300 ease-in-out z-40 ${
          showHistory ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="text-foreground font-medium">Chat History</h2>
            <button 
              onClick={() => setShowHistory(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <div className="overflow-y-auto h-[calc(100%-4rem)]">
            {chatSessions.map(session => (
              <div 
                key={session.id}
                className="p-4 border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div 
                    onClick={() => loadChatSession(session)}
                    className="flex-1 min-w-0"
                  >
                    <h3 className="text-foreground font-medium text-sm truncate">{session.title}</h3>
                    <p className="text-muted-foreground text-xs">
                      {session.timestamp.toLocaleDateString()} {session.timestamp.toLocaleTimeString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {session.messages.length} messages
                    </p>
                  </div>
                  <button
                    onClick={() => deleteChatSession(session.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive/80"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
            {chatSessions.length === 0 && (
              <div className="p-4 text-center text-muted-foreground">
                No chat history available
              </div>
            )}
          </div>
        </div>

        {/* Chat Content */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4 sm:p-8">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center mb-4">
                <div className="text-white text-2xl font-bold">AI</div>
              </div>
              <h2 className="text-foreground text-xl font-semibold mb-2 animate-fadeIn">Welcome to AI Chat Helper</h2>
              <div className="overflow-hidden">
                <p className="text-muted-foreground max-w-md mb-6 animate-slideIn">
                  Start a conversation by typing a message below. I can help you with coding, answer questions, or just chat!
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
                <div className="bg-card p-4 rounded-lg border border-border/50 hover:border-primary/30 transition-colors cursor-pointer group">
                  <div className="text-primary mb-2 group-hover:text-primary/80 transition-colors">
                    <Code size={24} />
                  </div>
                  <h3 className="text-foreground font-medium mb-1">Code Assistance</h3>
                  <p className="text-muted-foreground text-sm">
                    Get help with coding problems, debugging, or learning new concepts.
                  </p>
                </div>
                <div className="bg-card p-4 rounded-lg border border-border/50 hover:border-primary/30 transition-colors cursor-pointer group">
                  <div className="text-primary mb-2 group-hover:text-primary/80 transition-colors">
                    <MessageSquare size={24} />
                  </div>
                  <h3 className="text-foreground font-medium mb-1">General Chat</h3>
                  <p className="text-muted-foreground text-sm">
                    Ask questions, get explanations, or just have a friendly conversation.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div key={index} className={`flex gap-2 sm:gap-4 ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
                <div className={`flex max-w-[90%] sm:max-w-[80%] ${message.role === 'assistant' ? 'flex-row' : 'flex-row-reverse'}`}>
                  <div className={`flex-shrink-0 ${message.role === 'assistant' ? 'mr-2 sm:mr-4' : 'ml-2 sm:ml-4'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      message.role === 'user' 
                        ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/20' 
                        : 'bg-gradient-to-br from-violet-400 to-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    }`}>
                      {message.role === 'user' ? userData.avatar : 'AI'}
                    </div>
                  </div>
                  <div className="space-y-1 w-full">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground/80">
                        {message.role === 'user' ? userData.name || 'You' : 'AI Assistant'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className={`rounded-2xl px-4 py-3 shadow-sm ${
                      message.role === 'assistant'
                        ? 'bg-card border border-border/50'
                        : 'bg-gradient-to-r from-primary/10 to-secondary/10'
                    }`}>
                      <div className="space-y-3">
                        {message.content.split('```').map((part, index) => {
                          if (index % 2 === 0) {
                            return (
                              <div key={index} className="text-foreground text-sm whitespace-pre-wrap">
                                {part}
                              </div>
                            );
                          } else {
                            const [language, ...codeParts] = part.split('\n');
                            const code = codeParts.join('\n');
                            return (
                              <div key={index} className="relative group rounded-xl overflow-hidden">
                                <pre className="bg-muted/50 p-4 text-sm font-mono overflow-x-auto">
                                  <code className="text-foreground">
                                    {code}
                                  </code>
                                </pre>
                                <button 
                                  onClick={() => navigator.clipboard.writeText(code)}
                                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 p-1.5 rounded-lg hover:bg-background text-foreground/80 hover:text-foreground"
                                >
                                  <Copy size={14} />
                                </button>
                              </div>
                            );
                          }
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          {isProcessing && (
            <div className="flex gap-4">
              <div className="flex max-w-[80%] flex-row">
                <div className="flex-shrink-0 mr-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-violet-400 to-indigo-600 text-white shadow-lg shadow-indigo-500/20">
                    AI
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground/80">
                      AI Assistant
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="rounded-2xl px-4 py-3 shadow-sm bg-card border border-border/50">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-primary/40 animate-[pulse_1s_ease-in-out_infinite]"></div>
                        <div className="w-2 h-2 rounded-full bg-primary/40 animate-[pulse_1s_ease-in-out_infinite_200ms]"></div>
                        <div className="w-2 h-2 rounded-full bg-primary/40 animate-[pulse_1s_ease-in-out_infinite_400ms]"></div>
                      </div>
                      <span className="text-sm text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="border-t border-border/50 p-2 sm:p-4 bg-card">
          <div className="flex items-center gap-2 sm:gap-3 mb-3">
            <div className="flex items-center gap-1 sm:gap-2">
              <button className="text-muted-foreground hover:text-foreground p-1.5 sm:p-2 hover:bg-muted/50 rounded-xl transition-all duration-200 hidden sm:block">
                <Paperclip size={18} />
              </button>
              <button className="text-muted-foreground hover:text-foreground p-1.5 sm:p-2 hover:bg-muted/50 rounded-xl transition-all duration-200 hidden sm:block">
                <Image size={18} />
              </button>
              <button className="text-muted-foreground hover:text-foreground p-1.5 sm:p-2 hover:bg-muted/50 rounded-xl transition-all duration-200">
                <Mic size={18} />
              </button>
            </div>
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your message..."
                  className="w-full bg-muted/50 text-foreground text-sm rounded-xl pl-4 pr-12 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200 placeholder:text-muted-foreground"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1.5">
                  <button className="text-muted-foreground hover:text-foreground p-1.5 hover:bg-muted/50 rounded-lg transition-all duration-200 hidden sm:block">
                    <Globe size={16} />
                  </button>
                  <button className="text-muted-foreground hover:text-foreground p-1.5 hover:bg-muted/50 rounded-lg transition-all duration-200 hidden sm:block">
                    <Settings2 size={16} />
                  </button>
                  <button className="text-muted-foreground hover:text-foreground p-1.5 hover:bg-muted/50 rounded-lg transition-all duration-200 hidden sm:block">
                    <Save size={16} />
                  </button>
                </div>
              </div>
            </div>
            <button 
              onClick={handleSendMessage}
              disabled={isProcessing || !inputMessage.trim()}
              className="text-white bg-gradient-to-r from-primary to-secondary rounded-xl p-2 sm:p-2.5 hover:shadow-lg hover:shadow-primary/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={18} />
            </button>
          </div>
          <div className="flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline">Language: English</span>
              <span className="hidden sm:inline">•</span>
              <span>AI Persona: Professional</span>
            </div>
            <div className="text-center text-[10px] sm:text-xs">
              <span className="hidden sm:inline">Free Research Preview.</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary"> ChatGPT May 12 Version</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function NavItem({ icon, label, active = false, badge, collapsed }: { icon: React.ReactNode, label: string, active?: boolean, badge?: string, collapsed: boolean }) {
  return (
    <div className={`flex items-center gap-2 rounded-xl p-2.5 transition-all duration-200 ${
      active 
        ? "bg-gradient-to-r from-primary/10 to-secondary/10 text-foreground shadow-lg shadow-primary/5" 
        : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
    }`}>
      <div className="flex-shrink-0">{icon}</div>
      {!collapsed && (
        <>
          <span className={`text-sm font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
          {badge && (
            <span className="ml-auto text-xs bg-gradient-to-r from-primary to-secondary text-white px-2 py-0.5 rounded-lg shadow-lg shadow-primary/20">
              {badge}
            </span>
          )}
        </>
      )}
    </div>
  )
}

function TabButton({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      className={`px-4 py-2 text-xs font-medium transition-all duration-200 ${
        active 
          ? "bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/20" 
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
      }`}
      onClick={onClick}
    >
      {label}
    </button>
  )
}

function TaskCard({ title, description, highlight = false }: { title: string, description: string, highlight?: boolean }) {
  return (
    <div className="relative group">
      {highlight && (
        <div className="absolute -left-3 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-primary to-secondary text-white rounded-full p-1.5 text-xs shadow-lg shadow-primary/20">
          <span>✦</span>
        </div>
      )}
      <div className="bg-card rounded-xl p-4 border border-border/50 transition-all duration-200 hover:border-primary/30 hover:shadow-lg group-hover:shadow-primary/10">
        <div className="flex items-center gap-3 mb-2">
          <input 
            type="checkbox" 
            className="rounded-full border-muted-foreground/20 w-4 h-4 checked:bg-gradient-to-r checked:from-primary checked:to-secondary checked:border-0 transition-all duration-200" 
          />
          <h3 className="text-foreground font-medium text-sm">{title}</h3>
        </div>
        <p className="text-muted-foreground text-xs leading-relaxed">{description}</p>
      </div>
    </div>
  )
}
