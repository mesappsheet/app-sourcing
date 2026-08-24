import React, { useState, useRef, useEffect } from "react";
import { 
  ChevronDown, 
  Plus, 
  Layers, 
  Check, 
  Settings2, 
  FolderPlus,
  Trash2,
  Sparkles,
  ExternalLink
} from "lucide-react";

export function WorkspaceSelector({ 
  workspaces, 
  activeWorkspaceId, 
  onSelectWorkspace, 
  onOpenManageWorkspaces,
  getWorkspaceProductCount 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId) || workspaces[0] || {
    id: "ws_quincaillerie",
    name: "Quincaillerie & Menuiserie",
    icon: "⚙️"
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeCount = getWorkspaceProductCount ? getWorkspaceProductCount(activeWorkspace.id) : 0;

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      
      {/* 🌟 BOUTON PRINCIPAL DÉCLENCHEUR DU MENU DÉROULANT DES ESPACES */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.65rem",
          background: "linear-gradient(135deg, rgba(37, 99, 235, 0.15), rgba(15, 23, 42, 0.95))",
          border: "1.5px solid rgba(59, 130, 246, 0.45)",
          padding: "0.4rem 0.85rem",
          borderRadius: "12px",
          cursor: "pointer",
          boxShadow: "0 4px 18px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
        }}
        title="Changer d espace de sourcing (Quincaillerie, Cuisines, Vêtements...)"
      >
        <div style={{
          width: "28px",
          height: "28px",
          borderRadius: "8px",
          background: "rgba(37, 99, 235, 0.25)",
          border: "1px solid rgba(59, 130, 246, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.05rem",
          flexShrink: 0
        }}>
          {activeWorkspace.icon || "📦"}
        </div>

        <div style={{ textAlign: "left", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{
              fontSize: "0.86rem",
              fontWeight: 800,
              color: "#FFFFFF",
              letterSpacing: "-0.01em",
              maxWidth: "210px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis"
            }}>
              {activeWorkspace.name}
            </span>
            <span style={{
              background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
              color: "white",
              fontSize: "0.66rem",
              fontWeight: 800,
              padding: "0.08rem 0.45rem",
              borderRadius: "6px",
              border: "1px solid rgba(255, 255, 255, 0.2)"
            }}>
              {activeCount} {activeCount > 1 ? "articles" : "article"}
            </span>
          </div>
          <span style={{ fontSize: "0.64rem", color: "#93C5FD", fontWeight: 600 }}>
            Espace de Sourcing Actif ▾
          </span>
        </div>

        <ChevronDown size={15} color="#93C5FD" style={{
          transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.2s ease",
          marginLeft: "0.2rem"
        }} />
      </button>

      {/* 🔽 MENU DÉROULANT DES ESPACES DE SOURCING */}
      {isOpen && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 8px)",
          left: 0,
          minWidth: "320px",
          background: "#0B1120",
          border: "1.5px solid rgba(59, 130, 246, 0.35)",
          borderRadius: "16px",
          padding: "0.75rem",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.85), 0 0 25px rgba(37, 99, 235, 0.2)",
          zIndex: 100100,
          backdropFilter: "blur(20px)",
          animation: "fadeIn 0.15s ease"
        }}>
          
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0.25rem 0.5rem 0.6rem",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            marginBottom: "0.5rem"
          }}>
            <div style={{ fontSize: "0.74rem", fontWeight: 800, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Mes Espaces de Sourcing ({workspaces.length})
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenManageWorkspaces();
              }}
              style={{
                background: "rgba(255, 255, 255, 0.06)",
                border: "none",
                color: "#38BDF8",
                fontSize: "0.7rem",
                fontWeight: 700,
                cursor: "pointer",
                padding: "0.2rem 0.5rem",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem"
              }}
            >
              <Settings2 size={12} />
              <span>Gérer</span>
            </button>
          </div>

          {/* Liste des espaces existants */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", maxHeight: "280px", overflowY: "auto" }}>
            {workspaces.map(ws => {
              const isSelected = ws.id === activeWorkspaceId;
              const count = getWorkspaceProductCount ? getWorkspaceProductCount(ws.id) : 0;
              return (
                <div
                  key={ws.id}
                  onClick={() => {
                    onSelectWorkspace(ws.id);
                    setIsOpen(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.6rem 0.75rem",
                    borderRadius: "10px",
                    cursor: "pointer",
                    background: isSelected 
                      ? "linear-gradient(135deg, rgba(37, 99, 235, 0.25), rgba(15, 23, 42, 0.9))" 
                      : "rgba(255, 255, 255, 0.03)",
                    border: isSelected ? "1.5px solid #3B82F6" : "1px solid transparent",
                    transition: "all 0.15s ease"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                    <span style={{ fontSize: "1.25rem" }}>{ws.icon || "📦"}</span>
                    <div>
                      <div style={{ fontSize: "0.82rem", fontWeight: 800, color: isSelected ? "#FFFFFF" : "#CBD5E1" }}>
                        {ws.name}
                      </div>
                      <div style={{ fontSize: "0.68rem", color: "#64748B" }}>
                        {ws.domain || "Projet de sourcing"}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{
                      background: isSelected ? "rgba(37, 99, 235, 0.4)" : "rgba(255, 255, 255, 0.08)",
                      color: isSelected ? "#93C5FD" : "#94A3B8",
                      fontSize: "0.68rem",
                      fontWeight: 800,
                      padding: "0.15rem 0.45rem",
                      borderRadius: "6px"
                    }}>
                      {count}
                    </span>
                    {isSelected && <Check size={16} color="#3B82F6" />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ➕ BOUTON CRÉER UN NOUVEL ESPACE */}
          <div style={{ marginTop: "0.65rem", paddingTop: "0.65rem", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenManageWorkspaces(true);
              }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.45rem",
                background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
                color: "white",
                border: "none",
                padding: "0.6rem",
                borderRadius: "10px",
                fontSize: "0.78rem",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 4px 15px rgba(37, 99, 235, 0.4)",
                transition: "all 0.2s"
              }}
            >
              <Plus size={15} />
              <span>+ Créer un Nouvel Espace de Sourcing</span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
