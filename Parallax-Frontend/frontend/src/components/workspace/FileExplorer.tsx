import { useState } from "react";
import {
  X,
  FilePlus,
  FolderPlus,
  MoreVertical,
  ChevronRight,
  ChevronDown,
  File as FileIcon,
  Folder as FolderIcon,
} from "lucide-react";

type FileNode = {
  name: string;
  path: string;
  type: "FILE" | "FOLDER";
  children?: FileNode[] | null;
};

type FileExplorerProps = {
  tree?: FileNode[];
  onSelect: (path: string) => void;
  onCreate: (path: string, type: "FILE" | "FOLDER") => void;
  onDelete: (path: string) => void;
  onClose: () => void;
};

export function FileExplorer({
  tree = [],
  onSelect,
  onCreate,
  onDelete,
  onClose,
}: FileExplorerProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  const [creationState, setCreationState] = useState<{ type: "FILE" | "FOLDER"; parentPath: string } | null>(null);
  const [newItemName, setNewItemName] = useState("");

  const toggleFolder = (path: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setExpanded((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const handleFolderClick = (path: string) => {
    if (selectedFolder === path) {
      setSelectedFolder(null); // click again to deselect
    } else {
      setSelectedFolder(path);
    }
  };

  const startCreation = (type: "FILE" | "FOLDER") => {
    const parentPath = selectedFolder || "";
    setCreationState({ type, parentPath });
    setNewItemName("");
    // Ensure parent is expanded if we are inside a folder
    if (parentPath) {
      setExpanded((prev) => ({ ...prev, [parentPath]: true }));
    }
  };

  const handleCreationSubmit = () => {
    if (!newItemName.trim() || !creationState) {
      setCreationState(null);
      return;
    }

    const parentPath = creationState.parentPath ? `${creationState.parentPath}/` : "";
    const finalPath = `${parentPath}${newItemName.trim()}`;

    onCreate(finalPath, creationState.type);
    setCreationState(null);
    setNewItemName("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleCreationSubmit();
    if (e.key === "Escape") setCreationState(null);
  };

  const renderCreationInput = (depth: number) => {
    const paddingLeft = 8 + depth * 12;
    return (
      <div
        className="flex items-center gap-1.5 px-2 py-1"
        style={{ paddingLeft }}
      >
        <span className="w-3 inline-block" />
        {creationState?.type === "FOLDER" ? (
          <FolderIcon className="w-3.5 h-3.5 text-[#F59E0B]" />
        ) : (
          <FileIcon className="w-3.5 h-3.5 text-white/60" />
        )}
        <input
          autoFocus
          className="bg-[#162032] text-white text-xs border border-[#71717A]/50 rounded px-1.5 py-0.5 outline-none min-w-[120px] shadow-lg shadow-[#71717A]/10"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => setCreationState(null)}
          placeholder={creationState?.type === "FILE" ? "File name..." : "Folder name..."}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    );
  };

  const safeChildren = (node: FileNode): FileNode[] =>
    Array.isArray(node.children) ? node.children : [];

  const renderNode = (node: FileNode, depth = 0) => {
    const paddingLeft = 8 + depth * 12;

    if (node.type === "FOLDER") {
      const isOpen = expanded[node.path];
      const isSelected = selectedFolder === node.path;
      const isCreatingHere = creationState?.parentPath === node.path;

      return (
        <div key={node.path}>
          <div
            className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded cursor-pointer transition-colors ${isSelected
              ? "bg-[#71717A]/20 text-[#D4AF37]"
              : "text-white/80 hover:bg-white/5"
              }`}
            style={{ paddingLeft }}
            onClick={() => handleFolderClick(node.path)}
          >
            <div
              onClick={(e) => toggleFolder(node.path, e)}
              className="p-0.5 hover:bg-white/10 rounded"
            >
              {isOpen ? (
                <ChevronDown className="w-3 h-3 text-white/60" />
              ) : (
                <ChevronRight className="w-3 h-3 text-white/60" />
              )}
            </div>
            <FolderIcon className={`w-3.5 h-3.5 ${isSelected ? "text-[#A1A1AA]" : "text-[#F59E0B]"}`} />
            <span className="truncate">{node.name}</span>
          </div>

          {isOpen && (
            <>
              {isCreatingHere && renderCreationInput(depth + 1)}
              {safeChildren(node).map((child) =>
                renderNode(child, depth + 1)
              )}
            </>
          )}
        </div>
      );
    }

    return (
      <div
        key={node.path}
        className="flex items-center gap-1.5 text-xs text-white/70 hover:bg-white/5 px-2 py-1 rounded cursor-pointer"
        style={{ paddingLeft }}
        onClick={() => onSelect(node.path)}
      >
        <span className="w-3 inline-block" /> {/* Spacer for alignment since no chevron */}
        <FileIcon className="w-3.5 h-3.5 text-white/60" />
        <span className="truncate">{node.name}</span>
      </div>
    );
  };

  return (
    <div className="w-full h-full bg-[#09090B] border-r border-white/5 flex flex-col">
      {/* Header */}
      <div className="px-3 py-2 flex items-center justify-between border-b border-white/5">
        <span className="text-xs font-semibold tracking-wide text-white/60">
          EXPLORER
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={() => startCreation("FILE")}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/10 text-white/70"
            title={selectedFolder ? `New File in ${selectedFolder}` : "New File"}
          >
            <FilePlus className="w-4 h-4" />
          </button>

          <button
            onClick={() => startCreation("FOLDER")}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/10 text-white/70"
            title={selectedFolder ? `New Folder in ${selectedFolder}` : "New Folder"}
          >
            <FolderPlus className="w-4 h-4" />
          </button>

          <button
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/10 text-white/50"
            title="Collapse All"
            onClick={() => {
              setExpanded({});
              setSelectedFolder(null);
            }}
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/10 text-white/70"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto py-2">
        {/* Input at Root Level */}
        {creationState?.parentPath === "" && renderCreationInput(0)}

        {Array.isArray(tree) && tree.length === 0 && !creationState ? (
          <div className="px-3 text-xs text-white/40">
            No files yet
          </div>
        ) : Array.isArray(tree) ? (
          tree.map((node) => renderNode(node))
        ) : (
          <div className="px-3 text-xs text-[#EF6461]">
            Invalid file tree structure
          </div>
        )}
      </div>
    </div>
  );
}
