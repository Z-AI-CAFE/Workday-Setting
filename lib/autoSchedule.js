import { formatDateISO } from './period';

// schedule_days.reason に入る値の一覧（コメント用。DB側で強制はしていません）
export const REASON = {
  COLLEAGUE_OFF: 'colleague_off',
  SALARY_MONK_PREP: 'salary_monk_prep',
  SALARY_MONK_PAY: 'salary_monk_pay',
  SALARY_STAFF_PREP: 'salary_staff_prep',
  SALARY_STAFF_PAY: 'salary_staff_pay',
  FIRST_OF_MONTH: 'first_of_month',
  PRIVATE_EVENT: 'private_event',
  AUTO_ADJUST: 'auto_adjust',
  MANUAL: 'manual',
  CONFLICT_COLLEAGUE_PRIVATE: 'conflict_colleague_private',
  CONFLICT_PRIORITY_PRIVATE: 'conflict_priority_private',
};

const SALARY_REASON_BY_TYPE = {
  monk_prep: REASON.SALARY_MONK_PREP,
  monk_pay: REASON.SALARY_MONK_PAY,
  staff_prep: REASON.SALARY_STAFF_PREP,
  staff_pay: REASON.SALARY_STAFF_PAY,
};

function addDays(iso, n) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  return formatDateISO(d);
}

function isWorkStatus(status) {
  return status === 'full_work' || status === 'half_work';
}

function isOffStatus(status) {
  return status === 'day_off';
}

function isFirstOfMonth(iso) {
  return iso.slice(-2) === '01';
}

// ============================================================
// 最優先ルール・優先ルール（1日ごとに、その日だけの情報で決まるもの）
// ============================================================
// colleagueHolidays: Set<'YYYY-MM-DD'>
// salaryDays: Map<'YYYY-MM-DD', string[]>  (種類の配列。複数種類が重なることもある)
// privateEvents: Set<'YYYY-MM-DD'>
function resolvePriorityRules(iso, { colleagueHolidays, salaryDays, privateEvents }) {
  const hasColleagueOff = colleagueHolidays.has(iso);
  const hasPrivate = privateEvents.has(iso);
  const salaryTypes = salaryDays.get(iso) || [];
  const hasSalary = salaryTypes.length > 0;

  // 【最優先ルール】同僚の休日 → 全日出勤（ただしプライベート用事と重なる場合は要確認）
  if (hasColleagueOff) {
    if (hasPrivate) {
      return { status: 'needs_confirmation', reason: REASON.CONFLICT_COLLEAGUE_PRIVATE };
    }
    return { status: 'full_work', reason: REASON.COLLEAGUE_OFF };
  }

  // 【優先ルール】給料日 or 毎月1日 と プライベート用事が重なる → 要確認
  if (hasPrivate && (hasSalary || isFirstOfMonth(iso))) {
    return { status: 'needs_confirmation', reason: REASON.CONFLICT_PRIORITY_PRIVATE };
  }

  // 【優先ルール】プライベート用事のみ → 休日
  if (hasPrivate) {
    return { status: 'day_off', reason: REASON.PRIVATE_EVENT };
  }

  // 【優先ルール】給料関連日 → 半日出勤（毎月1日ルールも「出勤」なのでこれで両立）
  if (hasSalary) {
    return { status: 'half_work', reason: SALARY_REASON_BY_TYPE[salaryTypes[0]] || REASON.SALARY_MONK_PREP };
  }

  // 【優先ルール】毎月1日 → 半日出勤
  // （全日出勤は「同僚が休みの日」だけに使う、というルールのため。
  //   同僚が休みの1日は、この手前の「同僚の休日」判定で既に全日出勤になっています）
  if (isFirstOfMonth(iso)) {
    return { status: 'half_work', reason: REASON.FIRST_OF_MONTH };
  }

  // ここまでで決まらない日は、週の出勤日数調整（優先ルール5）に委ねる
  return null;
}

// ============================================================
// 優先ルール5：月曜〜日曜の週単位で「出勤4日・休み3日」に近づける
// ============================================================
// weekDates: その週7日分の 'YYYY-MM-DD' 配列（月〜日の順）
// statusMap: iso -> { status, reason } のオブジェクト（既に確定している日を含む）
// 戻り値: 新しく決めた日だけの { [iso]: { status, reason } }
function balanceWeek(weekDates, statusMap) {
  const lockedWork = weekDates.filter((d) => isWorkStatus(statusMap[d]?.status)).length;
  const lockedOff = weekDates.filter((d) => isOffStatus(statusMap[d]?.status)).length;
  const freeDates = weekDates.filter((d) => !statusMap[d]);

  if (freeDates.length === 0) return {};

  // 目標「出勤4・休み3」に対して、まだ埋まっていない出勤枠の数
  const neededWork = Math.max(0, Math.min(freeDates.length, 4 - lockedWork));

  // 劣後ルールを考慮したスコアで並べ替え（高いほど出勤に向いている日）
  const scored = freeDates.map((iso) => {
    const dow = new Date(`${iso}T00:00:00`).getDay(); // 0=日 1=月 ... 6=土
    let score = 0;
    if (dow === 1 || dow === 5) score += 2; // 劣後ルール7：月・金はできるだけ出勤
    const prev = statusMap[addDays(iso, -1)];
    if (prev?.status === 'full_work') score -= 2; // 劣後ルール6：全日出勤の翌日はできるだけ休みに
    return { iso, score };
  });
  scored.sort((a, b) => b.score - a.score);

  // 全日出勤は「同僚が休みの日」だけに使うルールのため、
  // ここで自動的に決める出勤日はすべて半日出勤にします。
  const result = {};
  scored.forEach((item, idx) => {
    result[item.iso] =
      idx < neededWork
        ? { status: 'half_work', reason: REASON.AUTO_ADJUST }
        : { status: 'day_off', reason: REASON.AUTO_ADJUST };
  });
  return result;
}

// ============================================================
// 劣後ルール8・9：3連休・4連続出勤をできるだけ避ける（best-effort）
// ============================================================
// 週の出勤日数（優先ルール5）を崩さないよう、同じ週の中で
// auto_adjust（自動調整）どうしの出勤日・休日を入れ替えるだけに限定しています。
function repairStreaks(orderedDates, statusMap) {
  const isSwappable = (iso) => statusMap[iso]?.reason === REASON.AUTO_ADJUST;

  function findStreak(predicate, minLen) {
    let start = null;
    for (let i = 0; i <= orderedDates.length; i++) {
      const iso = orderedDates[i];
      const ok = iso && predicate(statusMap[iso]?.status);
      if (ok && start === null) start = i;
      if (!ok) {
        if (start !== null && i - start >= minLen) return [start, i - 1];
        start = null;
      }
    }
    return null;
  }

  function trySwapWithin(streakStartIdx, streakEndIdx, wantStatus) {
    // 週(直近7日以内)の中から、逆の状態になっている入れ替え可能な日を探す
    for (let i = streakStartIdx; i <= streakEndIdx; i++) {
      const iso = orderedDates[i];
      if (!isSwappable(iso)) continue;
      for (let offset = -6; offset <= 6; offset++) {
        const j = i + offset;
        if (j < 0 || j >= orderedDates.length) continue;
        const candidateIso = orderedDates[j];
        if (!isSwappable(candidateIso)) continue;
        if (statusMap[candidateIso]?.status === wantStatus) continue;
        // isoとcandidateIsoが同じ週(月曜起点)かどうか確認して、週の集計を崩さないようにする
        const mondayA = addDays(iso, -((new Date(`${iso}T00:00:00`).getDay() + 6) % 7));
        const mondayB = addDays(candidateIso, -((new Date(`${candidateIso}T00:00:00`).getDay() + 6) % 7));
        if (mondayA !== mondayB) continue;

        // 入れ替え実行
        const tmp = statusMap[iso];
        statusMap[iso] = statusMap[candidateIso];
        statusMap[candidateIso] = tmp;
        return true;
      }
    }
    return false;
  }

  // 4連続出勤 → 一部を休日と入れ替え
  for (let attempt = 0; attempt < 10; attempt++) {
    const streak = findStreak(isWorkStatus, 4);
    if (!streak) break;
    const changed = trySwapWithin(streak[0], streak[1], 'day_off');
    if (!changed) break;
  }

  // 3連休 → 一部を出勤（半日出勤）と入れ替え
  for (let attempt = 0; attempt < 10; attempt++) {
    const streak = findStreak(isOffStatus, 3);
    if (!streak) break;
    const changed = trySwapWithin(streak[0], streak[1], 'half_work');
    if (!changed) break;
  }
}

// ============================================================
// メイン処理
// ============================================================
// contextDates: 対象期間 + 前後の週を含む全日付('YYYY-MM-DD')の配列（月曜始まり週単位で並んでいること）
// periodStart / periodEnd: 実際に保存対象とする期間（16日〜翌月15日）
// existingDays: Map<iso, { status, reason, manual_fixed }>  現在DBに入っている内容
// colleagueHolidays / salaryDays / privateEvents: 上記の入力データ
export function computeAutoSchedule({
  contextDates,
  periodStart,
  periodEnd,
  existingDays,
  colleagueHolidays,
  salaryDays,
  privateEvents,
}) {
  const statusMap = {};

  // 1. 手動固定の日はそのまま採用（絶対に上書きしない）
  // 2. それ以外の日は、最優先・優先ルールでまず決められるものを決める
  contextDates.forEach((iso) => {
    const existing = existingDays.get(iso);
    if (existing?.manual_fixed) {
      statusMap[iso] = { status: existing.status, reason: existing.reason, locked: true };
      return;
    }
    const resolved = resolvePriorityRules(iso, { colleagueHolidays, salaryDays, privateEvents });
    if (resolved) {
      statusMap[iso] = resolved;
    }
    // 決まらない日はここでは何もしない（週調整ルールに委ねる）
  });

  // 3. 優先ルール5：月曜始まりの週ごとに、残りの日を「出勤4・休み3」に近づける
  for (let i = 0; i < contextDates.length; i += 7) {
    const week = contextDates.slice(i, i + 7);
    if (week.length < 7) continue; // 念のため：7日そろっている週だけ対象にする
    const assigned = balanceWeek(week, statusMap);
    Object.entries(assigned).forEach(([iso, value]) => {
      statusMap[iso] = value;
    });
  }

  // 4. 劣後ルール6は balanceWeek のスコアリングに組み込み済み。
  //    劣後ルール8・9は仕上げの入れ替えパスで対応（best-effort）。
  repairStreaks(contextDates, statusMap);

  // 5. 実際に保存するのは対象期間内かつ「手動固定でない」日だけ
  const updates = [];
  contextDates.forEach((iso) => {
    if (iso < periodStart || iso > periodEnd) return;
    const entry = statusMap[iso];
    if (!entry || entry.locked) return; // 手動固定 or 未確定(通常起きない想定)はスキップ
    updates.push({ date: iso, status: entry.status, reason: entry.reason });
  });

  return updates;
}
