import { SiteLogo } from './SiteLogo';

type AuthBrandingProps = {
  title: string;
  subtitle: string;
};

export function AuthBranding({ title, subtitle }: AuthBrandingProps) {
  return (
    <div className="mb-6 text-center">
      <div className="mb-4 flex justify-center">
        <SiteLogo variant="auth" />
      </div>
      <h1 className="text-xl font-bold tracking-tight text-slate-900">{title}</h1>
      <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
    </div>
  );
}
