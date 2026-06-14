"use client";

import { useState, useEffect } from "react";
import {
  FolderClosed,
  FolderOpen,
  File,
  FileCode2,
  FileJson,
  FileText,
} from "lucide-react";

interface FileTreeProps {
  files: string[]; // flat file paths
  onFileSelect: (path: string) => void;
}

type TreeNode = {
  name: string;
  path: string;
  type: "file" | "directory";
  children: TreeNode[];
};

export function FileTree({ files, onFileSelect }: FileTreeProps) {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});

  // Build tree once when files change
  useEffect(() => {
    const built = buildTree(files);
    setTree(built);
    // Auto‑expand first level directories
    const firstLevel: Record<string, boolean> = {};
    built.forEach((node) => {
      if (node.type === "directory") firstLevel[node.path] = true;
    });
    setOpenMap(firstLevel);
  }, [files]);

  const toggle = (path: string) => {
    setOpenMap((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const renderNode = (node: TreeNode) => {
    if (node.type === "directory") {
      const isOpen = !!openMap[node.path];
      const fileCount = countFiles(node);
      return (
        <li key={node.path}>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left transition-colors hover:bg-surface-hover"
            onClick={() => toggle(node.path)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggle(node.path);
              }
            }}
            aria-expanded={isOpen}
          >
            {isOpen ? (
              <FolderOpen className="h-4 w-4 shrink-0 text-foreground" />
            ) : (
              <FolderClosed className="h-4 w-4 shrink-0 text-foreground" />
            )}
            <span className="truncate text-foreground">{node.name}</span>
            <span className="ml-auto shrink-0 text-xs text-muted-fg">({fileCount})</span>
          </button>
          <ul
            className={`ml-6 overflow-hidden transition-all duration-200 ${
              isOpen ? "max-h-[1000px]" : "max-h-0"
            }`}
          >
            {node.children.map(renderNode)}
          </ul>
        </li>
      );
    }

    // file node
    const isDot = node.name.startsWith(".");
    const icon = getFileIcon(node.name);
    return (
      <li key={node.path}>
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left transition-colors hover:bg-surface-hover"
          onClick={() => onFileSelect(node.path)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onFileSelect(node.path);
            }
          }}
          data-file-path={node.path}
        >
          {icon}
          <span className={`truncate ${isDot ? "font-medium text-foreground" : "text-muted-fg"}`}>
            {node.name}
          </span>
        </button>
      </li>
    );
  };

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      <div className="px-4 py-2 border-b border-border bg-surface-hover text-xs font-semibold uppercase tracking-widest text-muted-fg">
        File Explorer
      </div>
      <div className="p-2">
        <ul>{tree.map(renderNode)}</ul>
      </div>
    </div>
  );
}

// ---------- Helpers ----------
function buildTree(paths: string[]): TreeNode[] {
  const root: TreeNode = { name: "", path: "", type: "directory", children: [] };
  for (const p of paths) {
    const parts = p.split("/");
    let current = root;
    let currentPath = "";
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const existing = current.children.find((c) => c.name === part);
      if (i === parts.length - 1) {
        // file leaf
        if (!existing) {
          current.children.push({ name: part, path: currentPath, type: "file", children: [] });
        }
      } else {
        // directory
        if (!existing) {
          const dir: TreeNode = { name: part, path: currentPath, type: "directory", children: [] };
          current.children.push(dir);
          current = dir;
        } else {
          current = existing;
        }
      }
    }
  }

  // sort: directories first, then files, alphabetically
  const sort = (node: TreeNode) => {
    node.children.sort((a, b) => {
      if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    node.children.forEach(sort);
  };
  sort(root);
  return root.children;
}

function countFiles(node: TreeNode): number {
  if (node.type === "file") return 1;
  return node.children.reduce((sum, child) => sum + countFiles(child), 0);
}

function getFileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "json") return <FileJson className="h-4 w-4 text-foreground" />;
  const codeExts = [
    "lua",
    "vim",
    "js",
    "ts",
    "tsx",
    "jsx",
    "py",
    "rb",
    "sh",
    "bash",
    "zsh",
    "fish",
    "nix",
    "go",
    "rs",
    "c",
    "cpp",
    "java",
    "cs",
    "php",
  ];
  if (codeExts.includes(ext)) return <FileCode2 className="h-4 w-4 text-foreground" />;
  const textExts = ["md", "txt", "conf", "cfg", "ini", "toml", "yml", "yaml"];
  if (textExts.includes(ext)) return <FileText className="h-4 w-4 text-foreground" />;
  return <File className="h-4 w-4 text-foreground" />;
}
