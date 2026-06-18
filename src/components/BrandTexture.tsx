interface BrandTextureProps {
  words?: string;
  className?: string;
}

export default function BrandTexture({ words = 'ETA ETA ETA FoodETA 配送 延迟 天气', className = '' }: BrandTextureProps) {
  return (
    <div className={`brand-texture${className ? ` ${className}` : ''}`} aria-hidden="true">
      {words}
    </div>
  );
}
