import { motion } from 'framer-motion';
import { ReactNode, CSSProperties } from 'react';

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  delay?: number;
}

export default function AnimatedCard({ 
  children, 
  className = '', 
  style,
  delay = 0 
}: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

