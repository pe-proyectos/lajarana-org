import { useEffect } from 'react';

export default function ConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
  title = '¿Eliminar evento?',
  message = 'Esta acción no se puede deshacer. El evento será cancelado permanentemente.',
  confirmText = 'Eliminar',
  cancelText = 'Cancelar',
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="confirm-modal-backdrop" onClick={onCancel}>
      <div className="confirm-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-modal-icon">🗑️</div>
        <h3 className="confirm-modal-title">{title}</h3>
        <p className="confirm-modal-message">{message}</p>
        <div className="confirm-modal-actions">
          <button className="confirm-modal-btn cancel" onClick={onCancel}>{cancelText}</button>
          <button className="confirm-modal-btn confirm" onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}
