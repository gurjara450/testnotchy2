'use client';

import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  useReactFlow,
  NodeProps,
  Connection,
  EdgeChange,
  NodeChange,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from '../ui/button';
import { 
  Loader2, ZoomIn, ZoomOut, Download, Save, Edit2, Trash2, Plus, Settings2, 
  Undo, Redo, Layout, Share2, FileDown, FileUp, Lock, Unlock, ChevronRight, ChevronDown, ChevronUp 
} from 'lucide-react';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { ChromePicker } from 'react-color';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import dagre from 'dagre';
import { Checkbox } from "@/components/ui/checkbox";

interface MindMapNode {
  id: string;
  text: string;
  children?: MindMapNode[];
  note?: string;
  color?: string;
}

interface MindMapResponse {
  title: string;
  rootNode: MindMapNode;
}

interface MindMapProps {
  fileKey: string;
  onSave?: (mindMap: MindMapResponse) => void;
}

interface NodeStyle {
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  fontSize: string;
  width?: number;
  height?: number;
  locked?: boolean;
}

interface CustomNodeData {
  label: string;
  note?: string;
  color?: string;
  style?: Partial<NodeStyle>;
  isEditing: boolean;
  tags?: string[];
  externalLink?: string;
  isCollapsed?: boolean;
  isHighlighted?: boolean;
  shouldDim?: boolean;
  parentId?: string;
  onLabelChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEditComplete: () => void;
  onAddChild?: () => void;
  onToggleCollapse?: () => void;
  onTagsChange?: (tags: string[]) => void;
  onLinkChange?: (link: string) => void;
}

interface SearchPanelProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  allTags: string[];
}

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 150, height: 50 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 75,
        y: nodeWithPosition.y - 25,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

const CustomNode = React.memo(({ data, id }: NodeProps<CustomNodeData>) => {
  const { getNode } = useReactFlow();
  const node = getNode(id);
  const isRoot = !node?.data?.parentId;

  return (
    <div
      className={cn(
        'px-4 py-2 shadow-lg rounded-lg border-2 min-w-[150px] relative group',
        'bg-white dark:bg-black',
        'transition-all duration-300 hover:shadow-xl',
        data.isEditing ? 'border-blue-500' : 'border-gray-200 dark:border-gray-800/20',
        data.style?.locked ? 'cursor-not-allowed' : 'cursor-move',
        data.isCollapsed ? 'opacity-80' : '',
        data.isHighlighted ? 'ring-2 ring-blue-500 dark:ring-blue-400' : '',
        !data.isHighlighted && data.shouldDim ? 'opacity-30' : '',
        isRoot ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20' : ''
      )}
      style={{ 
        borderColor: data.color,
        backgroundColor: data.style?.backgroundColor || (isRoot ? 'var(--blue-50)' : 'var(--background)'),
        color: data.style?.textColor || 'var(--foreground)',
        width: data.style?.width,
        height: data.style?.height,
        boxShadow: data.isHighlighted ? '0 0 0 2px var(--blue-500)' : undefined,
      }}
    >
      {data.isEditing ? (
        <Input
          value={data.label}
          onChange={data.onLabelChange}
          onBlur={data.onEditComplete}
          autoFocus
          className="w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
        />
      ) : (
        <>
          <div className="font-medium text-sm text-gray-900 dark:text-gray-100" style={{ fontSize: data.style?.fontSize || 'inherit' }}>
            {data.label}
          </div>
          {data.note && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">
              {data.note}
            </div>
          )}
          {data.tags && data.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {data.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          {data.externalLink && (
            <a
              href={data.externalLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 mt-1 block"
              onClick={(e) => e.stopPropagation()}
            >
              {data.externalLink}
            </a>
          )}
          {!data.style?.locked && (
            <div className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-6 w-6 p-0 rounded-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={(e) => {
                  e.stopPropagation();
                  data.onAddChild?.();
                }}
              >
                <Plus className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-6 w-6 p-0 rounded-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={(e) => {
                  e.stopPropagation();
                  data.onToggleCollapse?.();
                }}
              >
                {data.isCollapsed ? (
                  <ChevronRight className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </Button>
            </div>
          )}
          {data.style?.locked && (
            <div className="absolute -right-2 -top-2">
              <Lock className="h-3 w-3 text-gray-400 dark:text-gray-500" />
            </div>
          )}
        </>
      )}
    </div>
  );
});

CustomNode.displayName = 'CustomNode';

const nodeTypes = {
  custom: CustomNode,
};

const SearchPanel = React.memo(({ 
  searchQuery, 
  onSearchChange, 
  selectedTags, 
  onTagsChange,
  allTags 
}: SearchPanelProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 340, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  // Keep panel in bounds when window resizes
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => {
        const bounds = {
          x: Math.min(Math.max(20, prev.x), window.innerWidth - 340),
          y: Math.min(Math.max(20, prev.y), window.innerHeight - 400)
        };
        return bounds;
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (panelRef.current && e.target === panelRef.current.querySelector('.drag-handle')) {
      setIsDragging(true);
      const rect = panelRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging && panelRef.current) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // Keep panel in bounds
      const bounds = {
        x: Math.min(Math.max(20, newX), window.innerWidth - 340),
        y: Math.min(Math.max(20, newY), window.innerHeight - 400)
      };
      
      setPosition(bounds);
    }
  }, [isDragging, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add and remove event listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={panelRef}
      className={cn(
        "fixed z-50 transition-all duration-200",
        isDragging && "pointer-events-none select-none"
      )}
      style={{ 
        left: position.x,
        top: position.y,
        width: 320
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="bg-white dark:bg-black rounded-lg shadow-lg border">
        <div 
          className="flex items-center justify-between p-3 border-b drag-handle cursor-move"
          onMouseDown={(e) => e.preventDefault()}
        >
          <h3 className="font-medium select-none">Search & Filter</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hover:bg-transparent"
          >
            {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </div>
        
        {!isCollapsed && (
          <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800/20 p-4 space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Search Nodes
              </label>
              <Input
                placeholder="Search by text, notes, or tags..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full"
              />
            </div>
            {allTags.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Filter by Tags
                </label>
                <div className="max-h-40 overflow-y-auto space-y-2 pr-2 scrollbar-thin">
                  {allTags.map((tag: string) => (
                    <div key={`tag-filter-${tag}`} className="flex items-center gap-2">
                      <Checkbox
                        id={`tag-${tag}`}
                        checked={selectedTags.includes(tag)}
                        onCheckedChange={(checked) => {
                          onTagsChange(
                            checked
                              ? [...selectedTags, tag]
                              : selectedTags.filter((t: string) => t !== tag)
                          );
                        }}
                      />
                      <label
                        htmlFor={`tag-${tag}`}
                        className="text-sm cursor-pointer select-none"
                      >
                        {tag}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {(searchQuery || selectedTags.length > 0) && (
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onSearchChange('');
                    onTagsChange([]);
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

SearchPanel.displayName = 'SearchPanel';

const MindMapContent: React.FC<MindMapProps> = ({ fileKey, onSave }) => {
  const [nodes, setNodes] = useNodesState<CustomNodeData>([]);
  const [edges, setEdges] = useEdgesState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node<CustomNodeData> | null>(null);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { fitView, zoomIn, zoomOut } = useReactFlow();
  const [nodeStyle, setNodeStyle] = useState<NodeStyle>({
    backgroundColor: '#ffffff',
    textColor: '#000000',
    borderColor: '#E2E8F0',
    fontSize: '14px',
  });
  const [undoHistory, setUndoHistory] = useState<Array<{ nodes: Node<CustomNodeData>[]; edges: Edge[] }>>([]);
  const [redoHistory, setRedoHistory] = useState<Array<{ nodes: Node<CustomNodeData>[]; edges: Edge[] }>>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [layoutDirection, setLayoutDirection] = useState<'TB' | 'LR'>('TB');
  const [isSharing, setIsSharing] = useState(false);
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [isEditingLink, setIsEditingLink] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Get all unique tags from nodes
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    nodes.forEach(node => {
      node.data.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet);
  }, [nodes]);

  // Enhanced search and filter functionality
  const filteredAndHighlightedNodes = useMemo(() => {
    const searchLower = searchQuery.toLowerCase();
    
    return nodes.map(node => {
      const matchesSearch = searchLower === '' ||
        node.data.label.toLowerCase().includes(searchLower) ||
        node.data.note?.toLowerCase().includes(searchLower) ||
        node.data.tags?.some(tag => tag.toLowerCase().includes(searchLower));

      const matchesTags = selectedTags.length === 0 ||
        selectedTags.every(tag => node.data.tags?.includes(tag));

      const isMatch = matchesSearch && matchesTags;

      return {
        ...node,
        data: {
          ...node.data,
          isHighlighted: isMatch,
          shouldDim: searchLower !== '' && !isMatch
        }
      };
    });
  }, [nodes, searchQuery, selectedTags]);

  const updateNodeStyle = useCallback((nodeId: string, style: Partial<NodeStyle>) => {
    setNodes(nds => 
      nds.map(n => {
        if (n.id === nodeId) {
          const updatedNode = { ...n };
          updatedNode.data = {
            ...updatedNode.data,
            style: {
              ...updatedNode.data.style,
              ...style
            }
          };
          return updatedNode;
        }
        return n;
      })
    );
  }, [setNodes]);

  const convertMindMapToFlow = useCallback((mindMap: MindMapResponse) => {
    const nodes: Node<CustomNodeData>[] = [];
    const edges: Edge[] = [];
    let nodeId = 1;

    const processNode = (node: MindMapNode, parentId?: string, level = 0) => {
      const currentId = String(nodeId++);
      nodes.push({
        id: currentId,
        type: 'custom',
        position: { x: level * 250, y: nodes.length * 100 },
        data: {
          label: node.text,
          note: node.note,
          color: node.color || '#E2E8F0',
          isEditing: false,
          onLabelChange: (e: React.ChangeEvent<HTMLInputElement>) => {
            setNodes((nds) =>
              nds.map((n) =>
                n.id === currentId
                  ? { ...n, data: { ...n.data, label: e.target.value } }
                  : n
              )
            );
          },
          onEditComplete: () => {
            setNodes((nds) =>
              nds.map((n) =>
                n.id === currentId
                  ? { ...n, data: { ...n.data, isEditing: false } }
                  : n
              )
            );
          },
        },
      });

      if (parentId) {
        edges.push({
          id: `e${parentId}-${currentId}`,
          source: parentId,
          target: currentId,
          type: 'smoothstep',
          animated: true,
        });
      }

      node.children?.forEach((child) => processNode(child, currentId, level + 1));
    };

    processNode(mindMap.rootNode);
    return { nodes, edges };
  }, []);

  const generateMindMap = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/mindmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileKey }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate mind map');
      }

      const mindMap: MindMapResponse = await response.json();
      const { nodes: newNodes, edges: newEdges } = convertMindMapToFlow(mindMap);
      
      setNodes(newNodes);
      setEdges(newEdges);
      setTimeout(() => fitView(), 100);
      toast.success('Mind map generated successfully!');
    } catch (error) {
      console.error('Error generating mind map:', error);
      toast.error('Failed to generate mind map');
    } finally {
      setIsLoading(false);
    }
  }, [fileKey, convertMindMapToFlow, fitView, setNodes, setEdges]);

  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const updateNodeNote = useCallback((note: string) => {
    if (!selectedNode) return;
    setNodes((nds) =>
      nds.map((n) =>
        n.id === selectedNode.id
          ? { ...n, data: { ...n.data, note } }
          : n
      )
    );
  }, [selectedNode, setNodes]);

  const deleteNode = useCallback(() => {
    if (!selectedNode) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) =>
      eds.filter(
        (e) => e.source !== selectedNode.id && e.target !== selectedNode.id
      )
    );
    setSelectedNode(null);
  }, [selectedNode, setNodes, setEdges]);

  const saveMindMap = useCallback(() => {
    const mindMap: MindMapResponse = {
      title: "Mind Map",
      rootNode: {
        id: "root",
        text: nodes[0]?.data.label || "Mind Map",
        children: nodes.slice(1).map(node => ({
          id: node.id,
          text: node.data.label,
          note: node.data.note,
          color: node.data.color,
        })),
      },
    };
    onSave?.(mindMap);
    toast.success('Mind map saved!');
  }, [nodes, onSave]);

  const downloadImage = useCallback(() => {
    const svg = document.querySelector('.react-flow__renderer svg') as SVGElement;
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = 'mindmap.png';
        downloadLink.href = pngFile;
        downloadLink.click();
      };
      img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
    }
  }, []);

  const handleTagsChange = useCallback((nodeId: string, tags: string[]) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, tags } }
          : n
      )
    );
  }, [setNodes]);

  const handleLinkChange = useCallback((nodeId: string, link: string) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, externalLink: link } }
          : n
      )
    );
  }, [setNodes]);

  const toggleNodeCollapse = useCallback((nodeId: string) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, isCollapsed: !n.data.isCollapsed } }
          : n
      )
    );
    
    // Hide/show child nodes
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      const childEdges = edges.filter(e => e.source === nodeId);
      const childNodeIds = new Set(childEdges.map(e => e.target));
      
      setNodes((nds) =>
        nds.map((n) =>
          childNodeIds.has(n.id)
            ? { ...n, hidden: !n.hidden }
            : n
        )
      );
    }
  }, [nodes, edges, setNodes]);

  const addChildNode = useCallback((parentNode: Node) => {
    const newNodeId = `node-${nodes.length + 1}`;
    const newNode: Node = {
      id: newNodeId,
      type: 'custom',
      position: {
        x: parentNode.position.x + 250,
        y: parentNode.position.y,
      },
      data: {
        label: 'New Node',
        note: '',
        color: nodeStyle.borderColor,
        style: nodeStyle,
        isEditing: true,
        tags: [],
        isCollapsed: false,
        onLabelChange: (e: React.ChangeEvent<HTMLInputElement>) => {
          setNodes((nds) =>
            nds.map((n) =>
              n.id === newNodeId
                ? { ...n, data: { ...n.data, label: e.target.value } }
                : n
            )
          );
        },
        onEditComplete: () => {
          setNodes((nds) =>
            nds.map((n) =>
              n.id === newNodeId
                ? { ...n, data: { ...n.data, isEditing: false } }
                : n
            )
          );
        },
        onAddChild: () => addChildNode(nodes.find(n => n.id === newNodeId)!),
        onToggleCollapse: () => toggleNodeCollapse(newNodeId),
        onTagsChange: (tags: string[]) => handleTagsChange(newNodeId, tags),
        onLinkChange: (link: string) => handleLinkChange(newNodeId, link),
      },
    };

    const newEdge: Edge = {
      id: `e${parentNode.id}-${newNodeId}`,
      source: parentNode.id,
      target: newNodeId,
      type: 'smoothstep',
      animated: true,
      style: { stroke: nodeStyle.borderColor },
    };

    setUndoHistory(prev => [...prev, { nodes, edges }]);
    setNodes((nds) => [...nds, newNode]);
    setEdges((eds) => [...eds, newEdge]);
  }, [nodes, edges, nodeStyle, setNodes, setEdges, handleTagsChange, handleLinkChange, toggleNodeCollapse, setUndoHistory]);

  const handleUndo = useCallback(() => {
    if (undoHistory.length > 0) {
      const previous = undoHistory[undoHistory.length - 1];
      setRedoHistory(prev => [...prev, { nodes, edges }]);
      setNodes(previous.nodes);
      setEdges(previous.edges);
      setUndoHistory(prev => prev.slice(0, -1));
    }
  }, [nodes, edges, undoHistory]);

  const handleRedo = useCallback(() => {
    if (redoHistory.length > 0) {
      const next = redoHistory[redoHistory.length - 1];
      setUndoHistory(prev => [...prev, { nodes, edges }]);
      setNodes(next.nodes);
      setEdges(next.edges);
      setRedoHistory(prev => prev.slice(0, -1));
    }
  }, [nodes, edges, redoHistory]);

  const handleAutoLayout = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges, layoutDirection);
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [nodes, edges, layoutDirection, setNodes, setEdges]);

  const toggleNodeLock = useCallback((nodeId: string) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              data: {
                ...n.data,
                style: {
                  ...n.data.style,
                  locked: !n.data.style?.locked,
                },
              },
              draggable: !n.data.style?.locked,
            } as Node<CustomNodeData>
          : n
      )
    );
  }, [setNodes]);

  const exportMindMap = useCallback(() => {
    const data = {
      nodes,
      edges,
      nodeStyle,
    };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mindmap.json';
    link.click();
  }, [nodes, edges, nodeStyle]);

  const importMindMap = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          setNodes(data.nodes);
          setEdges(data.edges);
          setNodeStyle(data.nodeStyle);
          toast.success('Mind map imported successfully!');
        } catch (err) {
          console.error('Failed to import mind map:', err);
          toast.error('Failed to import mind map');
        }
      };
      reader.readAsText(file);
    }
  }, [setNodes, setEdges]);

  const shareMindMap = useCallback(() => {
    setIsSharing(true);
    const data = {
      nodes,
      edges,
      nodeStyle,
    };
    const jsonString = JSON.stringify(data);
    navigator.clipboard.writeText(jsonString).then(() => {
      toast.success('Mind map data copied to clipboard!');
      setIsSharing(false);
    });
  }, [nodes, edges, nodeStyle]);

  const handleNodeChanges = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => {
      const updatedNodes = changes.reduce((acc, change) => {
        if (change.type === 'remove') {
          // When removing a node, also remove its children
          const nodeToRemove = acc.find(n => n.id === change.id);
          if (nodeToRemove) {
            const childrenIds = new Set(
              edges
                .filter(e => e.source === nodeToRemove.id)
                .map(e => e.target)
            );
            return acc.filter(n => n.id !== change.id && !childrenIds.has(n.id));
          }
        }
        return applyNodeChanges([change], acc);
      }, nds);

      return updatedNodes;
    });
  }, [edges, setNodes]);

  const handleEdgeChanges = useCallback((changes: EdgeChange[]) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, [setEdges]);

  const handleConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return;
    
    const source = connection.source as string;
    const target = connection.target as string;
    
    setEdges((eds) => {
      const newEdge: Edge = {
        id: `e${source}-${target}`,
        source,
        target,
        type: 'smoothstep',
        animated: true,
        style: { stroke: nodeStyle.borderColor },
      };
      return [...eds, newEdge];
    });

    // Update parent ID for the target node
    setNodes((nds: Node<CustomNodeData>[]) =>
      nds.map((n) => {
        if (n.id === target) {
          return {
            ...n,
            data: {
              ...n.data,
              parentId: source
            }
          } as Node<CustomNodeData>;
        }
        return n;
      })
    );
  }, [setEdges, setNodes, nodeStyle]);

  return (
    <div className="w-full h-[600px] border rounded-lg relative" ref={reactFlowWrapper}>
      {/* Main Toolbar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-col gap-2">
        {/* Top Row - Primary Actions */}
        <div className="flex items-center justify-between bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <Button
              onClick={generateMindMap}
              disabled={isLoading}
              className="gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white"
              size="sm"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Generate Mind Map
                </>
              )}
            </Button>
            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />
            <Select
              value={layoutDirection}
              onValueChange={(value: 'TB' | 'LR') => setLayoutDirection(value)}
            >
              <SelectTrigger className="w-40 h-9 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <SelectValue placeholder="Layout Direction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TB">Top to Bottom</SelectItem>
                <SelectItem value="LR">Left to Right</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleAutoLayout} title="Auto Layout" className="border-gray-200 dark:border-gray-700">
              <Layout className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleUndo}
                title="Undo"
                disabled={undoHistory.length === 0}
              >
                <Undo className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRedo}
                title="Redo"
                disabled={redoHistory.length === 0}
              >
                <Redo className="h-4 w-4" />
              </Button>
            </div>
            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => zoomIn()}
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => zoomOut()}
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            </div>
            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={downloadImage} title="Download as PNG">
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={saveMindMap} title="Save Mind Map">
                <Save className="h-4 w-4" />
              </Button>
            </div>
            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={shareMindMap} disabled={isSharing} title="Share Mind Map">
                <Share2 className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={exportMindMap} title="Export as JSON">
                <FileDown className="h-4 w-4" />
              </Button>
              <div className="relative">
                <Button variant="outline" size="sm" title="Import from JSON">
                  <FileUp className="h-4 w-4" />
                </Button>
                <input
                  type="file"
                  accept=".json"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={importMindMap}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Panel */}
      <SearchPanel
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedTags={selectedTags}
        onTagsChange={setSelectedTags}
        allTags={allTags}
      />

      {/* Mind Map Canvas */}
      <ReactFlow
        nodes={filteredAndHighlightedNodes}
        edges={edges}
        onNodesChange={handleNodeChanges}
        onEdgesChange={handleEdgeChanges}
        onConnect={handleConnect}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={4}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={true}
        snapToGrid={true}
        snapGrid={[15, 15]}
        deleteKeyCode={["Backspace", "Delete"]}
        multiSelectionKeyCode={["Control", "Meta"]}
        selectionKeyCode={["Shift"]}
        zoomActivationKeyCode={["Alt"]}
        panActivationKeyCode={["Space"]}
        preventScrolling={true}
        onlyRenderVisibleElements={true}
        style={{ background: 'var(--background)' }}
      >
        <Background gap={15} size={1} color="var(--border)" />
        <Controls 
          showInteractive={true}
          position="bottom-right"
          style={{ marginBottom: '80px', marginRight: '15px' }}
          className="bg-white dark:bg-black border-gray-200 dark:border-gray-800/20"
        />
      </ReactFlow>

      {/* Node Properties Panel */}
      {selectedNode && (
        <div className="absolute bottom-4 left-4 right-4 bg-white dark:bg-black border border-gray-200 dark:border-gray-800/20 p-4 rounded-lg shadow-lg max-h-[300px] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">Node Properties</h3>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleNodeLock(selectedNode.id)}
                className="hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {selectedNode.data.style?.locked ? (
                  <Lock className="h-4 w-4" />
                ) : (
                  <Unlock className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setNodes((nds) =>
                    nds.map((n) =>
                      n.id === selectedNode.id
                        ? { ...n, data: { ...n.data, isEditing: true } }
                        : n
                    )
                  );
                }}
                className="hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="hover:bg-gray-100 dark:hover:bg-gray-700">
                    <Settings2 className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Background Color</label>
                      <ChromePicker
                        color={nodeStyle.backgroundColor}
                        onChange={(color) => {
                          setNodeStyle(prev => ({ ...prev, backgroundColor: color.hex }));
                          updateNodeStyle(selectedNode.id, { backgroundColor: color.hex });
                        }}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Text Color</label>
                      <ChromePicker
                        color={nodeStyle.textColor}
                        onChange={(color) => {
                          setNodeStyle(prev => ({ ...prev, textColor: color.hex }));
                          updateNodeStyle(selectedNode.id, { textColor: color.hex });
                        }}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Font Size</label>
                      <Select
                        value={nodeStyle.fontSize}
                        onValueChange={(value) => {
                          setNodeStyle(prev => ({ ...prev, fontSize: value }));
                          updateNodeStyle(selectedNode.id, { fontSize: value });
                        }}
                      >
                        <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                          <SelectValue placeholder="Select font size" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                          <SelectItem value="12px">Small</SelectItem>
                          <SelectItem value="14px">Medium</SelectItem>
                          <SelectItem value="16px">Large</SelectItem>
                          <SelectItem value="18px">Extra Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <Button
                variant="ghost"
                size="sm"
                onClick={deleteNode}
                className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            {isEditingNote ? (
              <Textarea
                value={selectedNode.data.note || ''}
                onChange={(e) => updateNodeNote(e.target.value)}
                onBlur={() => setIsEditingNote(false)}
                placeholder="Add a note..."
                className="w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
                autoFocus
              />
            ) : (
              <div
                onClick={() => setIsEditingNote(true)}
                className="min-h-[60px] p-2 border border-gray-200 dark:border-gray-700 rounded cursor-text text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                {selectedNode.data.note || 'Click to add a note...'}
              </div>
            )}
          </div>
          <div className="space-y-2 mt-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Tags</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingTags(!isEditingTags)}
                className="hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>
            {isEditingTags ? (
              <Input
                value={selectedNode.data.tags?.join(', ') || ''}
                onChange={(e) => handleTagsChange(
                  selectedNode.id,
                  e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                )}
                onBlur={() => setIsEditingTags(false)}
                placeholder="Add tags (comma-separated)..."
                className="w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
              />
            ) : (
              <div className="flex flex-wrap gap-1">
                {selectedNode.data.tags?.map((tag, index) => (
                  <span
                    key={`node-${selectedNode.id}-tag-${tag}-${index}`}
                    className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded"
                  >
                    {tag}
                  </span>
                )) || 'No tags'}
              </div>
            )}

            <div className="flex items-center justify-between mt-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">External Link</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingLink(!isEditingLink)}
                className="hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>
            {isEditingLink ? (
              <Input
                value={selectedNode.data.externalLink || ''}
                onChange={(e) => handleLinkChange(selectedNode.id, e.target.value)}
                onBlur={() => setIsEditingLink(false)}
                placeholder="Add external link..."
                className="w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
              />
            ) : (
              <div className="text-gray-900 dark:text-gray-100">
                {selectedNode.data.externalLink ? (
                  <a
                    href={selectedNode.data.externalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {selectedNode.data.externalLink}
                  </a>
                ) : (
                  'No external link'
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const MindMap = ({ fileKey, onSave }: MindMapProps) => {
  return (
    <div className="w-full h-[600px] border rounded-lg relative">
      <ReactFlowProvider>
        <MindMapContent fileKey={fileKey} onSave={onSave} />
      </ReactFlowProvider>
    </div>
  );
};

export default MindMap; 