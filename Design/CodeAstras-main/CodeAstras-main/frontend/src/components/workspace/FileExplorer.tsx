import { useState } from 'react';
import { ChevronRight, ChevronDown, File, Folder, X, GitBranch } from 'lucide-react';

interface FileExplorerProps {
  onClose: () => void;
}

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  isOpen?: boolean;
}

export function FileExplorer({ onClose }: FileExplorerProps) {
  const [files] = useState<FileNode[]>([
    {
      name: 'src',
      type: 'folder',
      isOpen: true,
      children: [
        { name: 'main.py', type: 'file' },
        { name: 'utils.py', type: 'file' },
        { name: 'config.json', type: 'file' },
      ],
    },
    {
      name: 'components',
      type: 'folder',
      isOpen: false,
      children: [
        { name: 'Header.tsx', type: 'file' },
        { name: 'Footer.tsx', type: 'file' },
      ],
    },
    { name: 'package.json', type: 'file' },
    { name: 'README.md', type: 'file' },
  ]);

  const FileItem = ({ node, depth = 0 }: { node: FileNode; depth?: number }) => {
    const [isOpen, setIsOpen] = useState(node.isOpen);

    return (
      <div>
        <div
          className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 cursor-pointer transition-colors group"
          style={{ paddingLeft: `${depth * 12 + 12}px` }}
          onClick={() => node.type === 'folder' && setIsOpen(!isOpen)}
        >
          {node.type === 'folder' ? (
            <>
              {isOpen ? (
                <ChevronDown className="w-4 h-4 text-white/60" />
              ) : (
                <ChevronRight className="w-4 h-4 text-white/60" />
              )}
              <Folder className="w-4 h-4 text-[#2BCBFF]" />
            </>
          ) : (
            <>
              <div className="w-4" />
              <File className="w-4 h-4 text-white/60" />
            </>
          )}
          <span className="text-sm text-white/90">{node.name}</span>
          
          {/* Quick actions on hover */}
          <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <button className="text-white/40 hover:text-white/80 text-xs">+</button>
          </div>
        </div>
        
        {node.type === 'folder' && isOpen && node.children && (
          <div>
            {node.children.map((child, idx) => (
              <FileItem key={idx} node={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-64 bg-[#0f0f0f] border-r border-white/5 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-white/5">
        <div>
          <div className="text-sm text-white/90">my-astro-app</div>
          <div className="flex items-center gap-1.5 mt-1">
            <GitBranch className="w-3 h-3 text-[#0ea5e9]" />
            <span className="text-xs text-white/60">main</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded transition-colors"
        >
          <X className="w-4 h-4 text-white/60" />
        </button>
      </div>

      {/* File tree */}
      <div className="flex-1 overflow-y-auto py-2">
        {files.map((node, idx) => (
          <FileItem key={idx} node={node} />
        ))}
      </div>
    </div>
  );
}