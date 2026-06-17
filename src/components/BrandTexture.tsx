interface BrandTextureProps {
  words?: string;
  className?: string;
}

export default function BrandTexture({ words = 'ETA ETA ETA FOODETA DELIVERY RISK', className = '' }: BrandTextureProps) {
  return (
    <div className={`brand-texture${className ? ` ${className}` : ''}`} aria-hidden="true">
      {words}
    </div>
  );
}
