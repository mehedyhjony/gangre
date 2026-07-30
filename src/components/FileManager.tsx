import React, { useState, useEffect, useRef } from 'react';
import { 
  Folder, 
  File, 
  Plus, 
  Trash2, 
  UploadCloud, 
  ArrowLeft, 
  Copy, 
  Check, 
  Grid, 
  List, 
  Search, 
  RefreshCw, 
  FileText, 
  Image as ImageIcon, 
  ChevronRight,
  FolderPlus,
  ExternalLink
} from 'lucide-react';

export interface FileItem {
  name: string;
  path: string; // relative to public/uploads, e.g. "avatars", "img_123.jpg"
  isDirectory: boolean;
  size?: number;
  mtime?: string;
  url?: string; // direct static link (e.g. "/uploads/img_123.jpg")
}

interface FileManagerProps {
  token: string | null;
  lang?: 'bn' | 'en';
}

export default function FileManager({ token, lang = 'bn' }: FileManagerProps) {
  const [currentFolder, setCurrentFolder] = useState<string>(''); // empty means root of public/uploads
  const [items, setItems] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  
  // Folder Creation & Upload states
  const [showNewFolderModal, setShowNewFolderModal] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Translate helpers
  const t = {
    title: lang === 'bn' ? 'ফাইল ও ফোল্ডার ম্যানেজার' : 'File & Folder Manager',
    subtitle: lang === 'bn' ? 'সার্ভার আপলোডস এবং ডিরেক্টরি ফাইলস পরিচালনা করুন' : 'Manage and organize server-side uploaded media',
    search: lang === 'bn' ? 'ফাইল খুঁজুন...' : 'Search files...',
    newFolder: lang === 'bn' ? 'নতুন ফোল্ডার' : 'New Folder',
    upload: lang === 'bn' ? 'ফাইল আপলোড' : 'Upload File',
    back: lang === 'bn' ? 'পেছনে যান' : 'Back',
    root: lang === 'bn' ? 'রুট' : 'Home',
    empty: lang === 'bn' ? 'কোনো ফাইল বা ফোল্ডার পাওয়া যায়নি।' : 'No files or folders found.',
    create: lang === 'bn' ? 'তৈরি করুন' : 'Create',
    cancel: lang === 'bn' ? 'বাতিল' : 'Cancel',
    deleteConfirm: lang === 'bn' ? 'আপনি কি নিশ্চিতভাবে এই ফাইল/ফোল্ডারটি মুছতে চান?' : 'Are you sure you want to delete this file/folder?',
    copySuccess: lang === 'bn' ? 'লিঙ্ক কপি হয়েছে!' : 'Link copied!',
    name: lang === 'bn' ? 'নাম' : 'Name',
    size: lang === 'bn' ? 'সাইজ' : 'Size',
    modified: lang === 'bn' ? 'পরিবর্তিত' : 'Modified',
    actions: lang === 'bn' ? 'অ্যাকশন' : 'Actions',
    folderPlaceholder: lang === 'bn' ? 'ফোল্ডারের নাম লিখুন...' : 'Enter folder name...',
    uploading: lang === 'bn' ? 'আপলোড হচ্ছে...' : 'Uploading...',
    dragDrop: lang === 'bn' ? 'ফাইল ড্র্যাগ করে এখানে ছাড়ুন বা ক্লিক করুন' : 'Drag & drop file here or click to choose'
  };

  const getHeaders = () => {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const url = `/api/files?path=${encodeURIComponent(currentFolder)}`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      } else {
        console.error('Failed to fetch files');
      }
    } catch (err) {
      console.error('Error listing files:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [currentFolder, token]);

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      const res = await fetch('/api/files/create-folder', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          parentPath: currentFolder,
          folderName: newFolderName.trim()
        })
      });

      if (res.ok) {
        setNewFolderName('');
        setShowNewFolderModal(false);
        fetchItems();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to create folder');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', files[0]);
    formData.append('path', currentFolder);

    try {
      const res = await fetch('/api/files/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }, // Browser computes Multi-part Boundary automatically
        body: formData
      });

      if (res.ok) {
        fetchItems();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to upload file');
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (item: FileItem) => {
    if (!window.confirm(t.deleteConfirm)) return;

    try {
      const res = await fetch('/api/files/delete', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          itemPath: item.path,
          isDirectory: item.isDirectory
        })
      });

      if (res.ok) {
        fetchItems();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to delete');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(window.location.origin + url);
    setCopiedPath(url);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  // Filtering based on search query
  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // File type categorizers
  const isImageFile = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    return ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext || '');
  };

  const formatSize = (bytes?: number) => {
    if (bytes === undefined) return '—';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Split current directory into clickable segments
  const breadcrumbs = currentFolder ? currentFolder.split('/') : [];

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col h-full overflow-hidden font-sans">
      {/* File Manager Header Toolbar */}
      <div className="p-4 md:p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
            <h2 className="font-extrabold text-sm md:text-base text-gray-900 tracking-tight">{t.title}</h2>
          </div>
          <p className="text-[11px] text-gray-400 font-medium">{t.subtitle}</p>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search bar */}
          <div className="relative w-full md:w-56">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-200 text-xs pl-8.5 pr-4 py-2 rounded-xl outline-none focus:border-green-400 transition-all placeholder:text-gray-400 text-gray-800"
            />
          </div>

          {/* Action buttons */}
          <button
            onClick={() => setShowNewFolderModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-bold text-xs rounded-xl cursor-pointer transition-colors shadow-sm"
          >
            <FolderPlus size={14} className="text-gray-500" />
            <span>{t.newFolder}</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-1.5 px-3 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors shadow-sm"
          >
            <UploadCloud size={14} />
            <span>{isUploading ? t.uploading : t.upload}</span>
          </button>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            onClick={fetchItems}
            className="p-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 rounded-xl cursor-pointer transition-colors"
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>

          <div className="border-l border-gray-200 h-5 mx-1 hidden sm:block"></div>

          {/* View mode toggle */}
          <div className="bg-gray-100 p-0.5 rounded-xl flex items-center hidden sm:flex">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Grid size={14} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <List size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Breadcrumbs Navigation path */}
      <div className="px-4 py-2 border-b border-gray-100 bg-white flex items-center gap-1.5 text-xs text-gray-400 overflow-x-auto select-none">
        <button
          onClick={() => setCurrentFolder('')}
          className={`font-semibold hover:text-green-600 transition-colors ${currentFolder === '' ? 'text-green-600 font-extrabold' : 'text-gray-500'}`}
        >
          {t.root}
        </button>

        {breadcrumbs.map((segment, index) => {
          const folderPath = breadcrumbs.slice(0, index + 1).join('/');
          const isLast = index === breadcrumbs.length - 1;
          return (
            <React.Fragment key={index}>
              <ChevronRight size={12} className="text-gray-300 flex-shrink-0" />
              <button
                disabled={isLast}
                onClick={() => setCurrentFolder(folderPath)}
                className={`truncate max-w-[120px] transition-colors ${
                  isLast ? 'text-green-600 font-extrabold font-sans' : 'text-gray-500 hover:text-green-600'
                }`}
              >
                {segment}
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {/* Main Files Display Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50/30">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center space-y-2">
            <RefreshCw size={24} className="text-green-500 animate-spin" />
            <p className="text-xs text-gray-400 font-bold">Loading items...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center space-y-3 bg-white border border-dashed border-gray-200 rounded-2xl p-8">
            <Folder size={40} className="text-gray-300" />
            <p className="text-xs text-gray-400 font-bold">{t.empty}</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-green-600 font-bold hover:underline"
            >
              {t.upload}
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View Layout */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredItems.map((item, index) => {
              const isImg = !item.isDirectory && isImageFile(item.name);
              return (
                <div
                  key={index}
                  className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group relative"
                >
                  {/* File/Folder preview box */}
                  <div className="aspect-square bg-gray-50 rounded-lg flex items-center justify-center mb-2.5 overflow-hidden relative">
                    {item.isDirectory ? (
                      <button
                        onClick={() => setCurrentFolder(item.path)}
                        className="w-full h-full flex items-center justify-center text-yellow-500 hover:text-yellow-600 cursor-pointer"
                      >
                        <Folder size={44} fill="currentColor" fillOpacity={0.15} />
                      </button>
                    ) : isImg && item.url ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full h-full block"
                      >
                        <img
                          src={item.url}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          referrerPolicy="no-referrer"
                        />
                      </a>
                    ) : (
                      <div className="text-blue-500">
                        <FileText size={36} />
                      </div>
                    )}

                    {/* Delete and copy fast triggers on hover */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                      {!item.isDirectory && item.url && (
                        <button
                          onClick={() => handleCopyLink(item.url!)}
                          className="p-1.5 bg-white text-gray-800 hover:text-green-600 rounded-lg cursor-pointer transition-colors shadow-sm"
                          title="Copy direct static link"
                        >
                          {copiedPath === item.url ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                        </button>
                      )}
                      {!item.isDirectory && item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 bg-white text-gray-800 hover:text-blue-600 rounded-lg transition-colors shadow-sm"
                          title="Open link in tab"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                      <button
                        onClick={() => handleDelete(item)}
                        className="p-1.5 bg-white text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors shadow-sm"
                        title="Delete file"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Title and details labels */}
                  <div className="space-y-0.5 min-w-0">
                    <button
                      disabled={!item.isDirectory}
                      onClick={() => setCurrentFolder(item.path)}
                      className={`text-xs font-bold font-sans text-left truncate w-full block ${
                        item.isDirectory ? 'text-gray-800 hover:text-green-600 cursor-pointer' : 'text-gray-700'
                      }`}
                      title={item.name}
                    >
                      {item.name}
                    </button>
                    <p className="text-[10px] text-gray-400 font-mono font-medium flex justify-between">
                      <span>{item.isDirectory ? 'Folder' : formatSize(item.size)}</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View Layout */
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider select-none">
                  <th className="p-3.5 pl-4">{t.name}</th>
                  <th className="p-3.5">{t.size}</th>
                  <th className="p-3.5">{t.modified}</th>
                  <th className="p-3.5 pr-4 text-right">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-gray-700 font-medium">
                {filteredItems.map((item, index) => {
                  const isImg = !item.isDirectory && isImageFile(item.name);
                  return (
                    <tr key={index} className="hover:bg-gray-50/40 group">
                      <td className="p-3 pl-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {item.isDirectory ? (
                            <Folder size={18} className="text-yellow-500" fill="currentColor" fillOpacity={0.1} />
                          ) : isImg && item.url ? (
                            <img src={item.url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <File size={16} className="text-blue-500" />
                          )}
                        </div>
                        {item.isDirectory ? (
                          <button
                            onClick={() => setCurrentFolder(item.path)}
                            className="font-bold text-gray-800 hover:text-green-600 transition-colors cursor-pointer text-left truncate max-w-[180px] sm:max-w-xs"
                          >
                            {item.name}
                          </button>
                        ) : (
                          <span className="truncate max-w-[180px] sm:max-w-xs text-gray-700">{item.name}</span>
                        )}
                      </td>
                      <td className="p-3 font-mono text-gray-500 text-[11px]">
                        {item.isDirectory ? '—' : formatSize(item.size)}
                      </td>
                      <td className="p-3 font-mono text-gray-400 text-[11px]">
                        {formatTime(item.mtime)}
                      </td>
                      <td className="p-3 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!item.isDirectory && item.url && (
                            <button
                              onClick={() => handleCopyLink(item.url!)}
                              className="p-1 bg-white border border-gray-100 hover:bg-gray-50 text-gray-600 hover:text-green-600 rounded cursor-pointer shadow-sm"
                              title="Copy Link"
                            >
                              {copiedPath === item.url ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                            </button>
                          )}
                          {!item.isDirectory && item.url && (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 bg-white border border-gray-100 hover:bg-gray-50 text-gray-600 hover:text-blue-600 rounded shadow-sm"
                              title="Open Link"
                            >
                              <ExternalLink size={12} />
                            </a>
                          )}
                          <button
                            onClick={() => handleDelete(item)}
                            className="p-1 bg-white border border-gray-100 hover:bg-red-50 text-red-600 rounded cursor-pointer shadow-sm"
                            title="Delete"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Folder Modal Dialog */}
      {showNewFolderModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateFolder}
            className="bg-white rounded-2xl border border-gray-100 p-5 w-full max-w-sm shadow-xl space-y-4"
          >
            <div className="space-y-1">
              <h3 className="font-extrabold text-sm text-gray-900">{t.newFolder}</h3>
              <p className="text-[11px] text-gray-400">Create a subfolder within the current location.</p>
            </div>
            <input
              type="text"
              placeholder={t.folderPlaceholder}
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-green-400 focus:bg-white transition-all text-gray-800"
              autoFocus
            />
            <div className="flex justify-end gap-2 text-xs font-bold pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowNewFolderModal(false);
                  setNewFolderName('');
                }}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg cursor-pointer bg-white hover:bg-gray-50"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg cursor-pointer shadow-sm"
              >
                {t.create}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
