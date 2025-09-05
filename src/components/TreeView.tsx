import React, { useState, useEffect } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileText,
  Home
} from 'lucide-react';
import DB, { WorkoutPlan, WorkoutFolder } from '../utils/database';
import { AVAILABLE_ICONS } from './FolderCustomizer';

interface TreeNode {
  id: string;
  name: string;
  type: 'folder' | 'workout';
  parentId: string | null;
  children: TreeNode[];
  isExpanded: boolean;
  data: WorkoutFolder | WorkoutPlan;
}

interface TreeViewProps {
  currentFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
  onWorkoutSelect?: (workoutId: string) => void;
}

const TreeView: React.FC<TreeViewProps> = ({
  currentFolderId,
  onFolderSelect,
  onWorkoutSelect
}) => {
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadTreeData();
  }, []);

  const loadTreeData = async () => {
    const folders = await DB.getWorkoutFolders();
    const workouts = await DB.getWorkoutPlans();
    
    const buildTree = (parentId: string | null = null): TreeNode[] => {
      const folderNodes = folders
        .filter(folder => folder.parentId === parentId)
        .map(folder => ({
          id: folder.id,
          name: folder.name,
          type: 'folder' as const,
          parentId: folder.parentId,
          isExpanded: expandedNodes.has(folder.id),
          data: folder,
          children: buildTree(folder.id)
        }));

      const workoutNodes = workouts
        .filter(workout => workout.folderId === parentId)
        .map(workout => ({
          id: workout.id,
          name: workout.name,
          type: 'workout' as const,
          parentId: workout.folderId,
          isExpanded: false,
          data: workout,
          children: []
        }));

      return [...folderNodes, ...workoutNodes];
    };

    setTreeData(buildTree());
  };

  const toggleNode = async (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
    
    // Aggiorna anche il database per le cartelle
    const folders = await DB.getWorkoutFolders();
    const folder = folders.find(f => f.id === nodeId);
    if (folder) {
      const updatedFolder = {
        ...folder,
        isExpanded: newExpanded.has(nodeId),
        updatedAt: new Date().toISOString()
      };
      await DB.saveWorkoutFolder(updatedFolder);
    }
    
    await loadTreeData();
  };

  const handleNodeClick = (node: TreeNode) => {
    if (node.type === 'folder') {
      onFolderSelect(node.id);
    } else if (node.type === 'workout' && onWorkoutSelect) {
      onWorkoutSelect(node.id);
    }
  };

  const getNodeIcon = (node: TreeNode) => {
    if (node.type === 'folder') {
      const folderData = node.data as WorkoutFolder;
      if (folderData.icon) {
        const iconData = AVAILABLE_ICONS.find(icon => icon.name === folderData.icon);
        if (iconData) {
          const IconComponent = iconData.component;
          return <IconComponent size={16} />;
        }
      }
      return node.isExpanded ? <FolderOpen size={16} /> : <Folder size={16} />;
    }
    return <FileText size={16} />;
  };

  const getNodeColor = (node: TreeNode) => {
    if (node.type === 'folder') {
      const folderData = node.data as WorkoutFolder;
      return folderData.color || '#3B82F6';
    } else {
      const workoutData = node.data as WorkoutPlan;
      return workoutData.color || '#10B981';
    }
  };

  const renderNode = (node: TreeNode, level: number = 0) => {
    const isSelected = node.type === 'folder' && node.id === currentFolderId;
    const hasChildren = node.children.length > 0;
    const nodeColor = getNodeColor(node);

    return (
      <div key={node.id} className="select-none">
        <div
          className={`flex items-center py-1 px-2 rounded cursor-pointer transition-colors ${
            isSelected
              ? 'bg-red-50 text-red-700 border-l-2 border-red-500'
              : 'hover:bg-gray-50'
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => handleNodeClick(node)}
        >
          {/* Icona espansione per cartelle con figli */}
          {node.type === 'folder' && hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.id);
              }}
              className="mr-1 p-0.5 hover:bg-gray-200 rounded"
            >
              {node.isExpanded ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )}
            </button>
          )}
          
          {/* Spazio per allineamento se non ha figli */}
          {!(node.type === 'folder' && hasChildren) && (
            <div className="w-5 mr-1" />
          )}
          
          {/* Icona del nodo */}
          <div 
            className="mr-2 flex-shrink-0"
            style={{ color: nodeColor }}
          >
            {getNodeIcon(node)}
          </div>
          
          {/* Nome del nodo */}
          <span className="text-sm truncate flex-1">
            {node.name}
          </span>
          
          {/* Contatore per cartelle */}
          {node.type === 'folder' && (
            <span className="text-xs text-gray-500 ml-2">
              {node.children.length}
            </span>
          )}
        </div>
        
        {/* Figli del nodo */}
        {node.type === 'folder' && node.isExpanded && hasChildren && (
          <div>
            {node.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full bg-white border-r border-gray-200 overflow-y-auto">
      {/* Header */}
      <div className="p-3 border-b border-gray-200">
        <h3 className="font-medium text-gray-900 text-sm">Navigazione</h3>
      </div>
      
      {/* Root folder */}
      <div className="p-2">
        <div
          className={`flex items-center py-2 px-2 rounded cursor-pointer transition-colors ${
            currentFolderId === null
              ? 'bg-red-50 text-red-700 border-l-2 border-red-500'
              : 'hover:bg-gray-50'
          }`}
          onClick={() => onFolderSelect(null)}
        >
          <Home size={16} className="mr-2 text-gray-600" />
          <span className="text-sm font-medium">Home</span>
        </div>
        
        {/* Tree nodes */}
        <div className="mt-2">
          {treeData.map(node => renderNode(node))}
        </div>
        
        {/* Empty state */}
        {treeData.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Folder size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nessuna cartella o scheda</p>
            <p className="text-xs">Crea la tua prima cartella</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TreeView;