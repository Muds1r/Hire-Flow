const LOGO_SRC = '/futurenostics-logo.png';

type SiteLogoProps = {
  variant?: 'header' | 'auth' | 'hero';
  className?: string;
};

const variantClass: Record<NonNullable<SiteLogoProps['variant']>, string> = {
  header: 'h-9 w-auto max-w-[200px] object-left',
  auth: 'mx-auto h-16 w-auto max-w-[260px] object-contain',
  hero: 'h-14 w-auto max-w-[240px] object-left sm:h-16',
};

export function SiteLogo({ variant = 'header', className = '' }: SiteLogoProps) {
  return (
    <img
      src={LOGO_SRC}
      alt="Futurenostics"
      width={260}
      height={80}
      decoding="async"
      className={`object-contain ${variantClass[variant]} ${className}`.trim()}
    />
  );
}
