import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ModalShell } from '../ui/ModalShell';
import { getApiErrorMessage } from '../../services/http';
import type { HrEvaluator } from '../../types/evaluator';

const createSchema = z.object({
  name: z.string().optional(),
  email: z.string().email(),
  password: z.string().min(8, 'At least 8 characters'),
});

const editSchema = z.object({
  name: z.string().optional(),
  email: z.string().email(),
  password: z
    .string()
    .optional()
    .refine((v) => !v || v.length >= 8, 'At least 8 characters'),
});

type CreateForm = z.infer<typeof createSchema>;
type EditForm = z.infer<typeof editSchema>;

type Props = {
  mode: 'create' | 'edit';
  open: boolean;
  evaluator?: HrEvaluator | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onCreate: (data: CreateForm) => void;
  onUpdate: (data: EditForm) => void;
  error?: unknown;
};

export function EvaluatorFormModal({
  mode,
  open,
  evaluator,
  isSubmitting,
  onClose,
  onCreate,
  onUpdate,
  error,
}: Props) {
  const isCreate = mode === 'create';

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateForm | EditForm>({
    resolver: zodResolver(isCreate ? createSchema : editSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  useEffect(() => {
    if (!open) {
      reset({ name: '', email: '', password: '' });
      return;
    }
    if (!isCreate && evaluator) {
      reset({ name: evaluator.name ?? '', email: evaluator.email, password: '' });
    }
  }, [open, isCreate, evaluator, reset]);

  const titleId = isCreate ? 'evaluator-create-title' : 'evaluator-edit-title';

  return (
    <ModalShell
      open={open}
      titleId={titleId}
      title={isCreate ? 'Add evaluator' : 'Edit evaluator'}
      description={
        isCreate
          ? 'They can sign in with this email and password to submit assessment plans and review candidates.'
          : 'Update profile details. Leave password blank to keep the current one.'
      }
      onClose={onClose}
      closeDisabled={isSubmitting}
      footer={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button type="button" className="btn-secondary" disabled={isSubmitting} onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            form="evaluator-form"
            className="btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving…' : isCreate ? 'Create evaluator' : 'Save changes'}
          </button>
        </div>
      }
    >
      <form
        id="evaluator-form"
        className="space-y-4"
        onSubmit={handleSubmit((data) =>
          isCreate ? onCreate(data as CreateForm) : onUpdate(data as EditForm),
        )}
      >
        <label className="app-label">
          Name <span className="font-normal text-slate-400">(optional)</span>
          <input className="app-input" placeholder="Alex Rivera" {...register('name')} />
        </label>
        <label className="app-label">
          Email
          <input
            className="app-input"
            type="email"
            autoComplete="off"
            placeholder="evaluator@company.com"
            {...register('email')}
          />
          {errors.email && (
            <span className="mt-1 block text-xs font-medium text-red-600">
              {errors.email.message}
            </span>
          )}
        </label>
        <label className="app-label">
          {isCreate ? 'Initial password' : 'New password'}
          {!isCreate && <span className="font-normal text-slate-400"> (optional)</span>}
          <input
            className="app-input"
            type="password"
            autoComplete="new-password"
            placeholder={isCreate ? 'Minimum 8 characters' : 'Leave blank to keep current'}
            {...register('password')}
          />
          {errors.password && (
            <span className="mt-1 block text-xs font-medium text-red-600">
              {errors.password.message}
            </span>
          )}
        </label>
        {error ? (
          <p className="text-sm font-medium text-red-700" role="alert">
            {getApiErrorMessage(error, 'Could not save evaluator.')}
          </p>
        ) : null}
      </form>
    </ModalShell>
  );
}
