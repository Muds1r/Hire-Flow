import { useState } from 'react';
import type { EvaluatorPost } from '../../types';
import { getApiErrorMessage } from '../../services/http';

export type SectionNotesConfig = {
  posts: EvaluatorPost[];
  sectionTitle: string;
  readOnly: boolean;
  canAddNotes: boolean;
  currentUserId?: string;
  onCreate?: (sectionTitle: string, comment: string) => Promise<void> | void;
  onUpdate?: (postId: string, comment: string) => Promise<void> | void;
  onDelete?: (postId: string) => Promise<void> | void;
  isCreating?: boolean;
  isUpdating?: boolean;
  createError?: unknown;
};

export function SectionInlineNotes({
  posts,
  sectionTitle,
  readOnly,
  canAddNotes,
  currentUserId,
  onCreate,
  onUpdate,
  onDelete,
  isCreating,
  isUpdating,
  createError,
}: SectionNotesConfig) {
  const [draft, setDraft] = useState('');
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editComment, setEditComment] = useState('');

  const sectionPosts = posts
    .filter((p) => p.sectionTitle === sectionTitle)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const showEmpty = sectionPosts.length === 0 && !canAddNotes;

  return (
    <div className="flex min-h-[5.5rem] flex-col">
      {showEmpty ? (
        <p className="flex flex-1 items-center text-sm text-slate-500">
          <span className="rounded-lg border border-dashed border-slate-200 bg-surface/80 px-3 py-2 italic">
            No notes yet for this section
          </span>
        </p>
      ) : (
        <ul className="space-y-2.5">
          {sectionPosts.map((p) => (
            <li
              key={p.id}
              className="rounded-lg border border-slate-200/80 bg-slate-50/50 px-3.5 py-2.5"
            >
              {editingPostId === p.id && onUpdate ? (
                <div className="space-y-2">
                  <textarea
                    className="app-input !mt-0 min-h-[4.5rem] !py-2 text-sm"
                    value={editComment}
                    onChange={(e) => setEditComment(e.target.value)}
                    maxLength={8000}
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="btn-primary btn-sm"
                      disabled={isUpdating || editComment.trim().length === 0}
                      onClick={async () => {
                        await onUpdate(p.id, editComment.trim());
                        setEditingPostId(null);
                      }}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      className="btn-secondary btn-sm"
                      onClick={() => setEditingPostId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-[11px] font-medium text-slate-500">
                    {p.evaluator.name || p.evaluator.email}
                    <span className="font-normal text-slate-400">
                      {' '}
                      · {new Date(p.createdAt).toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                  </p>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
                    {p.comment}
                  </p>
                  {!readOnly && p.evaluator.id === currentUserId && onUpdate && onDelete && (
                    <div className="mt-2 flex gap-3">
                      <button
                        type="button"
                        className="text-xs font-semibold text-mint-dark hover:text-mint-dark"
                        onClick={() => {
                          setEditingPostId(p.id);
                          setEditComment(p.comment);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="text-xs font-semibold text-red-600 hover:text-red-500"
                        onClick={() => onDelete(p.id)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {canAddNotes && onCreate && (
        <div
          className={`${sectionPosts.length > 0 ? 'mt-3 border-t border-slate-100 pt-3' : 'mt-auto'}`}
        >
          <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Add follow-up
            <textarea
              className="app-input !mt-1.5 min-h-[4.5rem] !py-2.5 text-sm"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={8000}
              placeholder="Write your note for this section…"
            />
          </label>
          <button
            type="button"
            className="btn-primary btn-sm mt-2"
            disabled={isCreating || draft.trim().length === 0}
            onClick={async () => {
              const comment = draft.trim();
              if (!comment) {
                return;
              }
              await onCreate(sectionTitle, comment);
              setDraft('');
            }}
          >
            {isCreating ? 'Saving…' : 'Add follow-up'}
          </button>
          {createError != null && (
            <p className="mt-2 text-xs font-medium text-red-800" role="alert">
              {getApiErrorMessage(createError, 'Could not save note.')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
