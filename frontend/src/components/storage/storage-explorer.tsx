"use client";

import { useState, useEffect, useRef } from "react";
import api from "@/lib/api";
import { Folder, File as FileIcon, Upload, ArrowLeft, Loader2, MoreVertical, Trash2, X, FileText, Share2, Search, LayoutGrid, List, Eye, ArrowUpDown, ArrowUp, ArrowDown, CheckSquare, Square, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { DndContext, useDraggable, useDroppable, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface StorageItem {
  id: string;
  name: string;
  createdAt: string;
}

interface StorageFolder extends StorageItem {
  parentId: string | null;
  files?: StorageFile[];
  children?: StorageFolder[];
}

interface StorageFile extends StorageItem {
  size: number;
  mimeType: string;
  originalName: string;
  path: string;
  isPublic: boolean;
}

const AuthorizedImage = ({ src, alt, className, ...props }: any) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let objectUrl: string | null = null;
        let active = true;

        const fetchImage = async () => {
            try {
                const res = await api.get(src, { responseType: 'blob' });
                if (active) {
                    objectUrl = URL.createObjectURL(res.data);
                    setImageUrl(objectUrl);
                    setLoading(false);
                }
            } catch (err) {
                if (active) setLoading(false);
            }
        };

        if (src) fetchImage();

        return () => {
            active = false;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [src]);

    if (loading) return <div className={`bg-secondary animate-pulse flex items-center justify-center ${className}`}><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>;
    if (!imageUrl) return <div className={`bg-secondary flex items-center justify-center ${className}`}><FileIcon className="h-8 w-8 text-muted-foreground" /></div>;

    return <img src={imageUrl} alt={alt} className={className} {...props} />;
};

const DraggableFile = ({ file, children }: { file: StorageFile, children: React.ReactNode }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `file-${file.id}`,
        data: { type: 'file', file }
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        zIndex: isDragging ? 100 : undefined,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
            {children}
        </div>
    );
};

const DroppableFolder = ({ folder, children, onClick }: { folder: StorageFolder, children: React.ReactNode, onClick: () => void }) => {
    const { setNodeRef, isOver } = useDroppable({
        id: `folder-${folder.id}`,
        data: { type: 'folder', folder }
    });

    return (
        <div 
            ref={setNodeRef} 
            onClick={onClick}
            className={cn(
                "transition-all rounded-lg",
                isOver ? "bg-primary/20 scale-105 ring-2 ring-primary" : ""
            )}
        >
            {children}
        </div>
    );
};

export function StorageExplorer() {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folders, setFolders] = useState<StorageFolder[]>([]);
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<StorageFolder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Upload State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Folder Creation State
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isPublicUpload, setIsPublicUpload] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
  const [activeDragItem, setActiveDragItem] = useState<any>(null);

  // Selection Box State
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{ startX: number, startY: number, endX: number, endY: number } | null>(null);
  const [initialSelectedItems, setInitialSelectedItems] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
        activationConstraint: {
            distance: 8, // 8px movement required to start drag, allowing clicks
        },
    })
  );

  // View & Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [previewFile, setPreviewFile] = useState<StorageFile | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Sort State
  const [sortConfig, setSortConfig] = useState<{ key: 'name' | 'size' | 'createdAt', direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });

  const handleSort = (key: 'name' | 'size' | 'createdAt') => {
      setSortConfig(current => ({
          key,
          direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
      }));
  };

  const getSortedData = (data: any[]) => {
      return [...data].sort((a, b) => {
          const modifier = sortConfig.direction === 'asc' ? 1 : -1;
          if (sortConfig.key === 'size') {
             const sizeA = a.size || 0;
             const sizeB = b.size || 0;
             return (sizeA - sizeB) * modifier;
          }
          if (sortConfig.key === 'createdAt') {
              return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * modifier;
          }
          return a.name.localeCompare(b.name || b.originalName) * modifier;
      });
  };

  // Filtered & Sorted Content
  const filteredFolders = getSortedData(folders.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase())));
  const filteredFiles = getSortedData(files.filter(f => f.originalName.toLowerCase().includes(searchQuery.toLowerCase())));

  const handleSelectItem = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (e?.ctrlKey || e?.metaKey) {
        // Toggle selection
        setSelectedItems(prev => {
            if (prev.includes(id)) return prev.filter(i => i !== id);
            return [...prev, id];
        });
        setLastSelectedId(id);
    } else if (e?.shiftKey && lastSelectedId) {
        // Range Select
        const allFiles = filteredFiles; 
        const allIds = allFiles.map(f => f.id);
        const start = allIds.indexOf(lastSelectedId);
        const end = allIds.indexOf(id);
        
        if (start !== -1 && end !== -1) {
            const rangeIds = allIds.slice(Math.min(start, end), Math.max(start, end) + 1);
            setSelectedItems(rangeIds);
        } else {
            setSelectedItems([id]);
            setLastSelectedId(id);
        }
    } else {
        // Single Select
        setSelectedItems([id]);
        setLastSelectedId(id);
    }
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredFiles.length) {
        setSelectedItems([]);
    } else {
        setSelectedItems(filteredFiles.map(f => f.id));
    }
  };

  const handleBulkDelete = async () => {
      if (!selectedItems.length) return;
      if (!confirm(`${selectedItems.length} dosyayı silmek istediğinize emin misiniz?`)) return;

      try {
          setIsLoading(true);
          // Delete sequentially to avoid issues or implement bulk delete endpoint
          for (const id of selectedItems) {
              await api.delete(`/storage/file/${id}`);
          }
          toast.success("Seçili dosyalar silindi");
          setSelectedItems([]);
          fetchContent(currentFolderId);
      } catch (err) {
          toast.error("Silme işlemi başarısız");
      } finally {
          setIsLoading(false);
      }
  };

  const handleBulkTogglePublic = async (status: boolean) => {
    if (!selectedItems.length) return;
    try {
        setIsLoading(true);
        for (const id of selectedItems) {
            await api.patch(`/storage/file/${id}`, { isPublic: status });
        }
        toast.success(`Seçili dosyalar ${status ? 'paylaşıldı' : 'paylaşımı kaldırıldı'}`);
        setSelectedItems([]);
        fetchContent(currentFolderId);
    } catch (err) {
        toast.error("İşlem başarısız");
    } finally {
        setIsLoading(false);
    }
  };

  const handleDragEnd = async (event: any) => {
      const { active, over } = event;
      setActiveDragItem(null);

      if (!over) return;

      const activeId = active.id.replace('file-', '');
      const overId = over.id.replace('folder-', '');

      // Moving file to folder
      if (active.data.current?.type === 'file' && over.data.current?.type === 'folder') {
          // Check if multiple items selected and the dragged one is part of them
          let itemsToMove = [activeId];
          if (selectedItems.includes(activeId)) {
              itemsToMove = selectedItems;
          }

          if(!confirm(`${itemsToMove.length} dosyayı "${over.data.current.folder.name}" klasörüne taşımak istiyor musunuz?`)) return;

          try {
              setIsLoading(true);
              for (const id of itemsToMove) {
                  await api.post(`/storage/file/${id}/move`, { targetFolderId: overId });
              }
              toast.success("Dosyalar taşındı");
              setSelectedItems([]);
              fetchContent(currentFolderId);
          } catch (err: any) {
              toast.error(err.response?.data?.message || "Taşıma başarısız");
          } finally {
              setIsLoading(false);
          }
      }
  };

  const handleDragStart = (event: any) => {
      setActiveDragItem(event.active.data.current);
  };

  // Box Selection Logic
  const handleMouseDown = (e: React.MouseEvent) => {
      // If target is button or interactive, ignore
      if ((e.target as HTMLElement).closest('button, .interactive')) return;
      
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const startX = e.clientX - rect.left;
      const startY = e.clientY - rect.top;

      setIsSelecting(true);
      setSelectionBox({
          startX,
          startY,
          endX: startX,
          endY: startY
      });

      // Snapshot selection for modifiers
      if (e.ctrlKey || e.metaKey) {
          setInitialSelectedItems(selectedItems);
      } else if (e.shiftKey) {
          setInitialSelectedItems(selectedItems);
      } else {
          // Clear selection if clicking on empty space without modifiers
          setSelectedItems([]);
          setInitialSelectedItems([]);
      }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (!isSelecting || !selectionBox || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;

      const newBox = {
          ...selectionBox,
          endX: currentX,
          endY: currentY
      };
      setSelectionBox(newBox);

      const boxLeft = Math.min(newBox.startX, newBox.endX);
      const boxTop = Math.min(newBox.startY, newBox.endY);
      const boxRight = Math.max(newBox.startX, newBox.endX);
      const boxBottom = Math.max(newBox.startY, newBox.endY);

      if (Math.abs(newBox.endX - newBox.startX) > 2 || Math.abs(newBox.endY - newBox.startY) > 2) {
          const inBoxIds: string[] = [];
          const fileElements = document.querySelectorAll('[data-file-id]');
          
          fileElements.forEach((el) => {
              const elRect = el.getBoundingClientRect();
              const elLeft = elRect.left - rect.left;
              const elTop = elRect.top - rect.top;
              const elRight = elLeft + elRect.width;
              const elBottom = elTop + elRect.height;

              if (elLeft < boxRight && elRight > boxLeft && elTop < boxBottom && elBottom > boxTop) {
                  inBoxIds.push(el.getAttribute('data-file-id')!);
              }
          });

          if (e.ctrlKey || e.metaKey) {
              const combined = new Set([...initialSelectedItems, ...inBoxIds]);
              setSelectedItems(Array.from(combined));
          } else {
              setSelectedItems(inBoxIds);
          }
      }
  };

  const handleMouseUp = () => {
      setIsSelecting(false);
      setSelectionBox(null);
      setInitialSelectedItems([]);
  };

  const handleTogglePublic = async (file: StorageFile) => {
    try {
        await api.patch(`/storage/file/${file.id}`, { isPublic: !file.isPublic });
        toast.success(`Dosya ${!file.isPublic ? 'paylaşıldı' : 'paylaşımı kaldırıldı'}`);
        fetchContent(currentFolderId);
    } catch (err) {
        toast.error("İşlem başarısız");
    }
  };

  const handlePreview = async (file: StorageFile) => {
    if (file.mimeType.startsWith('image/')) {
        try {
            const res = await api.get(`/storage/file/${file.id}/preview`, { responseType: 'blob' });
            const url = URL.createObjectURL(res.data);
            setPreviewUrl(url);
            setPreviewFile(file);
        } catch (err) {
            console.error(err);
            toast.error("Önizleme yüklenemedi");
        }
    } else {
        try {
            const res = await api.get(`/storage/file/${file.id}/preview`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', file.originalName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => window.URL.revokeObjectURL(url), 100);
         } catch(err) {
             toast.error("Dosya indirilemedi");
         }
    }
  };

  const fetchContent = async (folderId: string | null) => {
    try {
      setIsLoading(true);
      const res = await api.get('/storage/content', { params: { folderId } });
      setFolders(res.data.folders);
      setFiles(res.data.files);
      setBreadcrumbs(res.data.breadcrumbs || []);
    } catch (err) {
      toast.error("Dosyalar yüklenemedi");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContent(currentFolderId);
  }, [currentFolderId]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    abortControllerRef.current = new AbortController();

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const formData = new FormData();
        formData.append('file', file);
        if (currentFolderId) formData.append('folderId', currentFolderId);
        formData.append('isPublic', String(isPublicUpload));

        // Reset progress for each file or calculate total?
        // Let's show progress for current file being uploaded
        
        await api.post('/storage/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          signal: abortControllerRef.current.signal,
          onUploadProgress: (progressEvent) => {
            const total = progressEvent.total || file.size;
            const currentFileProgress = Math.round((progressEvent.loaded * 100) / total);
            
            // Calculate total progress based on file count
            // (Completed files * 100 + current file progress) / Total files
            const totalProgress = Math.round(((i * 100) + currentFileProgress) / selectedFiles.length);
            setUploadProgress(totalProgress);
          }
        });
      }
      
      toast.success("Dosyalar başarıyla yüklendi");
      fetchContent(currentFolderId);
      closeUploadModal();
    } catch (err: any) {
      if (err.name === 'CanceledError' || err.message === 'canceled') {
        toast.info("Yükleme iptal edildi");
      } else {
        toast.error(err.response?.data?.message || "Yükleme başarısız");
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      abortControllerRef.current = null;
    }
  };

  const cancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const openUploadModal = () => {
    setSelectedFiles([]);
    setUploadProgress(0);
    setIsPublicUpload(false);
    setIsUploadModalOpen(true);
  };

  const closeUploadModal = () => {
    if (isUploading) {
        if(!confirm("Yükleme işlemi iptal edilecek. Emin misiniz?")) return;
        cancelUpload();
    }
    setIsUploadModalOpen(false);
    setSelectedFiles([]);
    setUploadProgress(0);
    setIsPublicUpload(false);
  };

  const handleDeleteFile = async (fileId: string) => {
    if(!confirm("Dosyayı silmek istediğinize emin misiniz?")) return;
    try {
        await api.delete(`/storage/file/${fileId}`);
        toast.success("Dosya silindi");
        fetchContent(currentFolderId);
    } catch (err) {
        toast.error("Dosya silinemedi");
    }
  };

  const openCreateFolderModal = () => {
    setNewFolderName("");
    setIsCreateFolderOpen(true);
  };

  const handleCreateFolder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!newFolderName.trim()) return;

    try {
      setIsCreatingFolder(true);
      await api.post('/storage/folder', {
        name: newFolderName,
        parentId: currentFolderId
      });
      toast.success("Klasör oluşturuldu");
      fetchContent(currentFolderId);
      setIsCreateFolderOpen(false);
      setNewFolderName("");
    } catch (err) {
      toast.error("Klasör oluşturulamadı");
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
    >
    <div 
        className="p-6 space-y-6 select-none" 
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Dosya Yöneticisi</h2>
            <div className="flex gap-2">
            {selectedItems.length > 0 ? (
                <>
                     <Button variant="outline" onClick={() => handleBulkTogglePublic(true)}>
                        <Share2 className="mr-2 h-4 w-4" /> Tümünü Paylaş
                    </Button>
                    <Button variant="outline" onClick={() => handleBulkTogglePublic(false)}>
                        <Share2 className="mr-2 h-4 w-4 text-muted-foreground" /> Paylaşımı Kaldır
                    </Button>
                    <Button variant="destructive" onClick={handleBulkDelete}>
                        <Trash2 className="mr-2 h-4 w-4" /> ({selectedItems.length}) Sil
                    </Button>
                </>
            ) : (
                <>
                    <Button variant="outline" onClick={openCreateFolderModal} disabled={isLoading}>
                        <Folder className="mr-2 h-4 w-4" /> Yeni Klasör
                    </Button>
                    <Button onClick={openUploadModal}>
                        <Upload className="mr-2 h-4 w-4" /> Dosya Yükle
                    </Button>
                </>
            )}
            </div>
        </div>
        
        <div className="flex items-center gap-4 bg-muted/30 p-2 rounded-lg">
             <div className="flex items-center pl-2">
                 <Button variant="ghost" size="icon" onClick={handleSelectAll} title="Tümünü Seç">
                     {selectedItems.length > 0 && selectedItems.length === filteredFiles.length ? (
                         <CheckSquare className="h-5 w-5 text-primary" />
                     ) : (
                         <Square className="h-5 w-5 text-muted-foreground" />
                     )}
                 </Button>
             </div>
            <div className="relative flex-1 md:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Dosya veya klasör ara..." 
                    className="pl-8 bg-background" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <div className="flex items-center border rounded-lg bg-background">
                <Button 
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                    size="icon"
                    onClick={() => setViewMode('grid')}
                    className="h-9 w-9 rounded-none rounded-l-lg"
                >
                    <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button 
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                    size="icon"
                    onClick={() => setViewMode('list')}
                    className="h-9 w-9 rounded-none rounded-r-lg"
                >
                    <List className="h-4 w-4" />
                </Button>
            </div>
            
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-9 w-9">
                        <ArrowUpDown className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleSort('name')}>
                        {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? <ArrowUp className="mr-2 h-4 w-4" /> : <ArrowDown className="mr-2 h-4 w-4" />)}
                        Ad'a Göre
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSort('size')}>
                        {sortConfig.key === 'size' && (sortConfig.direction === 'asc' ? <ArrowUp className="mr-2 h-4 w-4" /> : <ArrowDown className="mr-2 h-4 w-4" />)}
                        Boyuta Göre
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSort('createdAt')}>
                        {sortConfig.key === 'createdAt' && (sortConfig.direction === 'asc' ? <ArrowUp className="mr-2 h-4 w-4" /> : <ArrowDown className="mr-2 h-4 w-4" />)}
                        Tarihe Göre
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>

      {/* Create Folder Modal */}
      <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Yeni Klasör Oluştur</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateFolder} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="folderName">Klasör Adı</Label>
              <Input 
                id="folderName" 
                value={newFolderName} 
                onChange={(e) => setNewFolderName(e.target.value)} 
                placeholder="Örn: Proje Dokümanları"
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateFolderOpen(false)}>
                İptal
              </Button>
              <Button type="submit" disabled={isCreatingFolder}>
                {isCreatingFolder ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Oluştur
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Upload Modal */}
      <Dialog open={isUploadModalOpen} onOpenChange={closeUploadModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Dosya Yükle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
             {selectedFiles.length === 0 ? (
               <div 
                 className={cn(
                   "border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors",
                   dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
                 )}
                 onDragEnter={handleDrag}
                 onDragLeave={handleDrag}
                 onDragOver={handleDrag}
                 onDrop={handleDrop}
                 onClick={() => fileInputRef.current?.click()}
               >
                 <input 
                   ref={fileInputRef}
                   type="file" 
                   multiple
                   className="hidden" 
                   onChange={handleFileSelect}
                 />
                 <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                 <p className="text-sm font-medium">
                   Dosyaları buraya sürükleyin veya seçmek için tıklayın
                 </p>
                 <p className="text-xs text-muted-foreground mt-2">
                   Maksimum dosya boyutu limitinize göre değişir
                 </p>
               </div>
             ) : (
               <div className="space-y-4">
                 <div className="max-h-[200px] overflow-y-auto space-y-2">
                    {selectedFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-4 p-3 border rounded-lg relative">
                            {/* Remove button only if not uploading */}
                            {!isUploading && (
                                <Button 
                                variant="ghost" 
                                size="icon" 
                                className="absolute top-2 right-2 h-6 w-6"
                                onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))}
                                >
                                <X className="h-4 w-4" />
                                </Button>
                            )}
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <FileText className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{file.name}</p>
                                <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
                            </div>
                        </div>
                    ))}
                 </div>

                 {isUploading && (
                   <div className="space-y-2">
                     <div className="flex justify-between text-xs text-muted-foreground">
                       <span>Yükleniyor... ({selectedFiles.length} dosya)</span>
                       <span>{uploadProgress}%</span>
                     </div>
                     <div className="h-2 bg-secondary rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-primary transition-all duration-300" 
                         style={{ width: `${uploadProgress}%` }}
                       />
                     </div>
                   </div>
                 )}

                 <div className="flex items-center space-x-2 border p-3 rounded-lg bg-muted/50">
                    <Switch 
                        id="public-mode" 
                        checked={isPublicUpload} 
                        onCheckedChange={setIsPublicUpload}
                        disabled={isUploading}
                    />
                    <Label htmlFor="public-mode" className="flex items-center gap-2 cursor-pointer">
                        <Share2 className="h-4 w-4" />
                        <span>Müşteri ile Paylaş (Public)</span>
                    </Label>
                 </div>

                 <div className="flex justify-end gap-2">
                   {isUploading ? (
                     <Button variant="destructive" onClick={cancelUpload}>
                       İptal Et
                     </Button>
                   ) : (
                     <Button variant="outline" onClick={closeUploadModal}>
                       Kapat
                     </Button>
                   )}
                   
                   <Button onClick={handleUpload} disabled={isUploading}>
                     {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                     {isUploading ? 'Yükleniyor...' : 'Yükle'}
                   </Button>
                 </div>
               </div>
             )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={!!previewFile} onOpenChange={(open) => {
          if (!open) {
              setPreviewFile(null);
              if (previewUrl) {
                  URL.revokeObjectURL(previewUrl);
                  setPreviewUrl(null);
              }
          }
      }}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0 bg-transparent border-0 shadow-none">
            <div className="relative bg-background rounded-lg overflow-hidden flex flex-col max-h-full">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="font-semibold truncate">{previewFile?.originalName}</h3>
                    <Button variant="ghost" size="icon" onClick={() => {
                        setPreviewFile(null);
                        if (previewUrl) {
                            URL.revokeObjectURL(previewUrl);
                            setPreviewUrl(null);
                        }
                    }}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
                <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-secondary/20 min-h-[300px]">
                    {previewUrl && (
                        <img 
                            src={previewUrl} 
                            alt={previewFile?.originalName}
                            className="max-w-full max-h-[70vh] object-contain shadow-lg rounded-md"
                        />
                    )}
                </div>
            </div>
        </DialogContent>
      </Dialog>

      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground interactive">
        <button 
          onClick={() => setCurrentFolderId(null)}
          className="hover:text-primary transition-colors"
        >
          Ana Dizin
        </button>
        {breadcrumbs.map((folder) => (
          <div key={folder.id} className="flex items-center gap-2">
            <span>/</span>
            <button 
              onClick={() => setCurrentFolderId(folder.id)}
              className="hover:text-primary transition-colors"
            >
              {folder.name}
            </button>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
            {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {/* Folders */}
                    {filteredFolders.map(folder => (
                        <DroppableFolder 
                            key={folder.id} 
                            folder={folder} 
                            onClick={() => setCurrentFolderId(folder.id)}
                        >
                            <Card 
                                className="p-4 cursor-pointer hover:bg-accent/50 transition-colors flex flex-col items-center justify-center gap-2 h-full interactive"
                            >
                                <Folder className="h-12 w-12 text-blue-500 fill-blue-500/20" />
                                <span className="text-sm font-medium truncate w-full text-center">{folder.name}</span>
                            </Card>
                        </DroppableFolder>
                    ))}

                    {/* Files */}
                    {filteredFiles.map(file => (
                        <DraggableFile key={file.id} file={file}>
                            <Card 
                                className={cn(
                                    "p-4 flex flex-col items-center justify-center gap-2 group relative transition-all border-2 interactive cursor-pointer",
                                    selectedItems.includes(file.id) ? "border-primary bg-primary/5" : "border-transparent hover:border-muted-foreground/20"
                                )}
                                data-file-id={file.id}
                                onClick={(e) => handleSelectItem(file.id, e)}
                                onDoubleClick={(e) => {
                                    e.stopPropagation();
                                    handlePreview(file);
                                }}
                            >
                                <div className="absolute top-2 left-2 z-20 interactive">
                                    <div 
                                        className={cn(
                                            "h-5 w-5 rounded border cursor-pointer flex items-center justify-center transition-colors",
                                            selectedItems.includes(file.id) ? "bg-primary border-primary text-white" : "bg-white/80 border-gray-400 opacity-0 group-hover:opacity-100"
                                        )}
                                        onMouseDown={(e) => e.stopPropagation()} 
                                        onClick={(e) => handleSelectItem(file.id, e)}
                                    >
                                        {selectedItems.includes(file.id) && <CheckSquare className="h-3.5 w-3.5" />}
                                    </div>
                                </div>

                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 interactive">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 bg-white/50 backdrop-blur-sm" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handlePreview(file); }}>
                                                <Eye className="mr-2 h-4 w-4" /> Önizle
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleTogglePublic(file); }}>
                                                <Share2 className="mr-2 h-4 w-4" /> 
                                                {file.isPublic ? "Paylaşımı Kaldır" : "Paylaş"}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-red-600" onClick={(e) => { e.stopPropagation(); handleDeleteFile(file.id); }}>
                                                <Trash2 className="mr-2 h-4 w-4" /> Sil
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <div className="relative flex justify-center interactive">
                                    {file.mimeType.startsWith('image/') ? (
                                        <div className="h-16 w-16 rounded overflow-hidden bg-secondary flex items-center justify-center">
                                            <AuthorizedImage 
                                                src={`/storage/file/${file.id}/preview`} 
                                                alt={file.originalName}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <FileIcon className="h-12 w-12 text-gray-500" />
                                    )}
                                    {file.isPublic && (
                                        <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5" title="Müşteri ile Paylaşıldı">
                                            <Share2 className="h-3 w-3 text-white" />
                                        </div>
                                    )}
                                </div>
                                <div className="text-center w-full">
                                    <div className="text-sm font-medium truncate" title={file.originalName}>{file.originalName}</div>
                                    <div className="text-xs text-muted-foreground">{formatSize(file.size)}</div>
                                </div>
                            </Card>
                        </DraggableFile>
                    ))}
                </div>
            ) : (
                <div className="rounded-md border">
                    <div className="grid grid-cols-12 gap-4 p-4 border-b bg-muted/50 font-medium text-sm">
                        <div className="col-span-6 flex items-center gap-1 cursor-pointer hover:text-primary" onClick={() => handleSort('name')}>
                            Ad
                            {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                        </div>
                        <div className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-primary" onClick={() => handleSort('size')}>
                            Boyut
                            {sortConfig.key === 'size' && (sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                        </div>
                        <div className="col-span-3 flex items-center gap-1 cursor-pointer hover:text-primary" onClick={() => handleSort('createdAt')}>
                            Oluşturulma Tarihi
                            {sortConfig.key === 'createdAt' && (sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                        </div>
                        <div className="col-span-1"></div>
                    </div>
                    <div className="max-h-[600px] overflow-auto">
                        {filteredFolders.map(folder => (
                            <DroppableFolder 
                                key={folder.id} 
                                folder={folder} 
                                onClick={() => setCurrentFolderId(folder.id)}
                            >
                                <div 
                                    className="grid grid-cols-12 gap-4 p-3 items-center hover:bg-accent/50 cursor-pointer border-b last:border-0 interactive"
                                >
                                    <div className="col-span-6 flex items-center gap-3">
                                        <Folder className="h-5 w-5 text-blue-500 fill-blue-500/20" />
                                        <span className="font-medium truncate">{folder.name}</span>
                                    </div>
                                    <div className="col-span-2 text-sm text-muted-foreground">-</div>
                                    <div className="col-span-3 text-sm text-muted-foreground">
                                        {new Date(folder.createdAt).toLocaleDateString('tr-TR')}
                                    </div>
                                    <div className="col-span-1"></div>
                                </div>
                            </DroppableFolder>
                        ))}
                        {filteredFiles.map(file => (
                            <DraggableFile key={file.id} file={file}>
                                <div 
                                    className={cn(
                                        "grid grid-cols-12 gap-4 p-3 items-center border-b last:border-0 group cursor-pointer hover:bg-muted/50 transition-colors interactive",
                                        selectedItems.includes(file.id) ? "bg-primary/5" : ""
                                    )}
                                    onClick={(e) => handleSelectItem(file.id, e)}
                                    onDoubleClick={(e) => {
                                        e.stopPropagation();
                                        handlePreview(file);
                                    }}
                                    data-file-id={file.id}
                                >
                                    <div className="col-span-6 flex items-center gap-3">
                                        <div 
                                            className="flex items-center justify-center w-5 h-5 interactive" 
                                            onMouseDown={(e) => e.stopPropagation()}
                                            onClick={(e) => handleSelectItem(file.id, e)}
                                        >
                                            {selectedItems.includes(file.id) ? (
                                                <CheckSquare className="h-5 w-5 text-primary" />
                                            ) : (
                                                <Square className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                            )}
                                        </div>
                                        <FileIcon className="h-5 w-5 text-gray-500" />
                                        <span className="font-medium truncate">{file.originalName}</span>
                                        {file.isPublic && (
                                            <div className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                                <Share2 className="h-3 w-3" /> Public
                                            </div>
                                        )}
                                    </div>
                                    <div className="col-span-2 text-sm text-muted-foreground">{formatSize(file.size)}</div>
                                    <div className="col-span-3 text-sm text-muted-foreground">
                                        {new Date(file.createdAt).toLocaleDateString('tr-TR')}
                                    </div>
                                    <div className="col-span-1 flex justify-end interactive">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handlePreview(file); }}>
                                                    <Eye className="mr-2 h-4 w-4" /> Önizle
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleTogglePublic(file); }}>
                                                    <Share2 className="mr-2 h-4 w-4" /> 
                                                    {file.isPublic ? "Paylaşımı Kaldır" : "Paylaş"}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-red-600" onClick={(e) => { e.stopPropagation(); handleDeleteFile(file.id); }}>
                                                    <Trash2 className="mr-2 h-4 w-4" /> Sil
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            </DraggableFile>
                        ))}
                    </div>
                </div>
            )}

            {!filteredFolders.length && !filteredFiles.length && (
                <div className="py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                    {searchQuery ? "Arama sonucu bulunamadı" : "Bu klasör boş"}
                </div>
            )}
        </>
      )}

      {/* Selection Box Visual */}
      {isSelecting && selectionBox && (
          <div 
              className="absolute bg-primary/20 border border-primary pointer-events-none z-50"
              style={{
                  left: Math.min(selectionBox.startX, selectionBox.endX),
                  top: Math.min(selectionBox.startY, selectionBox.endY),
                  width: Math.abs(selectionBox.endX - selectionBox.startX),
                  height: Math.abs(selectionBox.endY - selectionBox.startY)
              }}
          />
      )}

      {/* Drag Overlay */}
      <DragOverlay>
          {activeDragItem ? (
              <div className="bg-background border rounded-lg p-2 shadow-xl flex items-center gap-2 opacity-80 cursor-grabbing">
                  <FileIcon className="h-8 w-8 text-primary" />
                  <div className="text-sm font-medium max-w-[150px] truncate">
                      {selectedItems.includes(activeDragItem.file.id) && selectedItems.length > 1 
                          ? `${selectedItems.length} dosya` 
                          : activeDragItem.file.originalName}
                  </div>
              </div>
          ) : null}
      </DragOverlay>
    </div>
    </DndContext>
  );
}
