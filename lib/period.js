// 「管理期間」＝毎月16日〜翌月15日の単位を扱うための計算ロジック

function pad(n) {
  return String(n).padStart(2, '0');
}

export function formatDateISO(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// 基準日が属する「16日〜翌月15日」の期間を返す
export function getPeriodRange(refDate) {
  const y = refDate.getFullYear();
  const m = refDate.getMonth();
  const day = refDate.getDate();

  let startY = y;
  let startM = m;
  if (day < 16) {
    startM = m - 1;
    if (startM < 0) {
      startM = 11;
      startY = y - 1;
    }
  }

  const start = new Date(startY, startM, 16);
  const end = new Date(startY, startM + 1, 15);
  const label = `${start.getFullYear()}年${start.getMonth() + 1}月16日 〜 ${end.getFullYear()}年${end.getMonth() + 1}月15日`;

  return { start, end, label };
}

// カレンダー表示用に、期間を含む「月曜始まり」の週単位のマス目を作る
// （期間の最初と最後が中途半端な週でも、その週をまるごと表示するため）
export function getCalendarWeeks(start, end) {
  const gridStart = new Date(start);
  const startOffset = (start.getDay() + 6) % 7; // 0=月曜
  gridStart.setDate(start.getDate() - startOffset);

  const gridEnd = new Date(end);
  const endOffset = (end.getDay() + 6) % 7;
  gridEnd.setDate(end.getDate() + (6 - endOffset));

  const weeks = [];
  const cur = new Date(gridStart);
  while (cur <= gridEnd) {
    const week = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}
