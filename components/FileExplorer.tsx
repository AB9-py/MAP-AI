'use client';

import React, { useState, useMemo } from 'react';
import { FileText, ChevronRight, ChevronDown, FolderOpen, Folder, Search } from 'lucide-react';

interface FileEntry {
  id: string;
  path: string;
  language: string;
  size_bytes: number;
}

interface FileExplorerProps {
  files: FileEntry[];
  selectedFile: string | null;
  onSelectFile: (path: string) => void;
}

interface TreeNode {
  name: string;
  path: string;
  isDir: boolean;
  children: TreeNode[];
  file?: FileEntry;
}

function buildTree(files: FileEntry[]): TreeNode[] {
  const root: TreeNode = { name: '', path: '', isDir: true, children: [] };

  for (const file of files) {
    const parts = file.path.split('/');
    let node = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      const existingPath = parts.slice(0, i + 1).join('/');
      let child = node.children.find(c => c.name === part);
      if (!child) {
        child = {
          name: part,
          path: existingPath,
          isDir: !isLast,
          children: [],
          file: isLast ? file : undefined,
        };
        node.children.push(child);
      }
      if (!isLast) node = child;
    }
  }

  // Sort: dirs first, then files, alphabetically
  function sort(nodes: TreeNode[]) {
    nodes.sort((a, b) => {
      if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach(n => { if (n.isDir) sort(n.children); });
  }
  sort(root.children);
  return root.children;
}

const LANG_COLORS: Record<string, string> = {
  typescript: 'text-blue-400', javascript: 'text-yellow-400', python: 'text-green-400',
  go: 'text-cyan-400', rust: 'text-orange-400', java: 'text-red-400', ruby: 'text-rose-400',
  markdown: 'text-neutral-400', json: 'text-yellow-300', yaml: 'text-purple-400',
  css: 'text-pink-400', html: 'text-orange-300', bash: 'text-green-300',
};

function TreeNodeView({
  node,
  selectedFile,
  onSelectFile,
  depth = 0,
}: {
  node: TreeNode;
  selectedFile: string | null;
  onSelectFile: (p: string) => void;
  depth?: number;
}) {
  const [open, setOpen] = useState(depth < 1);

  if (node.isDir) {
    return (
      <div>
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-1.5 w-full px-2 py-0.5 rounded hover:bg-neutral-800 text-neutral-300 text-xs group"
          style={{ paddingLeft: `${8 + depth * 14}px` }}
        >
          {open ? <ChevronDown className="w-3 h-3 text-neutral-500 shrink-0" /> : <ChevronRight className="w-3 h-3 text-neutral-500 shrink-0" />}
          {open ? <FolderOpen className="w-3.5 h-3.5 text-yellow-600/80 shrink-0" /> : <Folder className="w-3.5 h-3.5 text-yellow-700/70 shrink-0" />}
          <span className="truncate">{node.name}</span>
        </button>
        {open && (
          <div>
            {node.children.map(child => (
              <TreeNodeView key={child.path} node={child} selectedFile={selectedFile} onSelectFile={onSelectFile} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  const lang = node.file?.language ?? 'text';
  const colorClass = LANG_COLORS[lang] ?? 'text-neutral-400';
  const isSelected = selectedFile === node.path;

  return (
    <button
      onClick={() => onSelectFile(node.path)}
      className={`flex items-center gap-1.5 w-full px-2 py-0.5 rounded text-xs group ${
        isSelected ? 'bg-orange-500/10 text-orange-300' : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
      }`}
      style={{ paddingLeft: `${8 + depth * 14}px` }}
    >
      <FileText className={`w-3.5 h-3.5 shrink-0 ${colorClass}`} />
      <span className="truncate">{node.name}</span>
    </button>
  );
}

export const FileExplorer: React.FC<FileExplorerProps> = ({ files, selectedFile, onSelectFile }) => {
  const [search, setSearch] = useState('');

  const filteredFiles = useMemo(() => {
    if (!search.trim()) return files;
    const q = search.toLowerCase();
    return files.filter(f => f.path.toLowerCase().includes(q));
  }, [files, search]);

  const tree = useMemo(() => buildTree(filteredFiles), [filteredFiles]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Search */}
      <div className="p-2 border-b border-neutral-800">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter files..."
            className="w-full pl-7 pr-3 py-1.5 text-xs bg-neutral-900 border border-neutral-800 rounded-md text-neutral-300 placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-orange-500/50"
          />
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-1 min-h-0">
        {tree.length === 0 ? (
          <p className="text-xs text-neutral-600 text-center py-6">No files found</p>
        ) : (
          tree.map(node => (
            <TreeNodeView key={node.path} node={node} selectedFile={selectedFile} onSelectFile={onSelectFile} />
          ))
        )}
      </div>

      {/* Count */}
      <div className="px-2 py-1.5 border-t border-neutral-800 text-[10px] text-neutral-600 font-mono">
        {files.length} files loaded
      </div>
    </div>
  );
};
