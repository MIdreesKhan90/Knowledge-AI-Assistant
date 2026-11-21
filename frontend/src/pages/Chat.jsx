
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import {
  Bot,
  Send,
  User,
  FileText,
  Loader2,
  Sparkles,
  Plus,
  MessageSquare,
  PanelLeft,
  Pencil,
  Trash2,
  X,
  History,
  MoreHorizontal,
} from "lucide-react";

import { askAI } from "../services/chat";

import {
  createConversation,
  getConversations,
  getConversationMessages,
  renameConversation,
  deleteConversation,
} from "../services/conversations";

export default function Chat() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);

  const [activeConversation, setActiveConversation] = useState(null);

  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [creatingChat, setCreatingChat] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, loading]);

  // Load conversation history
  useEffect(() => {
    let mounted = true;

    const initializeChat = async () => {
      try {
        const history = await getConversations();

        if (!mounted) return;

        setConversations(history);

        if (history.length > 0) {
          const latestConversation = history[0];

          setActiveConversation(latestConversation);

          const savedMessages = await getConversationMessages(
            latestConversation.id
          );

          if (!mounted) return;

          setMessages(savedMessages);
        }
      } catch (error) {
        console.error("Failed to load chat history:", error);
      } finally {
        if (mounted) {
          setLoadingHistory(false);
        }
      }
    };

    initializeChat();

    return () => {
      mounted = false;
    };
  }, []);

  // Create a new conversation
  const handleNewChat = async () => {
    if (loading || creatingChat) return;

    setCreatingChat(true);

    try {
      const conversation = await createConversation();

      setActiveConversation(conversation);
      setMessages([]);
      setQuestion("");

      setConversations((prev) => [
        conversation,
        ...prev.filter((item) => item.id !== conversation.id),
      ]);

      setShowHistory(false);

      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (error) {
      console.error("Failed to create conversation:", error);
      alert(
        error.response?.data?.detail ||
        "Unable to create a new chat. Please try again."
      );
    } finally {
      setCreatingChat(false);
    }
  };

  // Open an existing conversation
  const handleSelectConversation = async (conversation) => {
    if (loading) return;

    setActiveConversation(conversation);
    setMessages([]);
    setShowHistory(false);

    try {
      const savedMessages = await getConversationMessages(
        conversation.id
      );

      setMessages(savedMessages);
    } catch (error) {
      console.error("Failed to load messages:", error);

      setMessages([
        {
          role: "assistant",
          content: "Unable to load this conversation. Please try again.",
          isError: true,
        },
      ]);
    }
  };

  // Send message
  const handleSend = async (e) => {
    e.preventDefault();

    const text = question.trim();

    if (!text || loading || creatingChat) return;

    setQuestion("");
    setLoading(true);

    let conversation = activeConversation;

    try {
      // Create conversation automatically if needed
      if (!conversation) {
        conversation = await createConversation();

        setActiveConversation(conversation);

        setConversations((prev) => [
          conversation,
          ...prev.filter((item) => item.id !== conversation.id),
        ]);
      }

      // Show user message immediately
      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          content: text,
        },
      ]);

      const response = await askAI(text, conversation.id);

      // Add AI response
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response.answer,
          sources: response.sources || [],
        },
      ]);

      // Refresh history to get updated title and timestamp
      const history = await getConversations();

      setConversations(history);

      const updatedConversation = history.find(
        (item) => item.id === conversation.id
      );

      if (updatedConversation) {
        setActiveConversation(updatedConversation);
      }
    } catch (error) {
      console.error("Chat error:", error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            error.response?.data?.detail ||
            "Something went wrong. Please try again.",
          sources: [],
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  // Rename conversation
  const handleRenameConversation = async (conversation, e) => {
    e.stopPropagation();

    const newTitle = window.prompt(
      "Enter a new conversation name:",
      conversation.title
    );

    if (!newTitle || !newTitle.trim()) return;

    try {
      const updated = await renameConversation(
        conversation.id,
        newTitle.trim()
      );

      setConversations((prev) =>
        prev.map((item) =>
          item.id === conversation.id
            ? { ...item, ...updated }
            : item
        )
      );

      if (activeConversation?.id === conversation.id) {
        setActiveConversation((prev) => ({
          ...prev,
          ...updated,
        }));
      }
    } catch (error) {
      alert(
        error.response?.data?.detail ||
        "Unable to rename conversation."
      );
    }
  };

  // Delete conversation
  const handleDeleteConversation = async (conversation, e) => {
    e.stopPropagation();

    const confirmed = window.confirm(
      `Delete "${conversation.title}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await deleteConversation(conversation.id);

      const remaining = conversations.filter(
        (item) => item.id !== conversation.id
      );

      setConversations(remaining);

      if (activeConversation?.id === conversation.id) {
        setActiveConversation(null);
        setMessages([]);

        if (remaining.length > 0) {
          handleSelectConversation(remaining[0]);
        }
      }
    } catch (error) {
      alert(
        error.response?.data?.detail ||
        "Unable to delete conversation."
      );
    }
  };

  const suggestions = [
    {
      title: "Find information",
      description: "Find specific details in your documents",
      prompt: "Find specific information in my documents",
      icon: FileText,
    },
    {
      title: "Summarize documents",
      description: "Get a quick summary of your documents",
      prompt: "Give me a summary of my uploaded documents",
      icon: FileText,
    },
    {
      title: "Extract key points",
      description: "Discover important points and details",
      prompt: "Extract the important points and details",
      icon: Sparkles,
    },
    {
      title: "Ask anything",
      description: "Ask a question about your documents",
      prompt: "Ask a question about my documents",
      icon: Bot,
    },
  ];

  return (
    <div className="-m-4 flex h-[calc(100dvh-80px)] min-h-0 overflow-hidden bg-[#020617] text-white sm:-m-5 md:-m-8">

      {/* Mobile history overlay */}
      {showHistory && (
        <button
          type="button"
          aria-label="Close history"
          onClick={() => setShowHistory(false)}
          className="absolute inset-0 z-20 bg-black/60 md:hidden"
        />
      )}

      {/* History Sidebar */}
      <aside
        className={`${
          showHistory ? "flex" : "hidden"
        } absolute inset-y-0 left-0 z-30 w-[280px] shrink-0 flex-col border-r border-slate-800 bg-[#0B1222] md:relative md:flex`}
      >
        {/* Sidebar Header */}
        <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-slate-800 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400">
              <History size={19} />
            </div>

            <div>
              <h2 className="text-sm font-bold text-white">
                Chat History
              </h2>
              <p className="text-[11px] text-slate-500">
                Your conversations
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowHistory(false)}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white md:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="shrink-0 p-4">
          <button
            type="button"
            onClick={handleNewChat}
            disabled={creatingChat || loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-950/30 transition duration-200 hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creatingChat ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <Plus size={18} />
            )}

            New Chat
          </button>
        </div>

        {/* History List - Independently Scrollable */}
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4 [scrollbar-width:thin] [scrollbar-color:#334155_transparent]">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[1.5px] text-slate-500">
            Recent Conversations
          </p>

          {loadingHistory ? (
            <div className="flex items-center justify-center gap-2 py-8 text-xs text-slate-500">
              <Loader2 size={15} className="animate-spin" />
              Loading history...
            </div>
          ) : conversations.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <MessageSquare
                size={25}
                className="mx-auto mb-3 text-slate-600"
              />

              <p className="text-xs font-medium text-slate-400">
                No conversations yet
              </p>

              <p className="mt-1 text-[11px] text-slate-600">
                Start a new chat to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map((conversation) => {
                const isActive =
                  activeConversation?.id === conversation.id;

                return (
                  <div
                    key={conversation.id}
                    onClick={() =>
                      handleSelectConversation(conversation)
                    }
                    className={`group flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-3 transition duration-200 ${
                      isActive
                        ? "border-blue-500/30 bg-blue-600/10"
                        : "border-transparent hover:border-slate-700 hover:bg-slate-800/70"
                    }`}
                  >
                    <MessageSquare
                      size={16}
                      className={`shrink-0 ${
                        isActive
                          ? "text-blue-400"
                          : "text-slate-500"
                      }`}
                    />

                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-xs font-medium ${
                          isActive
                            ? "text-blue-300"
                            : "text-slate-300"
                        }`}
                      >
                        {conversation.title}
                      </p>

                      <p className="mt-1 text-[10px] text-slate-600">
                        {conversation.updated_at
                          ? new Date(
                              conversation.updated_at
                            ).toLocaleDateString()
                          : "New conversation"}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-0.5 opacity-100 transition md:opacity-0 md:group-hover:opacity-100">
                      <button
                        type="button"
                        title="Rename"
                        onClick={(e) =>
                          handleRenameConversation(conversation, e)
                        }
                        className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-700 hover:text-white"
                      >
                        <Pencil size={13} />
                      </button>

                      <button
                        type="button"
                        title="Delete"
                        onClick={(e) =>
                          handleDeleteConversation(conversation, e)
                        }
                        className="rounded-md p-1.5 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="shrink-0 border-t border-slate-800 px-5 py-4">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <Sparkles size={13} className="text-blue-400" />
            Powered by KnowledgeAI
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">

        {/* Chat Header - Fixed */}
        <header className="flex h-[76px] shrink-0 items-center justify-between border-b border-slate-800 bg-[#0F172A] px-4 sm:px-6 md:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setShowHistory(true)}
              aria-label="Open chat history"
              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white md:hidden"
            >
              <PanelLeft size={19} />
            </button>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-600/15 text-blue-400">
              <Sparkles size={20} />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-sm font-bold text-white sm:text-base">
                AI Assistant
              </h1>

              <p className="truncate text-[11px] text-slate-400 sm:text-xs">
                Your intelligent document assistant
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 text-[10px] font-medium text-emerald-400 sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              AI Ready
            </span>

            <button
              type="button"
              onClick={handleNewChat}
              disabled={loading || creatingChat}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-xs font-semibold text-slate-200 transition hover:border-blue-500 hover:bg-blue-600 hover:text-white disabled:opacity-50 sm:px-4 sm:text-sm"
            >
              <Plus size={16} />
              <span>New Chat</span>
            </button>
          </div>
        </header>

        {/* Messages Area - Independently Scrollable */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 [scrollbar-width:thin] [scrollbar-color:#334155_transparent] sm:px-6 md:px-8 md:py-8">
          <div className="mx-auto w-full max-w-4xl space-y-7">

            {/* Empty State */}
            {!loadingHistory && messages.length === 0 && (
              <div className="flex min-h-full flex-col items-center justify-center py-8 text-center">
                <div className="mb-6 flex h-[72px] w-[72px] items-center justify-center rounded-3xl border border-blue-500/20 bg-blue-600/10 text-blue-400 shadow-xl shadow-blue-950/20">
                  <Sparkles size={32} />
                </div>

                <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  How can I help you?
                </h2>

                <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">
                  Ask questions about your uploaded documents.
                  KnowledgeAI will find relevant information
                  and generate helpful answers.
                </p>

                {/* Suggestions */}
                <div className="mt-9 grid w-full max-w-2xl gap-3 sm:grid-cols-2">
                  {suggestions.map((item) => {
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.title}
                        type="button"
                        onClick={() => {
                          setQuestion(item.prompt);
                          inputRef.current?.focus();
                        }}
                        className="group flex items-start gap-3 rounded-2xl border border-slate-800 bg-[#0F172A] p-4 text-left transition duration-200 hover:-translate-y-1 hover:border-blue-500/40 hover:bg-[#131F38] hover:shadow-lg hover:shadow-blue-950/10"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600/10 text-blue-400 transition group-hover:bg-blue-600 group-hover:text-white">
                          <Icon size={19} />
                        </div>

                        <div>
                          <h3 className="text-sm font-semibold text-slate-100">
                            {item.title}
                          </h3>

                          <p className="mt-1 text-xs leading-5 text-slate-400">
                            {item.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Conversation Messages */}
            {messages.map((message, index) => (
              <div
                key={message.id || index}
                className={`flex gap-3 sm:gap-4 ${
                  message.role === "user"
                    ? "flex-row-reverse"
                    : "flex-row"
                }`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    message.role === "user"
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-950/30"
                      : "border border-slate-700 bg-[#0F172A] text-blue-400"
                  }`}
                >
                  {message.role === "user" ? (
                    <User size={18} />
                  ) : (
                    <Bot size={19} />
                  )}
                </div>

                <div
                  className={`max-w-[88%] min-w-0 rounded-2xl px-4 py-3 text-sm leading-7 sm:max-w-[85%] sm:px-5 ${
                    message.role === "user"
                      ? "rounded-tr-sm bg-blue-600 text-white"
                      : message.isError
                      ? "border border-red-500/30 bg-red-500/10 text-red-300"
                      : "rounded-tl-sm border border-slate-800 bg-[#0F172A] text-slate-200"
                  }`}
                >
                  <div
                    className="
                      prose prose-invert prose-sm max-w-none
                      [&_strong]:font-bold
                      [&_strong]:text-white
                      [&_ul]:my-3
                      [&_ul]:list-disc
                      [&_ul]:space-y-2
                      [&_ul]:pl-5
                      [&_ol]:my-3
                      [&_ol]:list-decimal
                      [&_ol]:space-y-2
                      [&_ol]:pl-5
                      [&_p]:my-2
                      [&_h1]:text-lg
                      [&_h1]:font-bold
                      [&_h2]:text-base
                      [&_h2]:font-bold
                      [&_li]:pl-1
                      [&_a]:text-blue-400
                    "
                  >
                    <ReactMarkdown>
                      {message.content}
                    </ReactMarkdown>
                  </div>

                  {/* Source Cards */}
                  {message.sources?.length > 0 && (
                    <div className="mt-4 border-t border-slate-700 pt-3">
                      <p className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-400">
                        <FileText size={14} className="text-blue-400" />
                        Sources ({message.sources.length})
                      </p>

                      <div className="space-y-2">
                        {message.sources.map((source, i) => (
                          <div
                            key={i}
                            className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-800/70 p-3 text-xs text-slate-300"
                          >
                            <FileText
                              size={15}
                              className="shrink-0 text-blue-400"
                            />

                            <span className="min-w-0 flex-1 truncate">
                              {source.filename}
                            </span>

                            <span className="shrink-0 rounded-md bg-slate-700/70 px-2 py-1 text-[10px] text-slate-400">
                              Chunk {source.chunk_index}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* AI Loading State */}
            {loading && (
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-[#0F172A] text-blue-400">
                  <Bot size={19} />
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-[#0F172A] px-4 py-3 text-sm text-slate-400">
                  <Loader2
                    size={16}
                    className="animate-spin text-blue-400"
                  />
                  <span>Thinking...</span>
                  <span className="flex gap-1">
                    <span className="h-1 w-1 animate-bounce rounded-full bg-blue-400" />
                    <span className="h-1 w-1 animate-bounce rounded-full bg-blue-400 [animation-delay:150ms]" />
                    <span className="h-1 w-1 animate-bounce rounded-full bg-blue-400 [animation-delay:300ms]" />
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message Composer - Fixed at Bottom */}
        <footer className="z-10 shrink-0 border-t border-slate-800 bg-[#0F172A] px-4 pb-4 pt-4 sm:px-6 md:px-8 md:pb-5">
          <div className="mx-auto max-w-4xl">
            <form
              onSubmit={handleSend}
              className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-[#020617] p-2 shadow-xl shadow-black/10 transition duration-200 focus-within:border-blue-500/70 focus-within:ring-2 focus-within:ring-blue-500/10"
            >
              <input
                ref={inputRef}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask anything about your documents..."
                disabled={loading || creatingChat}
                className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500 disabled:opacity-60"
              />

              <button
                type="submit"
                disabled={!question.trim() || loading || creatingChat}
                aria-label="Send message"
                className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-950/30 transition duration-200 hover:bg-blue-500 hover:shadow-blue-900/30 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </form>

            <p className="mt-3 text-center text-[10px] text-slate-500 sm:text-xs">
              KnowledgeAI can make mistakes. Verify important information.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
