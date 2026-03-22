import { motion } from 'framer-motion';

export default function AnimatedCard({ children, className = '', delay = 0, glowColor = 'var(--violet)' }) {
  return (
    <motion.div
      className={`island-animated ${className}`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      whileHover={{
        y: -6,
        transition: { duration: 0.25 },
      }}
      style={{ '--glow-color': glowColor }}
    >
      {children}
    </motion.div>
  );
}
