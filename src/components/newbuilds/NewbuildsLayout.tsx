/**
 * NewbuildsLayout — Dark editorial wrapper for /newbuilds section
 */
import React from 'react';
import '@/styles/newbuilds-theme.css';

interface NewbuildsLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export default function NewbuildsLayout({ children, className = '' }: NewbuildsLayoutProps) {
  return (
    <div className={`nb-theme min-h-screen ${className}`}>
      {children}
    </div>
  );
}
