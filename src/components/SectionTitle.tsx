import { ReactNode } from 'react';

interface SectionTitleProps {
  eyebrow: string;
  title: string;
  children: ReactNode;
}

export default function SectionTitle({ eyebrow, title, children }: SectionTitleProps) {
  return (
    <div className="section-title">
      <span>{eyebrow}</span>
      <h2>{title}</h2>
      <p>{children}</p>
    </div>
  );
}
