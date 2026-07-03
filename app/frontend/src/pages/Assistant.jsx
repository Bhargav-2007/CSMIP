import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { API_URL } from "@/auth";
import { MessageCircle, Send, Sparkles, FileText, Upload, X } from "lucide-react";

const ROUTE_MAP = {
  "birth-certificate": "/services/birth-certificate",
  "death-certificate": "/services/death-certificate",
  "marriage-certificate": "/services/marriage-certificate",
  "property-tax": "/services/property-tax",
  "water-bill": "/services/water-bill",
  "drainage-bill": "/services/drainage-bill",
  "professional-tax": "/services/professional-tax",
  "trade-license": "/services/trade-license",
  "food-license": "/services/food-license",
  "building-permission": "/services/building-permission",
  "hall-booking": "/services/hall-booking",
  "complaint-311": "/complaints",
  "rti": "/rti",
  "scheme-discovery": "/schemes",
};

const useSession = (key) => {
  const [id] = useState(() => {
    let v = localStorage.getItem(key);
    if (!v) { v = `${key}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; localStorage.setItem(key, v); }
    return v;
  });
  return id;
};

export default function Assistant() {
  const nav = useNavigate();
  const [mode, setMode] = useState("discovery"); // 'discovery' | 'form-fill'
  const discoverySession = useSession("csmip-discovery-session");
  const formSession = useSession("csmip-formfill-session");
  const sessionId = mode === "discovery" ? discoverySession : formSession;
  const endpoint = mode === "discovery" ? "/chat/discovery" : "/chat/form-fill";

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [routeHint, setRouteHint] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    setMessages([]); setRouteHint(null);
    fetch(`${API_URL}/chat/${sessionId}/history`).then(r => r.json())
      .then(d => setMessages((d.messages || []).map(m => ({ role: m.role, content: m.content }))))
      .catch(() => {});
  }, [sessionId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const detectRoute = (text) => {
    const m = text.match(/ROUTE:\s*([a-z0-9-]+)/i);
    return m ? m[1] : null;
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/documents/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setUploadedFiles([...uploadedFiles, {
          name: file.name,
          size: file.size,
          type: file.type,
          preview: data.preview
        }]);
        
        // Add file to chat
        setMessages(m => [...m, {
          role: "system",
          content: `📎 Uploaded: ${file.name} (${(file.size / 1024).toFixed(2)} KB)\n\n${data.preview}`
        }]);
      }
    } catch (error) {
      console.error('File upload failed:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeFile = (index) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const send = async () => {
    if (!input.trim() || streaming) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(m => [...m, { role: "user", content: userMsg }, { role: "assistant", content: "" }]);
    setStreaming(true);
    setRouteHint(null);

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          session_id: sessionId, 
          message: userMsg,
          files: uploadedFiles // Include uploaded files context
        }),
      });
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "", full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n\n");
        buf = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") continue;
          full += data;
          setMessages(m => {
            const copy = [...m];
            copy[copy.length - 1] = { role: "assistant", content: full };
            return copy;
          });
        }
      }
      const slug = detectRoute(full);
      if (slug && ROUTE_MAP[slug]) setRouteHint({ slug, path: ROUTE_MAP[slug] });
    } catch (e) {
      setMessages(m => {
        const c = [...m];
        c[c.length - 1] = { role: "assistant", content: "Sorry, I had a connection error. Please try again." };
        return c;
      });
    }
    setStreaming(false);
  };

  const suggestions = mode === "discovery"
    ? ["I need a birth certificate", "Pay my property tax", "मुझे पानी का बिल भरना है", "File a complaint about garbage"]
    : ["Help me fill the birth certificate form", "What documents do I need for trade license?", "How do I write my RTI application?"];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8" data-testid="assistant-page">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="inline-flex items-center gap-2 px-2 py-1 bg-blue-50 rounded-full text-xs font-medium text-[var(--civic-primary)] mb-2">
            <Sparkles className="w-3 h-3" /> Powered by Gemini 3 Flash
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold heading-font text-slate-900">
            {mode === "discovery" ? "Mitra — Service Discovery" : "Sahayak — Form Filling Helper"}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {mode === "discovery"
              ? "Ask me about any government service. English या हिन्दी — दोनों चलेंगी।"
              : "I'll help you fill forms step-by-step and validate your inputs."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant={mode === "discovery" ? "default" : "outline"} onClick={() => setMode("discovery")}
            data-testid="mode-discovery" className={mode === "discovery" ? "bg-[var(--civic-primary)] text-white hover:bg-blue-800" : ""}>
            <MessageCircle className="w-4 h-4 mr-1" /> Mitra
          </Button>
          <Button variant={mode === "form-fill" ? "default" : "outline"} onClick={() => setMode("form-fill")}
            data-testid="mode-form" className={mode === "form-fill" ? "bg-[var(--civic-primary)] text-white hover:bg-blue-800" : ""}>
            <FileText className="w-4 h-4 mr-1" /> Sahayak
          </Button>
        </div>
      </div>

      <Card className="mt-6 border-slate-200 shadow-none">
        <CardContent className="p-0">
          <div className="h-[60vh] overflow-y-auto p-4 sm:p-6 space-y-4" data-testid="chat-window">
            {messages.length === 0 && (
              <div className="text-center text-slate-500 mt-12">
                <Sparkles className="w-10 h-10 mx-auto text-slate-300" />
                <p className="mt-3 text-sm">Start a conversation. Try one of these:</p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {suggestions.map(s => (
                    <button key={s} onClick={() => setInput(s)} className="text-xs px-3 py-1.5 border border-slate-200 rounded-full hover:bg-slate-50" data-testid={`suggest-${s.slice(0, 10)}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-lg px-4 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === "user" ? "bg-[var(--civic-primary)] text-white" : 
                  m.role === "system" ? "bg-amber-50 text-slate-900 border border-amber-200" :
                  "bg-slate-100 text-slate-900"
                }`} data-testid={`msg-${m.role}-${i}`}>
                  {m.content.replace(/ROUTE:\s*[a-z0-9-]+/i, "").trim() || (m.role === "assistant" && streaming && i === messages.length - 1 ? "…" : "")}
                </div>
              </div>
            ))}
            {routeHint && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3 flex items-center justify-between" data-testid="route-hint">
                <div>
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Suggested</Badge>
                  <p className="text-sm text-slate-700 mt-1">Open <strong>{routeHint.slug}</strong> page?</p>
                </div>
                <Button onClick={() => nav(routeHint.path)} className="bg-[var(--civic-primary)] hover:bg-blue-800 text-white" data-testid="route-open-btn">
                  Open
                </Button>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Uploaded Files Display */}
          {uploadedFiles.length > 0 && (
            <div className="border-t border-slate-200 p-3 bg-slate-50">
              <p className="text-xs text-slate-600 font-semibold mb-2">📎 Attached Documents:</p>
              <div className="flex flex-wrap gap-2">
                {uploadedFiles.map((file, i) => (
                  <div key={i} className="bg-white border border-slate-200 rounded px-3 py-2 text-xs flex items-center gap-2">
                    <FileText className="w-3 h-3 text-slate-500" />
                    <span>{file.name}</span>
                    <button onClick={() => removeFile(i)} className="hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-slate-200 p-3 flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.doc,.docx,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
            <Button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              variant="outline"
              size="sm"
              title="Upload document (PDF, TXT, DOC, DOCX, JPG, PNG)"
              data-testid="file-upload-btn"
            >
              <Upload className="w-4 h-4" />
            </Button>
            <Input 
              value={input} 
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
              placeholder="Type your question or upload a document..." 
              data-testid="chat-input" 
            />
            <Button 
              onClick={send} 
              disabled={streaming || !input.trim()} 
              data-testid="chat-send"
              className="bg-[var(--civic-primary)] hover:bg-blue-800 text-white"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
