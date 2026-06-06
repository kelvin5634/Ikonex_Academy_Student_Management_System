export default function ConfirmDialog({ open, title = 'Confirm', message, onConfirm, onCancel, confirmText = 'Confirm', danger }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 grid place-items-center p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-brand-800">{title}</h3>
        <p className="text-sm text-slate-600 mt-2">{message}</p>
        <div className="flex gap-2 justify-end mt-5">
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button className={danger ? 'btn-danger' : 'btn-primary'} onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}
