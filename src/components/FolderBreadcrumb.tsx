import React from 'react';
import { ChevronRight, Home, ArrowLeft } from 'lucide-react';
import type { TreeItem } from '../utils/folderTree';

interface FolderBreadcrumbProps {
  breadcrumbs: TreeItem[];
  currentFolderId: string | null;
  onNavigateToFolder: (folderId: string | null) => void;
  onNavigateBack: () => void;
  canNavigateBack: boolean;
  className?: string;
}

const FolderBreadcrumb: React.FC<FolderBreadcrumbProps> = ({
  breadcrumbs = [],
  currentFolderId,
  onNavigateToFolder,
  onNavigateBack,
  canNavigateBack,
  className = ''
}) => {
  const handleBreadcrumbClick = (folderId: string | null) => {
    if (folderId !== currentFolderId) {
      onNavigateToFolder(folderId);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Pulsante Indietro */}
      {canNavigateBack && (
        <button
          onClick={onNavigateBack}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
          title="Torna indietro"
        >
          <ArrowLeft className="w-4 h-4" />
          Indietro
        </button>
      )}

      {/* Separatore se c'è il pulsante indietro */}
      {canNavigateBack && (
        <div className="w-px h-4 bg-gray-300 mx-1" />
      )}

      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-1 text-sm">
        {/* Home/Root */}
        <button
          onClick={() => handleBreadcrumbClick(null)}
          className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
            currentFolderId === null
              ? 'text-blue-600 bg-blue-50 font-medium'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
          }`}
          title="Vai alla cartella principale"
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
        </button>

        {/* Breadcrumb Items */}
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;
          const isClickable = !isLast && item.type === 'folder';

          return (
            <React.Fragment key={item.id}>
              {/* Separatore */}
              <ChevronRight className="w-4 h-4 text-gray-400" />
              
              {/* Breadcrumb Item */}
              {isClickable ? (
                <button
                  onClick={() => handleBreadcrumbClick(item.id)}
                  className="flex items-center gap-1 px-2 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                  title={`Vai a ${item.type === 'folder' ? item.name : item.title}`}
                >
                  {item.type === 'folder' && (
                    <span className="text-base">{item.icon}</span>
                  )}
                  <span className="max-w-32 truncate">
                    {item.type === 'folder' ? item.name : item.title}
                  </span>
                </button>
              ) : (
                <div
                  className={`flex items-center gap-1 px-2 py-1 rounded-md ${
                    isLast
                      ? 'text-blue-600 bg-blue-50 font-medium'
                      : 'text-gray-500'
                  }`}
                >
                  {item.type === 'folder' && (
                    <span className="text-base">{item.icon}</span>
                  )}
                  <span className="max-w-32 truncate" title={item.type === 'folder' ? item.name : item.title}>
                    {item.type === 'folder' ? item.name : item.title}
                  </span>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </nav>

      {/* Indicatore cartella vuota */}
      {breadcrumbs.length === 0 && currentFolderId === null && (
        <span className="text-sm text-gray-500 ml-2">
          Cartella principale
        </span>
      )}
    </div>
  );
};

export default FolderBreadcrumb;