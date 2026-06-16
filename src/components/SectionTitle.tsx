import { ReactNode } from 'react';

interface SectionTitleProps {
  eyebrow: string;
  title: string;
  children: ReactNode;
}

export default function SectionTitle({ eyebrow, title, children }: SectionTitleProps) {
  const quietEyebrow = eyebrow.replace(/^Section\s+/i, '章节 ');

  return (
    <div className="section-title">
      <span aria-label={quietEyebrow}>{quietEyebrow}</span>
      <h2>{title}</h2>
      <p>{children}</p>
    </div>
  );
}
