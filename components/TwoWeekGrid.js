'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { STATUS_LABEL, STATUS_CLASS } from '../lib/statusLabels';

const WEEKDAY_LABELS = ['月', '火', '水', '木', '金', '土', '日'];

// 選択肢は分かりやすいよう省略しない表記のままにしています
const STATUS_OPTIONS = [
  { value: 'full_work', label: '出勤' },
  { value: 'half_work', label: '半日出勤' },
  { value: 'day_off', label: '休日' },
];

// cells: [{ iso, dayNumber, status, manualFixed, isToday } | null, ...]
// null は7列グリッドの余白（本日から2週間の範囲外）
export default function TwoWeekGrid({ cells }) {
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  const selectedCell = cells.find((c) => c && c.iso === selected);

  function openCell(iso) {
    setSelected(iso);
    setErrorMsg('');
  }

  async function saveStatus(status) {
    if (!selected) return;
    setSaving(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selected, status }),
      });
      if (!res.ok) {
        throw new Error('保存に失敗しました。もう一度お試しください。');
      }
      setSelected(null);
      router.refresh();
    } catch (e) {
      setErrorMsg(e.message || '保存に失敗しました。もう一度お試しください。');
    } finally {
      setSaving(false);
    }
  }

  async function clearDay() {
    if (!selected) return;
    setSaving(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/schedule', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selected }),
      });
      if (!res.ok) {
        throw new Error('削除に失敗しました。もう一度お試しください。');
      }
      setSelected(null);
      router.refresh();
    } catch (e) {
      setErrorMsg(e.message || '削除に失敗しました。もう一度お試しください。');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="calendar-grid two-week-grid">
        {WEEKDAY_LABELS.map((w) => (
          <div key={w} className="weekday-header">
            {w}
          </div>
        ))}
        {cells.map((c, idx) =>
          c ? (
            <button
              key={c.iso}
              type="button"
              className={[
                'day-cell',
                'day-cell-large',
                c.isToday ? 'today' : '',
                c.status ? STATUS_CLASS[c.status] : '',
              ].join(' ')}
              onClick={() => openCell(c.iso)}
            >
              <div className="day-number">{c.dayNumber}</div>
              {c.status && <div className="day-status day-status-large">{STATUS_LABEL[c.status]}</div>}
              {c.manualFixed && <div className="manual-badge">手動</div>}
            </button>
          ) : (
            <div key={`blank-${idx}`} className="day-cell day-cell-blank" />
          )
        )}
      </div>

      {selectedCell && (
        <div className="modal-backdrop" onClick={() => !saving && setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <p className="modal-title">{selected} の予定を選択</p>
            {errorMsg && <p className="error modal-error">{errorMsg}</p>}
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className="modal-option"
                disabled={saving}
                onClick={() => saveStatus(opt.value)}
              >
                {opt.label}
              </button>
            ))}
            <button className="modal-option modal-clear" disabled={saving} onClick={clearDay}>
              未設定に戻す
            </button>
            <button className="modal-cancel" disabled={saving} onClick={() => setSelected(null)}>
              キャンセル
            </button>
          </div>
        </div>
      )}
    </>
  );
}
