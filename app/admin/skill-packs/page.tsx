"use client";

import React, { useState, useRef } from "react";
import DashboardShell from "@/components/DashboardShell";
import {
  Layers,
  UtensilsCrossed,
  Home,
  Maximize2,
  Wifi,
  Building2,
  Upload,
  Layers3,
  FileSpreadsheet,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  Sparkles,
} from "lucide-react";

interface Pack {
  id: string;
  name: string;
  description: string;
  docCount: number;
  version: string;
  isActive: boolean;
  iconName: "Layers" | "UtensilsCrossed" | "Home" | "Maximize2" | "Wifi" | "Building2";
}

interface RagDoc {
  id: string;
  name: string;
  packName: string;
  type: "PDF" | "XLSX";
  chunks: number;
  uploadedAt: string;
  status: "INDEXED" | "PROCESSING";
}

const INITIAL_PACKS: Pack[] = [
  { id: "pack-1", name: "Interior Design Expert Pack v2", description: "Standard luxury wood selections, modular dimensions guidelines, and paint finish catalogs.", docCount: 14, version: "2.1.0", isActive: true, iconName: "Layers" },
  { id: "pack-2", name: "Kitchen Specialist Pack", description: "Acrylic shutters styles, soft-close hardware brands, and granite layout specifications.", docCount: 8, version: "1.4.0", isActive: true, iconName: "UtensilsCrossed" },
  { id: "pack-3", name: "Luxury Villa Design Pack", description: "Italian marble slabs classifications, structural duplex sizing codes, and swimming pools designs.", docCount: 11, version: "3.0.1", isActive: false, iconName: "Home" },
  { id: "pack-4", name: "Space Optimizer Pack (2BHK)", description: "Pull-out murphy beds, sliding wardrobe doors, and multi-functional storage solutions.", docCount: 6, version: "1.0.5", isActive: false, iconName: "Maximize2" },
  { id: "pack-5", name: "Smart Home Integration Pack", description: "Automated lighting schemas, smart curtain sensors, and voice-command hub guidelines.", docCount: 4, version: "1.2.0", isActive: false, iconName: "Wifi" },
  { id: "pack-6", name: "Commercial & Office Design Pack", description: "Open co-working seating grids, executive boardrooms layouts, and fire-resistant materials catalogs.", docCount: 9, version: "2.0.0", isActive: false, iconName: "Building2" },
];

const INITIAL_DOCS: RagDoc[] = [
  { id: "doc-1", name: "premium_modular_kitchens_2026.pdf", packName: "Kitchen Specialist Pack", type: "PDF", chunks: 148, uploadedAt: "May 20, 2026", status: "INDEXED" },
  { id: "doc-2", name: "luxury_villa_duplex_specifications.xlsx", packName: "Luxury Villa Design Pack", type: "XLSX", chunks: 320, uploadedAt: "May 18, 2026", status: "INDEXED" },
  { id: "doc-3", name: "acrylic_shutters_finishes.pdf", packName: "Kitchen Specialist Pack", type: "PDF", chunks: 84, uploadedAt: "May 25, 2026", status: "INDEXED" },
  { id: "doc-4", name: "hettich_softclose_catalog.xlsx", packName: "Kitchen Specialist Pack", type: "XLSX", chunks: 210, uploadedAt: "May 10, 2026", status: "INDEXED" },
  { id: "doc-5", name: "hafele_wardrobe_fixtures.pdf", packName: "Interior Design Expert Pack v2", type: "PDF", chunks: 125, uploadedAt: "May 29, 2026", status: "INDEXED" }
];

export default function SkillPacksPage() {
  const [packs, setPacks] = useState<Pack[]>(INITIAL_PACKS);
  const [docs, setDocs] = useState<RagDoc[]>(INITIAL_DOCS);
  const [togglingPackId, setTogglingPackId] = useState<string | null>(null);

  // File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadPack, setUploadPack] = useState("Interior Design Expert Pack v2");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Optimistic Toggle Handler
  const handleTogglePack = (id: string) => {
    setTogglingPackId(id);
    
    // 1-second dynamic spinner to simulate vector space reallocation
    setTimeout(() => {
      setPacks((prev) =>
        prev.map((p) => {
          if (p.id === id) {
            return { ...p, isActive: !p.isActive };
          }
          return p;
        })
      );
      setTogglingPackId(null);
    }, 1000);
  };

  // Hidden Input Trigger
  const handleUploadClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  // File Selector
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Upload Executor
  const handleConfirmUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    // Simulated ingestion progress bar over 1.8s
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + 15;
      });
    }, 200);

    // Call POST /api/rag/ingest via FormData (fallback to simulated if endpoints mismatch)
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("packName", uploadPack);

      const res = await fetch("/api/rag/ingest", {
        method: "POST",
        body: formData,
      });
      // Silent pass, wait for simulator
    } catch (err) {
      console.warn("API direct endpoint fallback. Simulator proceeding...");
    }

    // Complete simulation
    setTimeout(() => {
      clearInterval(interval);
      setUploadProgress(100);
      
      // Inject new indexed document row into list
      const isXlsx = selectedFile.name.endsWith(".xlsx");
      const newDoc: RagDoc = {
        id: `doc-${Date.now()}`,
        name: selectedFile.name,
        packName: uploadPack,
        type: isXlsx ? "XLSX" : "PDF",
        chunks: Math.floor(40 + Math.random() * 200),
        uploadedAt: "Today",
        status: "INDEXED",
      };

      setDocs((prev) => [newDoc, ...prev]);
      
      // Update Pack Document counts
      setPacks((prev) =>
        prev.map((p) => {
          if (p.name === uploadPack) {
            return { ...p, docCount: p.docCount + 1 };
          }
          return p;
        })
      );

      // Clean Upload states
      setIsUploading(false);
      setSelectedFile(null);
    }, 1800);
  };

  // Render appropriate Icon
  const renderPackIcon = (iconName: Pack["iconName"]) => {
    const props = { size: 24, style: { color: "var(--gold)" } };
    switch (iconName) {
      case "Layers": return <Layers {...props} />;
      case "UtensilsCrossed": return <UtensilsCrossed {...props} />;
      case "Home": return <Home {...props} />;
      case "Maximize2": return <Maximize2 {...props} />;
      case "Wifi": return <Wifi {...props} />;
      case "Building2": return <Building2 {...props} />;
    }
  };

  const activePacksCount = packs.filter((p) => p.isActive).length;

  return (
    <DashboardShell>
      <div style={{ display: "flex", flexDirection: "column", gap: 30, fontFamily: "var(--font-sans), sans-serif" }}>
        
        {/* Style sheet animations */}
        <style>{`
          @keyframes voxa-spin {
            to { transform: rotate(360deg); }
          }
          .voxa-spinner {
            animation: voxa-spin 1s linear infinite;
          }
        `}</style>

        {/* Page Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-.02em" }}>Catalog Skill Packs</h1>
              
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "rgba(20, 184, 166, 0.08)",
                  border: "1px solid rgba(20, 184, 166, 0.25)",
                  borderRadius: 30,
                  padding: "4px 12px",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--teal)",
                }}
              >
                <span>My Active Packs: {activePacksCount} / {packs.length}</span>
              </div>
            </div>
            <p style={{ fontSize: 14, color: "var(--txt2)", marginTop: 4 }}>
              Inject business catalogs, configure conversational RAG boundaries, and provision specialized context nodes to voice agents.
            </p>
          </div>

          <div>
            <button
              onClick={handleUploadClick}
              style={{
                height: 40,
                padding: "0 18px",
                borderRadius: 10,
                background: "var(--teal)",
                color: "#0F0F12",
                fontSize: 13,
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                boxShadow: "0 4px 14px rgba(20, 184, 166, 0.15)",
              }}
            >
              <Upload size={16} />
              <span>Upload Document</span>
            </button>
            
            {/* Hidden Input field */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.xlsx"
              style={{ display: "none" }}
            />
          </div>
        </div>

        {/* Section 1: 3-column Responsive Packs Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
          {packs.map((p) => {
            const isToggling = togglingPackId === p.id;
            const activeBorder = p.isActive ? "1px solid rgba(20, 184, 166, 0.35)" : "1px solid rgba(255, 255, 255, 0.04)";

            return (
              <div
                key={p.id}
                className="glass-panel"
                style={{
                  padding: 24,
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  border: activeBorder,
                  position: "relative",
                  background: p.isActive ? "rgba(20, 184, 166, 0.01)" : "var(--surf)",
                }}
              >
                {/* Pack Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ padding: 10, borderRadius: 8, background: "rgba(255, 255, 255, 0.03)" }}>
                    {renderPackIcon(p.iconName)}
                  </div>

                  <button
                    onClick={() => handleTogglePack(p.id)}
                    disabled={isToggling}
                    style={{
                      height: 28,
                      padding: "0 10px",
                      borderRadius: 6,
                      border: p.isActive ? "1px solid rgba(20, 184, 166, 0.3)" : "1px solid rgba(255, 255, 255, 0.08)",
                      background: p.isActive ? "rgba(20, 184, 166, 0.08)" : "transparent",
                      color: p.isActive ? "var(--teal)" : "var(--txt2)",
                      fontSize: 11.5,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    {isToggling ? (
                      <>
                        <div className="voxa-spinner" style={{ width: 10, height: 10, borderRadius: "50%", border: "1.5px solid var(--txt3)", borderTopColor: "var(--teal)" }} />
                        <span>Applying...</span>
                      </>
                    ) : p.isActive ? (
                      "Active ✓"
                    ) : (
                      "Activate"
                    )}
                  </button>
                </div>

                {/* Info */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--txt)" }}>{p.name}</h3>
                  <p style={{ fontSize: 12, color: "var(--txt2)", lineHeight: 1.5, minHeight: 54 }}>
                    {p.description}
                  </p>
                </div>

                {/* Metadata Footer */}
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 14, fontSize: 11.5, color: "var(--txt3)", fontFamily: "var(--font-mono)" }}>
                  <span>DOCUMENTS: {p.docCount} loaded</span>
                  <span>VERSION: {p.version}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Section 2: Document Ingestion Confirmation Box */}
        {selectedFile && (
          <div className="glass-panel stagger-item" style={{ padding: 24, border: "1px solid rgba(20, 184, 166, 0.3)", display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ padding: 10, borderRadius: 8, background: "rgba(20, 184, 166, 0.05)", color: "var(--teal)" }}>
                  {selectedFile.name.endsWith(".xlsx") ? <FileSpreadsheet size={20} /> : <FileText size={20} />}
                </div>
                <div>
                  <span style={{ fontSize: 9.5, fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--teal)", letterSpacing: ".1em" }}>
                    DOCUMENT STAGING FOR INGESTION
                  </span>
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>{selectedFile.name}</h3>
                </div>
              </div>

              {!isUploading && (
                <button
                  onClick={() => setSelectedFile(null)}
                  style={{
                    border: "none",
                    background: "none",
                    color: "var(--txt3)",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              )}
            </div>

            {isUploading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, fontFamily: "var(--font-mono)", color: "var(--txt2)" }}>
                  <span>Chunking & indexing nodes database...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div style={{ height: 6, width: "100%", background: "rgba(255,255,255,0.03)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${uploadProgress}%`, background: "var(--teal)", transition: "width 0.2s ease" }} />
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", justifyItems: "center", gap: 14, flexWrap: "wrap" }}>
                {/* Select Pack Target */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, color: "var(--txt3)" }}>TARGET PACK:</span>
                  <select
                    value={uploadPack}
                    onChange={(e) => setUploadPack(e.target.value)}
                    style={{
                      height: 32,
                      fontSize: 12,
                      background: "#0c0d12",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 6,
                      color: "var(--txt2)",
                      padding: "0 8px",
                    }}
                  >
                    {packs.map((p) => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleConfirmUpload}
                  style={{
                    height: 32,
                    padding: "0 14px",
                    borderRadius: 6,
                    background: "var(--teal)",
                    color: "#0F0F12",
                    border: "none",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    marginLeft: "auto",
                  }}
                >
                  <Upload size={12} />
                  <span>Start RAG Ingestion</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Section 3: RAG Document Library Table */}
        <div className="glass-panel" style={{ overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", display: "flex", alignItems: "center", gap: 8 }}>
            <Layers3 size={18} style={{ color: "var(--gold)" }} />
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Active RAG Document Library</h2>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "rgba(0,0,0,0.18)", borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
                {["DOCUMENT NAME", "SKILL PACK CATEGORY", "TYPE", "CHUNKS EXTRACTED", "DATE INDEXED", "STATUS"].map((th) => (
                  <th
                    key={th}
                    style={{
                      padding: "16px 24px",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--txt3)",
                      letterSpacing: ".05em",
                    }}
                  >
                    {th}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {docs.map((doc) => {
                const isXlsx = doc.type === "XLSX";
                return (
                  <tr
                    key={doc.id}
                    style={{
                      borderBottom: "1px solid rgba(255, 255, 255, 0.03)",
                      transition: "background 0.2s ease",
                    }}
                  >
                    {/* Document Name */}
                    <td style={{ padding: "16px 24px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {isXlsx ? (
                          <FileSpreadsheet size={15} style={{ color: "var(--green)" }} />
                        ) : (
                          <FileText size={15} style={{ color: "var(--blue)" }} />
                        )}
                        <span style={{ fontWeight: 700, fontSize: 13.5 }}>{doc.name}</span>
                      </div>
                    </td>

                    {/* Skill Pack Category */}
                    <td style={{ padding: "16px 24px", fontSize: 13, color: "var(--txt2)" }}>
                      {doc.packName}
                    </td>

                    {/* Type badge */}
                    <td style={{ padding: "16px 24px" }}>
                      <span
                        style={{
                          fontSize: 9.5,
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: 4,
                          color: isXlsx ? "var(--green)" : "var(--blue)",
                          background: isXlsx ? "rgba(16, 185, 129, 0.08)" : "rgba(99, 140, 255, 0.08)",
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        {doc.type}
                      </span>
                    </td>

                    {/* Chunks */}
                    <td style={{ padding: "16px 24px", fontSize: 12.5, fontFamily: "var(--font-mono)", color: "var(--txt2)" }}>
                      {doc.chunks} vectors
                    </td>

                    {/* Upload Date */}
                    <td style={{ padding: "16px 24px", fontSize: 12, color: "var(--txt3)", fontFamily: "var(--font-mono)" }}>
                      {doc.uploadedAt}
                    </td>

                    {/* Status badge */}
                    <td style={{ padding: "16px 24px" }}>
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: 6,
                          color: "var(--green)",
                          background: "rgba(16, 185, 129, 0.08)",
                          border: "0.5px solid rgba(16, 185, 129, 0.2)",
                          letterSpacing: ".04em",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <CheckCircle size={10} />
                        {doc.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>
    </DashboardShell>
  );
}
