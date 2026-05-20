import type { ReactNode } from 'react';
import { LoadingState } from '../LoadingState';
import { ErrorCard } from './ErrorCard';

type Props = {
  isLoading: boolean;
  isError: boolean;
  loadingMessage?: string;
  errorMessage?: string;
  errorDetail?: ReactNode;
  backTo?: string;
  backLabel?: string;
  children: ReactNode;
};

/** Standard loading / error / content wrapper for page-level queries. */
export function QueryPanel({
  isLoading,
  isError,
  loadingMessage = 'Loading…',
  errorMessage = 'Something went wrong.',
  errorDetail,
  backTo,
  backLabel,
  children,
}: Props) {
  if (isLoading) {
    return <LoadingState message={loadingMessage} />;
  }
  if (isError) {
    return (
      <ErrorCard
        message={errorMessage}
        detail={errorDetail}
        backTo={backTo}
        backLabel={backLabel}
      />
    );
  }
  return <>{children}</>;
}
