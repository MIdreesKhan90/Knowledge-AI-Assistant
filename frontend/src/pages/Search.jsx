
import { useEffect, useState } from "react";
import {
  Search as SearchIcon,
  FileText,
  Download,
  Sparkles,
  Loader2,
  AlertCircle,
  Database,
  ArrowUpRight,
  SlidersHorizontal,
  Layers3,
  Command,
  ChevronDown,
  BookOpen,
  SearchX,
  BrainCircuit,
  MessageSquareText,
} from "lucide-react";

import {
  searchDocuments,
  getKnowledgeBases,
  downloadDocument,
  askDocuments,
} from "../services/documents";

export default function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [knowledgeBases, setKnowledgeBases] = useState([]);
  const [selectedKB, setSelectedKB] = useState("");
  const [topK, setTopK] = useState("5");

  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  // AI Answer States
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiSources, setAiSources] = useState([]);
  const [isAskingAI, setIsAskingAI] = useState(false);
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    const loadKnowledgeBases = async () => {
      try {
        const data = await getKnowledgeBases();

        setKnowledgeBases(
          Array.isArray(data)
            ? data
            : data.knowledge_bases || []
        );
      } catch (err) {
        console.error("Knowledge Bases loading error:", err);
      }
    };

    loadKnowledgeBases();
  }, []);

  // Semantic Search
  const handleSearch = async (event) => {
    event.preventDefault();

    if (!query.trim()) {
      setError("Please enter a question or search query.");
      return;
    }

    setLoading(true);
    setError("");
    setSearched(true);
    setResults([]);

    try {
      const data = await searchDocuments(
        query.trim(),
        Number(topK),
        selectedKB ? Number(selectedKB) : null
      );

      setResults(data.results || []);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Something went wrong while searching. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // AI Search
  const handleAskAI = async () => {
    if (!query.trim()) {
      setAiError("Please enter a question first.");
      return;
    }

    setIsAskingAI(true);
    setAiError("");
    setAiAnswer("");
    setAiSources([]);

    try {
      const data = await askDocuments(
        query.trim(),
        Number(topK),
        selectedKB ? Number(selectedKB) : null
      );

      setAiAnswer(data.answer || "");
      setAiSources(data.sources || []);
    } catch (error) {
      console.error("AI Search Error:", error);

      setAiError(
        error.response?.data?.detail ||
          "Failed to generate AI answer. Please try again."
      );
    } finally {
      setIsAskingAI(false);
    }
  };

  // Download Source Document
  const handleDownloadSource = async (result) => {
    try {
      setError("");

      const response = await downloadDocument(result.document_id);

      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");

      link.href = url;
      link.download =
        result.metadata?.filename ||
        result.filename ||
        "document";

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to download source document."
      );
    }
  };

  const suggestions = [
    "What information is in my documents?",
    "Find important project details",
    "Summarize my uploaded content",
  ];

  return (
    <div className="min-h-full bg-[#080e1c] px-4 py-7 text-white sm:px-7 sm:py-9 lg:px-9">
      <div className="mx-auto max-w-6xl">

        {/* Page Header */}
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-blue-400">
              <Sparkles size={14} />
              INTELLIGENT DISCOVERY
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Semantic Search
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
              Find meaningful answers across your documents.
              Search naturally and let AI discover the information
              that matters.
            </p>
          </div>

          <div className="hidden items-center gap-2 rounded-xl border border-slate-800 bg-[#101a2b] px-4 py-3 text-xs text-slate-400 sm:flex">
            <Database size={15} className="text-blue-400" />
            Your private knowledge
          </div>
        </div>

        {/* Search Panel */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-700/80 bg-[#101a2b] shadow-2xl shadow-black/20">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/70 to-transparent" />

          <div className="p-5 sm:p-7">
            <div className="mb-4 flex items-center gap-2">
              <SearchIcon size={17} className="text-blue-400" />
              <label className="text-sm font-semibold text-slate-200">
                What are you looking for?
              </label>
            </div>

            <form onSubmit={handleSearch}>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="group relative min-w-0 flex-1">
                  <SearchIcon
                    size={19}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 transition group-focus-within:text-blue-400"
                  />

                  <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setAiError("");
                    }}
                    placeholder="Ask anything about your documents..."
                    className="h-14 w-full rounded-xl border border-slate-700 bg-[#080f1e] pl-12 pr-4 text-sm text-white outline-none transition duration-200 placeholder:text-slate-500 hover:border-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || isAskingAI}
                  className="flex h-14 cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition duration-200 hover:-translate-y-0.5 hover:bg-blue-500 hover:shadow-blue-500/25 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Searching
                    </>
                  ) : (
                    <>
                      <SearchIcon size={18} />
                      Search
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleAskAI}
                  disabled={isAskingAI || loading}
                  className="flex h-14 cursor-pointer items-center justify-center gap-2 rounded-xl border border-purple-500/30 bg-gradient-to-r from-purple-600 to-blue-600 px-7 text-sm font-semibold text-white shadow-lg shadow-purple-600/20 transition duration-200 hover:-translate-y-0.5 hover:from-purple-500 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {isAskingAI ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Thinking...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Ask AI
                    </>
                  )}
                </button>
              </div>

              {/* Filters */}
              <div className="mt-6 flex flex-col gap-4 border-t border-slate-800 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                    <SlidersHorizontal size={15} />
                    Filters
                  </div>

                  <div className="relative">
                    <Database
                      size={14}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                    />

                    <select
                      value={selectedKB}
                      onChange={(e) => setSelectedKB(e.target.value)}
                      className="h-10 min-w-48 cursor-pointer appearance-none rounded-lg border border-slate-700 bg-[#080f1e] py-2 pl-9 pr-9 text-xs text-slate-300 outline-none transition hover:border-slate-600 focus:border-blue-500"
                    >
                      <option value="">All Knowledge Bases</option>

                      {knowledgeBases.map((kb) => (
                        <option key={kb.id} value={kb.id}>
                          {kb.name}
                        </option>
                      ))}
                    </select>

                    <ChevronDown
                      size={14}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">
                    Results per search
                  </span>

                  <select
                    value={topK}
                    onChange={(e) => setTopK(e.target.value)}
                    className="h-10 cursor-pointer rounded-lg border border-slate-700 bg-[#080f1e] px-3 text-xs text-slate-300 outline-none transition hover:border-slate-600 focus:border-blue-500"
                  >
                    <option value="3">3 Results</option>
                    <option value="5">5 Results</option>
                    <option value="10">10 Results</option>
                    <option value="15">15 Results</option>
                  </select>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Suggestions */}
        {!searched && !loading && !aiAnswer && !isAskingAI && (
          <div className="mt-7">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Try searching for
            </p>

            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setQuery(suggestion)}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-800 bg-[#101a2b] px-4 py-2.5 text-xs text-slate-400 transition duration-200 hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-blue-300"
                >
                  <Sparkles size={13} />
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Semantic Search Error */}
        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            <AlertCircle size={19} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {/* AI Error */}
        {aiError && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            <AlertCircle size={19} className="mt-0.5 shrink-0" />
            {aiError}
          </div>
        )}

        {/* AI Loading */}
        {isAskingAI && (
          <div className="mt-8 rounded-2xl border border-purple-500/20 bg-[#101a2b] px-5 py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-purple-500/20 bg-purple-500/10">
              <BrainCircuit
                size={26}
                className="animate-pulse text-purple-400"
              />
            </div>

            <h3 className="mt-5 text-base font-semibold text-white">
              AI is analyzing your documents
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Finding relevant information and preparing your answer...
            </p>
          </div>
        )}

        {/* AI Answer */}
        {!isAskingAI && aiAnswer && (
          <section className="mt-8 overflow-hidden rounded-2xl border border-purple-500/20 bg-[#101a2b] shadow-xl shadow-purple-950/10">
            <div className="flex flex-col gap-3 border-b border-slate-800 bg-gradient-to-r from-purple-500/10 to-blue-500/10 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/10 text-purple-400">
                  <Sparkles size={21} />
                </div>

                <div>
                  <h2 className="text-base font-bold text-white">
                    AI Generated Answer
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Powered by KnowledgeAI
                  </p>
                </div>
              </div>

              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1.5 text-xs font-semibold text-purple-300">
                <BrainCircuit size={14} />
                AI Response
              </span>
            </div>

            <div className="p-5 sm:p-7">
              <div className="flex items-start gap-3">
                <MessageSquareText
                  size={19}
                  className="mt-1 shrink-0 text-purple-400"
                />

                <div className="min-w-0 flex-1">
                  <p className="whitespace-pre-line text-sm leading-8 text-slate-200">
                    {aiAnswer}
                  </p>
                </div>
              </div>

              {/* AI Sources */}
              <div className="mt-7 border-t border-slate-800 pt-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <BookOpen size={17} className="text-blue-400" />
                    <h3 className="text-sm font-semibold text-white">
                      Sources
                    </h3>
                  </div>

                  <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-400">
                    {aiSources.length} Documents
                  </span>
                </div>

                {aiSources.length > 0 ? (
                  <div className="space-y-3">
                    {aiSources.map((source, index) => (
                      <div
                        key={`${source.document_id}-${source.chunk_index}-${index}`}
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-[#080f1e]/70 p-4 transition hover:border-blue-500/30"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10 text-blue-400">
                            <FileText size={18} />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-200">
                              {source.filename || "Unknown document"}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              Document #{source.document_id}
                              <span className="mx-2 text-slate-700">•</span>
                              Section {(source.chunk_index ?? 0) + 1}
                            </p>
                          </div>
                        </div>

                        <span className="shrink-0 rounded-lg border border-slate-700 bg-slate-800/70 px-2.5 py-1.5 text-xs text-slate-400">
                          Source {index + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    No source documents were returned.
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Semantic Search Loading */}
        {loading && (
          <div className="mt-8 rounded-2xl border border-slate-800 bg-[#101a2b] px-5 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10">
              <Loader2 size={26} className="animate-spin text-blue-400" />
            </div>

            <h3 className="mt-5 text-base font-semibold text-white">
              Searching your knowledge
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Finding the most relevant sections from your documents...
            </p>
          </div>
        )}

        {/* Semantic Search Results */}
        {!loading && searched && !error && (
          <div className="mt-9">
            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white">
                    Search Results
                  </h2>

                  <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-400">
                    {results.length}
                  </span>
                </div>

                <p className="mt-1.5 text-xs text-slate-500">
                  Relevant document sections for your search
                </p>
              </div>

              <div className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-800 bg-[#101a2b] px-3 py-2 text-xs text-slate-400 sm:self-auto">
                <Layers3 size={14} className="text-blue-400" />
                Semantic relevance
              </div>
            </div>

            {results.length > 0 ? (
              <div className="space-y-4">
                {results.map((result, index) => {
                  const filename =
                    result.metadata?.filename || "Untitled document";

                  return (
                    <article
                      key={`${result.document_id}-${result.chunk_index}-${index}`}
                      className="group rounded-2xl border border-slate-800 bg-[#101a2b] p-5 transition duration-200 hover:border-blue-500/40 hover:bg-[#121f34] sm:p-6"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
                            <FileText size={20} />
                          </div>

                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-semibold text-white transition group-hover:text-blue-300">
                              {filename}
                            </h3>

                            <p className="mt-1 text-xs text-slate-500">
                              Document #{result.document_id}
                              <span className="mx-2 text-slate-700">•</span>
                              Section {(result.chunk_index ?? 0) + 1}
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <span className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-400">
                            #{index + 1} Match
                          </span>

                          <span className="text-[11px] text-slate-500">
                            Distance: {Number(result.distance).toFixed(4)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-5 rounded-xl border border-slate-800/80 bg-[#080f1e]/70 p-4 sm:p-5">
                        <p className="whitespace-pre-line text-sm leading-7 text-slate-300">
                          {result.content}
                        </p>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <BookOpen size={14} />
                          Retrieved from your knowledge base
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDownloadSource(result)}
                          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-400 transition hover:border-blue-500/50 hover:bg-blue-500/20 hover:text-blue-300"
                        >
                          <Download size={14} />
                          Download Source
                          <ArrowUpRight size={14} />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-800 bg-[#101a2b] px-5 py-16 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800/70 text-slate-400">
                  <SearchX size={25} />
                </div>

                <h3 className="mt-5 text-lg font-semibold text-white">
                  No matching results
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  We couldn't find relevant information for this query.
                  Try another question or upload and process more documents.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Initial Empty State */}
        {!searched && !loading && !aiAnswer && !isAskingAI && (
          <div className="mt-9 overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-[#101a2b] to-[#0b1425]">
            <div className="flex flex-col items-center px-5 py-12 text-center sm:py-14">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10 text-blue-400 shadow-lg shadow-blue-500/5">
                <Command size={27} />
              </div>

              <h2 className="mt-6 text-xl font-bold text-white">
                Your knowledge, one search away.
              </h2>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
                Ask a question in your own words and discover
                information hidden across your uploaded documents.
              </p>

              <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-xs text-slate-500">
                <span className="flex items-center gap-2">
                  <Sparkles size={14} className="text-blue-400" />
                  Natural language
                </span>

                <span className="flex items-center gap-2">
                  <Database size={14} className="text-blue-400" />
                  Your documents
                </span>

                <span className="flex items-center gap-2">
                  <Layers3 size={14} className="text-blue-400" />
                  Relevant results
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}