"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";

interface Comment {
  id: string;
  configId: string;
  userId: string;
  parentId: string | null;
  body: string;
  createdAt: string;
  userName: string | null;
  userImage: string | null;
}

interface ThreadedCommentsProps {
  configId: string;
}

/* ─── Single comment ─────────────────────────────────────── */
function CommentCard({
  comment,
  depth,
  onReply,
}: {
  comment: Comment;
  depth: number;
  onReply: (id: string) => void;
}) {
  const ml = depth > 0 ? `ml-${Math.min(depth * 4, 12)}` : "";

  return (
    <div className={`${ml} ${depth > 0 ? "border-l-2 border-border pl-4" : ""}`}>
      <div className="group rounded-xl border border-border bg-surface p-4 transition-all hover:border-border-hover">
        {/* Header */}
        <div className="mb-2 flex items-center gap-2.5">
          <Avatar className="h-6 w-6">
            <AvatarImage src={comment.userImage ?? undefined} />
            <AvatarFallback className="text-[10px] bg-accent-muted text-accent">
              {comment.userName?.[0] ?? "U"}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium text-foreground">
            {comment.userName ?? "Anonymous"}
          </span>
          <span className="text-xs text-muted-fg" aria-hidden="true">·</span>
          <time className="text-xs text-muted-fg">
            {new Date(comment.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </time>
        </div>

        {/* Body */}
        <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
          {comment.body}
        </p>

        {/* Reply button */}
        <button
          type="button"
          onClick={() => onReply(comment.id)}
          className="mt-2 text-xs font-medium text-muted-fg hover:text-accent transition-colors"
        >
          Reply
        </button>
      </div>
    </div>
  );
}

/* ─── Comment form ───────────────────────────────────────── */
function CommentForm({
  configId,
  parentId,
  onSubmitted,
  onCancel,
  placeholder = "Share your thoughts…",
  submitLabel = "Post comment",
}: {
  configId: string;
  parentId?: string;
  onSubmitted: () => void;
  onCancel?: () => void;
  placeholder?: string;
  submitLabel?: string;
}) {
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);

  const submit = useCallback(async () => {
    if (!body.trim() || posting) return;
    setPosting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configId, parentId, body: body.trim() }),
      });
      if (res.ok) {
        setBody("");
        onSubmitted();
      }
    } finally {
      setPosting(false);
    }
  }, [body, configId, parentId, posting, onSubmitted]);

  return (
    <div className="flex gap-3">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full resize-none rounded-xl border border-border bg-surface p-3 text-sm text-foreground placeholder:text-muted-fg focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/10 transition-all"
      />
      <div className="flex flex-col gap-2">
        <Button size="sm" onClick={submit} disabled={!body.trim() || posting}>
          {posting ? "Posting…" : submitLabel}
        </Button>
        {onCancel && (
          <Button size="sm" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}

/* ─── ThreadedComments ───────────────────────────────────── */
export function ThreadedComments({ configId }: ThreadedCommentsProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const fetchComments = useCallback(() => {
    setLoading(true);
    fetch(`/api/comments?configId=${configId}`)
      .then((r) => r.json())
      .then((data) => setComments(Array.isArray(data) ? data : []))
      .catch(() => setComments([]))
      .finally(() => setLoading(false));
  }, [configId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  /* ─── Build thread tree ──────────────────────────────── */
  const { roots, repliesMap } = useMemo(() => {
    const roots: Comment[] = [];
    const map = new Map<string, Comment[]>();
    for (const c of comments) {
      if (!c.parentId) {
        roots.push(c);
      } else {
        const list = map.get(c.parentId) || [];
        list.push(c);
        map.set(c.parentId, list);
      }
    }
    return { roots, repliesMap: map };
  }, [comments]);

  return (
    <div>
      {/* ── New comment form ── */}
      {session?.user ? (
        <div className="mb-8">
          <CommentForm
            configId={configId}
            onSubmitted={() => {
              fetchComments();
              setReplyingTo(null);
            }}
          />
        </div>
      ) : (
        <div className="mb-8 rounded-xl border border-dashed border-border bg-surface/30 px-6 py-4 text-center">
          <p className="text-sm text-muted-fg">
            <button
              type="button"
              onClick={() => signIn("github")}
              className="font-medium text-accent hover:underline"
            >
              Sign in
            </button>{" "}
            to join the discussion.
          </p>
        </div>
      )}

      {/* ── Comments list ── */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-border bg-surface p-4"
            >
              <div className="mb-2 flex items-center gap-2.5">
                <div className="h-6 w-6 rounded-full bg-surface-hover" />
                <div className="h-3 w-24 rounded bg-surface-hover" />
              </div>
              <div className="space-y-1.5">
                <div className="h-3 w-full rounded bg-surface-hover" />
                <div className="h-3 w-3/4 rounded bg-surface-hover" />
              </div>
            </div>
          ))}
        </div>
      ) : roots.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center rounded-2xl border border-dashed border-border bg-surface/30">
          <MessageSquare className="mb-2 h-6 w-6 text-muted-fg/40" />
          <p className="text-sm text-muted-fg">No comments yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {roots.map((root) => (
            <div key={root.id}>
              <CommentCard
                comment={root}
                depth={0}
                onReply={setReplyingTo}
              />

              {/* ── Reply form inline ── */}
              {replyingTo === root.id && (
                <div className="ml-8 mt-3">
                  <CommentForm
                    configId={configId}
                    parentId={root.id}
                    onSubmitted={() => {
                      fetchComments();
                      setReplyingTo(null);
                    }}
                    onCancel={() => setReplyingTo(null)}
                    placeholder="Write a reply…"
                    submitLabel="Reply"
                  />
                </div>
              )}

              {/* ── Replies ── */}
              {repliesMap.get(root.id)?.map((reply) => (
                <div key={reply.id} className="mt-3">
                  <CommentCard
                    comment={reply}
                    depth={1}
                    onReply={setReplyingTo}
                  />

                  {replyingTo === reply.id && (
                    <div className="ml-12 mt-3">
                      <CommentForm
                        configId={configId}
                        parentId={reply.id}
                        onSubmitted={() => {
                          fetchComments();
                          setReplyingTo(null);
                        }}
                        onCancel={() => setReplyingTo(null)}
                        placeholder="Write a reply…"
                        submitLabel="Reply"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
