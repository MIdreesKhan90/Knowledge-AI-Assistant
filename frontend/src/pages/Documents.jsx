
import { useEffect, useState } from "react";
import {
  Database,
  FileText,
  Upload,
  Download,
  Plus,
  Search,
  FolderOpen,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
  Check,
  Loader2,
  File,
  FileType,
  RefreshCw,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Folder,
} from "lucide-react";

import {
  getKnowledgeBases,
  createKnowledgeBase,
  updateKnowledgeBase,
  deleteKnowledgeBase,
  getDocuments,
  uploadDocument,
  assignDocumentKnowledgeBase,
  processDocument,
  deleteDocument,
  downloadDocument,
} from "../services/documents";

export default function Documents() {
  const [knowledgeBases, setKnowledgeBases] = useState([]);
  const [documents, setDocuments] = useState([]);

  const [selectedKB, setSelectedKB] = useState(null);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [kbModal, setKbModal] = useState(false);
  const [editingKB, setEditingKB] = useState(null);
  const [kbName, setKbName] = useState("");
  const [kbDescription, setKbDescription] = useState("");
  const [savingKB, setSavingKB] = useState(false);

  const [uploadModal, setUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadKB, setUploadKB] = useState("");

  const [activeMenu, setActiveMenu] = useState(null);

  const loadData = async (kbId = selectedKB) => {
    try {
      setError("");

      const [kbData, documentData] = await Promise.all([
        getKnowledgeBases(),
        getDocuments(kbId),
      ]);

      setKnowledgeBases(kbData);
      setDocuments(documentData);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Unable to load your knowledge workspace."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedKB);
  }, [selectedKB]);

  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(""), 3500);
  };

  const openCreateKB = () => {
    setEditingKB(null);
    setKbName("");
    setKbDescription("");
    setKbModal(true);
  };

  const openEditKB = (kb) => {
    setEditingKB(kb);
    setKbName(kb.name);
    setKbDescription(kb.description || "");
    setKbModal(true);
    setActiveMenu(null);
  };

  const handleSaveKB = async (e) => {
    e.preventDefault();

    if (!kbName.trim()) return;

    try {
      setSavingKB(true);
      setError("");

      if (editingKB) {
        await updateKnowledgeBase(editingKB.id, {
          name: kbName.trim(),
        });

        showSuccess("Knowledge Base renamed successfully.");
      } else {
        await createKnowledgeBase({
          name: kbName.trim(),
          description: kbDescription.trim() || null,
        });

        showSuccess("Knowledge Base created successfully.");
      }

      setKbModal(false);
      await loadData(selectedKB);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Unable to save Knowledge Base."
      );
    } finally {
      setSavingKB(false);
    }
  };

  const handleDeleteKB = async (kb) => {
    const confirmed = window.confirm(
      `Delete "${kb.name}"? Its documents will remain unassigned.`
    );

    if (!confirmed) return;

    try {
      setError("");

      await deleteKnowledgeBase(kb.id);

      if (selectedKB === kb.id) {
        setSelectedKB(null);
      } else {
        await loadData(selectedKB);
      }

      showSuccess("Knowledge Base deleted successfully.");
      setActiveMenu(null);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Unable to delete Knowledge Base."
      );
    }
  };

  const openUpload = () => {
    setSelectedFile(null);
    setUploadKB(selectedKB ? String(selectedKB) : "");
    setUploadProgress(0);
    setUploadModal(true);
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      setError("Please select a document first.");
      return;
    }

    try {
      setUploading(true);
      setError("");
      setUploadProgress(0);

      const result = await uploadDocument(
        selectedFile,
        setUploadProgress,
        uploadKB ? Number(uploadKB) : null
      );

      setUploadProgress(100);

      setProcessing(result.document_id);

      await processDocument(result.document_id);

      setProcessing(null);
      setUploadModal(false);
      setSelectedFile(null);

      await loadData(selectedKB);

      showSuccess("Document uploaded and processed successfully.");
    } catch (err) {
      setProcessing(null);
      setError(
        err.response?.data?.detail ||
        "Document upload or processing failed."
      );
    } finally {
      setUploading(false);
    }
  };

  const handleAssign = async (documentId, knowledgeBaseId) => {
    try {
      setError("");

      await assignDocumentKnowledgeBase(
        documentId,
        knowledgeBaseId ? Number(knowledgeBaseId) : null
      );

      await loadData(selectedKB);

      showSuccess("Document assignment updated.");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Unable to update document assignment."
      );
    }
  };

  const handleDeleteDocument = async (doc) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${doc.filename}"?`
    );

    if (!confirmed) return;

    try {
      setError("");

      await deleteDocument(doc.id);
      await loadData(selectedKB);

      showSuccess("Document deleted successfully.");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Unable to delete document."
      );
    }
  };

  const handleDownloadDocument = async (doc) => {
  try {
    setError("");

    const response = await downloadDocument(doc.id);

    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = doc.filename;

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    showSuccess("Document downloaded successfully.");
  } catch (err) {
    setError(
      err.response?.data?.detail ||
      "Unable to download document."
    );
  }
};

  const filteredDocuments = documents.filter((doc) =>
    doc.filename.toLowerCase().includes(search.toLowerCase())
  );

  const totalStorage = documents.reduce(
    (total, doc) => total + (doc.file_size || 0),
    0
  );

  const formatSize = (bytes) => {
    if (!bytes) return "0 KB";

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getFileIcon = (type) => {
    if (type === "pdf") {
      return <FileText size={21} className="text-red-400" />;
    }

    if (type === "docx") {
      return <FileType size={21} className="text-blue-400" />;
    }

    return <File size={21} className="text-emerald-400" />;
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto animate-spin text-blue-400" size={32} />
          <p className="mt-4 text-sm text-slate-400">
            Loading your knowledge workspace...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7 pb-8">

      {/* Page Header */}
      <section className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
        <div>
          <div className="flex items-center gap-2 text-sm text-blue-400">
            <Sparkles size={15} />
            Knowledge Workspace
          </div>

          <h1 className="mt-2 text-2xl font-bold md:text-3xl">
            Documents & Knowledge Bases
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Organize your documents and build your AI knowledge library.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={openCreateKB}
            className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-blue-500/50 hover:bg-slate-800"
          >
            <Plus size={18} />
            New Knowledge Base
          </button>

          <button
            onClick={openUpload}
            className="flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            <Upload size={18} />
            Upload Document
          </button>
        </div>
      </section>

      {/* Alerts */}
      {error && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} />
            {error}
          </div>
          <button onClick={() => setError("")}>
            <X size={18} />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
          <Check size={18} />
          {success}
        </div>
      )}

      {/* Stats */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            label: "Knowledge Bases",
            value: knowledgeBases.length,
            icon: Database,
            color: "text-blue-400",
            bg: "bg-blue-500/10",
          },
          {
            label: "Total Documents",
            value: documents.length,
            icon: FileText,
            color: "text-purple-400",
            bg: "bg-purple-500/10",
          },
          {
            label: "Storage Used",
            value: formatSize(totalStorage),
            icon: FolderOpen,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-slate-800 bg-slate-900 p-5 transition duration-300 hover:-translate-y-1 hover:border-slate-600"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">
                {stat.label}
              </span>

              <div className={`rounded-xl p-3 ${stat.bg} ${stat.color}`}>
                <stat.icon size={21} />
              </div>
            </div>

            <h2 className="mt-4 text-2xl font-bold">
              {stat.value}
            </h2>
          </div>
        ))}
      </section>

      {/* Knowledge Base Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              Your Knowledge Bases
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Organize your documents into separate collections.
            </p>
          </div>

          <span className="text-xs text-slate-500">
            {knowledgeBases.length} collections
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">

          {/* All Documents Card */}
          <button
            onClick={() => setSelectedKB(null)}
            className={`group cursor-pointer rounded-2xl border p-5 text-left transition duration-300 hover:-translate-y-1 ${
              selectedKB === null
                ? "border-blue-500/50 bg-blue-500/10"
                : "border-slate-800 bg-slate-900 hover:border-slate-600"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="rounded-xl bg-blue-500/10 p-3 text-blue-400">
                <FolderOpen size={23} />
              </div>

              <ChevronRight
                size={19}
                className="text-slate-500 transition group-hover:translate-x-1"
              />
            </div>

            <h3 className="mt-5 font-semibold">All Documents</h3>

            <p className="mt-1 text-sm text-slate-500">
              Browse all your uploaded files.
            </p>

            <div className="mt-5 flex items-center gap-2 text-xs text-slate-400">
              <FileText size={14} />
              {documents.length} documents
            </div>
          </button>

          {knowledgeBases.map((kb, index) => {
            const count = documents.filter(
              (doc) => doc.knowledge_base_id === kb.id
            ).length;

            return (
              <div
                key={kb.id}
                className={`group relative rounded-2xl border p-5 transition duration-300 hover:-translate-y-1 ${
                  selectedKB === kb.id
                    ? "border-blue-500/50 bg-blue-500/10"
                    : "border-slate-800 bg-slate-900 hover:border-slate-600"
                }`}
              >
                <div className="flex items-start justify-between">
                  <button
                    onClick={() => setSelectedKB(kb.id)}
                    className="cursor-pointer rounded-xl bg-purple-500/10 p-3 text-purple-400 transition hover:bg-purple-500/20"
                  >
                    <Database size={23} />
                  </button>

                  <button
                    onClick={() =>
                      setActiveMenu(activeMenu === kb.id ? null : kb.id)
                    }
                    className="cursor-pointer rounded-lg p-2 text-slate-500 transition hover:bg-slate-800 hover:text-white"
                    aria-label="Knowledge Base options"
                  >
                    <MoreHorizontal size={20} />
                  </button>
                </div>

                {activeMenu === kb.id && (
                  <div className="absolute right-4 top-14 z-20 w-40 rounded-xl border border-slate-700 bg-slate-900 p-1 shadow-xl">
                    <button
                      onClick={() => openEditKB(kb)}
                      className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
                    >
                      <Pencil size={15} />
                      Rename
                    </button>

                    <button
                      onClick={() => handleDeleteKB(kb)}
                      className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 size={15} />
                      Delete
                    </button>
                  </div>
                )}

                <button
                  onClick={() => setSelectedKB(kb.id)}
                  className="mt-5 w-full cursor-pointer text-left"
                >
                  <h3 className="font-semibold text-white">
                    {kb.name}
                  </h3>

                  <p className="mt-1 min-h-5 truncate text-sm text-slate-500">
                    {kb.description || "Your organized knowledge collection."}
                  </p>

                  <div className="mt-5 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs text-slate-400">
                      <FileText size={14} />
                      {count} documents
                    </span>

                    <span className="flex items-center gap-1 text-xs text-blue-400">
                      Open
                      <ChevronRight size={15} />
                    </span>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Documents Section */}
      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">

        <div className="flex flex-col justify-between gap-4 border-b border-slate-800 p-5 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold">
                {selectedKB
                  ? knowledgeBases.find((kb) => kb.id === selectedKB)?.name || "Knowledge Base"
                  : "All Documents"}
              </h2>

              {selectedKB && (
                <span className="rounded-full bg-blue-500/10 px-2 py-1 text-xs text-blue-400">
                  Filtered
                </span>
              )}
            </div>

            <p className="mt-1 text-xs text-slate-500">
              Manage and organize your uploaded documents.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search documents..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 sm:w-56"
              />
            </div>

            <button
              onClick={() => loadData(selectedKB)}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-700 px-3 py-2.5 text-sm text-slate-300 transition hover:bg-slate-800"
            >
              <RefreshCw size={15} />
              Refresh
            </button>
          </div>
        </div>

        {filteredDocuments.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
            <div className="rounded-2xl bg-slate-800 p-4">
              <Folder size={30} className="text-slate-400" />
            </div>

            <h3 className="mt-4 font-semibold">
              {search ? "No matching documents" : "No documents found"}
            </h3>

            <p className="mt-2 max-w-sm text-sm text-slate-500">
              {search
                ? "Try another search term."
                : "Upload your first document to start building your AI knowledge library."}
            </p>

            {!search && (
              <button
                onClick={openUpload}
                className="mt-5 flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500"
              >
                <Upload size={16} />
                Upload Document
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className="flex flex-col gap-4 p-5 transition hover:bg-slate-800/40 sm:flex-row sm:items-center"
              >
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-800">
                    {getFileIcon(doc.file_type)}
                  </div>

                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-medium text-white">
                      {doc.filename}
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      {doc.file_type.toUpperCase()} · {formatSize(doc.file_size)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 sm:justify-end">

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      doc.status === "processed"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : doc.status === "failed"
                        ? "bg-red-500/10 text-red-400"
                        : "bg-amber-500/10 text-amber-400"
                    }`}
                  >
                    {doc.status}
                  </span>

                  <select
                    value={doc.knowledge_base_id ?? ""}
                    onChange={(e) =>
                      handleAssign(doc.id, e.target.value)
                    }
                    className="max-w-44 cursor-pointer rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-300 outline-none focus:border-blue-500"
                    aria-label={`Assign ${doc.filename} to Knowledge Base`}
                  >
                    <option value="">Unassigned</option>

                    {knowledgeBases.map((kb) => (
                      <option key={kb.id} value={kb.id}>
                        {kb.name}
                      </option>
                    ))}
                  </select>

                  {doc.status !== "processed" && (
                    <button
                      disabled={processing === doc.id}
                      onClick={async () => {
                        try {
                          setProcessing(doc.id);
                          await processDocument(doc.id);
                          await loadData(selectedKB);
                          showSuccess("Document processed successfully.");
                        } catch (err) {
                          setError(
                            err.response?.data?.detail ||
                            "Document processing failed."
                          );
                        } finally {
                          setProcessing(null);
                        }
                      }}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 transition hover:border-blue-500/50 hover:bg-blue-500/10 hover:text-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {processing === doc.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <RefreshCw size={14} />
                      )}
                      Process
                    </button>
                  )}

                    <button
                        onClick={() => handleDownloadDocument(doc)}
                        className="flex cursor-pointer items-center gap-2 rounded-lg border border-blue-500/20 px-3 py-2 text-xs text-blue-400 transition hover:border-blue-500/50 hover:bg-blue-500/10"
                        aria-label={`Download ${doc.filename}`}
                        >
                        <Download size={14} />
                        Download
                    </button>

                  <button
                    onClick={() => handleDeleteDocument(doc)}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-red-500/20 px-3 py-2 text-xs text-red-400 transition hover:border-red-500/50 hover:bg-red-500/10"
                    aria-label={`Delete ${doc.filename}`}
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Knowledge Base Modal */}
      {kbModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleSaveKB}
            className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editingKB ? "Rename Knowledge Base" : "Create Knowledge Base"}
              </h2>

              <button
                type="button"
                onClick={() => setKbModal(false)}
                className="cursor-pointer rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X size={19} />
              </button>
            </div>

            <p className="mt-2 text-sm text-slate-400">
              {editingKB
                ? "Update your collection name."
                : "Create a collection to organize your documents."}
            </p>

            <label className="mt-6 block text-sm text-slate-300">
              Knowledge Base Name
            </label>

            <input
              autoFocus
              required
              maxLength={150}
              value={kbName}
              onChange={(e) => setKbName(e.target.value)}
              placeholder="e.g. Business Documents"
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
            />

            {!editingKB && (
              <>
                <label className="mt-5 block text-sm text-slate-300">
                  Description
                </label>

                <textarea
                  value={kbDescription}
                  onChange={(e) => setKbDescription(e.target.value)}
                  rows={3}
                  placeholder="Describe this knowledge collection..."
                  className="mt-2 w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                />
              </>
            )}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setKbModal(false)}
                className="flex-1 cursor-pointer rounded-xl border border-slate-700 px-4 py-3 text-sm text-slate-300 transition hover:bg-slate-800"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={savingKB || !kbName.trim()}
                className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingKB && <Loader2 size={16} className="animate-spin" />}
                {editingKB ? "Save Changes" : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Upload Modal */}
      {uploadModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleUpload}
            className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Upload Document
              </h2>

              <button
                type="button"
                disabled={uploading}
                onClick={() => setUploadModal(false)}
                className="cursor-pointer rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-40"
              >
                <X size={19} />
              </button>
            </div>

            <p className="mt-2 text-sm text-slate-400">
              Upload a document to your AI knowledge workspace.
            </p>

            <label className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-700 bg-slate-950/60 px-5 py-10 text-center transition hover:border-blue-500/60 hover:bg-blue-500/5">
              <div className="rounded-2xl bg-blue-500/10 p-4 text-blue-400">
                <Upload size={27} />
              </div>

              <span className="mt-4 text-sm font-medium text-slate-200">
                {selectedFile ? selectedFile.name : "Choose a document"}
              </span>

              <span className="mt-2 text-xs text-slate-500">
                PDF, DOCX or TXT · Maximum 10 MB
              </span>

              <input
                type="file"
                accept=".pdf,.docx,.txt"
                disabled={uploading}
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="hidden"
              />
            </label>

            <label className="mt-5 block text-sm text-slate-300">
              Knowledge Base
            </label>

            <select
              value={uploadKB}
              disabled={uploading}
              onChange={(e) => setUploadKB(e.target.value)}
              className="mt-2 w-full cursor-pointer rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
            >
              <option value="">Unassigned</option>

              {knowledgeBases.map((kb) => (
                <option key={kb.id} value={kb.id}>
                  {kb.name}
                </option>
              ))}
            </select>

            {uploading && (
              <div className="mt-5">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>
                    {processing ? "Processing document..." : "Uploading document..."}
                  </span>
                  <span>{uploadProgress}%</span>
                </div>

                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={uploading}
                onClick={() => setUploadModal(false)}
                className="flex-1 cursor-pointer rounded-xl border border-slate-700 px-4 py-3 text-sm text-slate-300 transition hover:bg-slate-800 disabled:opacity-40"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={!selectedFile || uploading}
                className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <Upload size={17} />
                )}

                {uploading ? "Please wait..." : "Upload & Process"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}