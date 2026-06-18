interface BrandWordmarkTextureProps {
  words?: string[];
  className?: string;
}

const defaultWords = ['FOODETA', '配送延迟', '天气风险'];

export default function BrandWordmarkTexture({ words = defaultWords, className = '' }: BrandWordmarkTextureProps) {
  return (
    <div className={`brand-wordmark-texture ${className}`.trim()} aria-hidden="true">
      {words.map((word) => (
        <span key={word}>{word}</span>
      ))}
    </div>
  );
}
