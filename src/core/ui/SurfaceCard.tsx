'use client';

import { ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface SurfaceCardProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  spotlight?: boolean;
}

export function SurfaceCard({ children, spotlight, className = '', ...props }: SurfaceCardProps) {
  return (
    <motion.div
      className={`cockpit-panel ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}
