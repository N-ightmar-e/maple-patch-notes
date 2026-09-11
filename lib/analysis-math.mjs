// Deterministic explanations. These are labeled separately from AI editorials.
const number = (n) => n.toLocaleString('ko-KR', { maximumFractionDigits: 2 });
const signed = (n) => `${n > 0 ? '+' : ''}${number(n)}%`;
export function productChange(before, after) {
  if (![...before, ...after].every((n) => Number.isFinite(n) && n >= 0))
    return null;
  const b = before.reduce((a, v) => a * v, 1);
  const a = after.reduce((s, v) => s * v, 1);
  return { before: b, after: a, percent: b > 0 ? (a / b - 1) * 100 : null };
}
export function perCooldownChange(
  before,
  after,
  beforeCooldown,
  afterCooldown,
) {
  if (
    ![before, after, beforeCooldown, afterCooldown].every(
      (n) => Number.isFinite(n) && n > 0,
    )
  )
    return null;
  return (after / afterCooldown / (before / beforeCooldown) - 1) * 100;
}
const sameBasis = (c) =>
  c.direction !== 'review' &&
  !c.beforeContext &&
  !c.afterContext &&
  (c.beforeUnit ?? c.unit) === (c.afterUnit ?? c.unit);
export function numericNotes(skill) {
  const notes = [];
  const text = skill.lines.join(' ');
  const changes = skill.changes;
  const reviews = changes.filter((c) => c.direction === 'review');
  if (reviews.length)
    notes.push({
      kind: 'context',
      title: '비교 조건 확인',
      text:
        reviews[0].reason ||
        '단위·발동 조건을 확인하기 전에는 성능 변화율을 확정하지 않습니다.',
    });
  const damage = changes.find((c) => c.metric === '데미지' && sameBasis(c));
  const hits = changes.find((c) => c.metric === '공격 횟수' && sameBasis(c));
  if (damage && hits && damage.before > 0 && hits.before > 0) {
    const p = productChange(
      [damage.before, hits.before],
      [damage.after, hits.after],
    );
    notes.push({
      kind: 'calculation',
      title: '한 공격 단위의 표기계수',
      text: `${number(damage.before)} × ${number(hits.before)} = ${number(p.before)} → ${number(damage.after)} × ${number(hits.after)} = ${number(p.after)} (${signed(p.percent)}). 각 수치가 같은 공격 단위를 가리키고 모두 적중한다는 조건입니다. 발동 횟수·지속 시간·적중 상한을 포함한 총 피해나 DPS는 아닙니다.`,
    });
  } else {
    const stat = changes.find(
      (c) =>
        sameBasis(c) &&
        /크리티컬 데미지 증가량|최종 데미지 증가량|확률/.test(c.metric) &&
        c.unit === '%',
    );
    const c =
      stat || changes.find((c) => sameBasis(c) && /데미지/.test(c.metric));
    if (c) {
      const delta = c.after - c.before;
      const u = c.unit === '%' || c.unit === '%p' ? '%p' : c.unit;
      notes.push({
        kind: 'calculation',
        title: `${c.metric}의 변화`,
        text: `${number(c.before)}${c.beforeUnit ?? c.unit} → ${number(c.after)}${c.afterUnit ?? c.unit}, 차이는 ${delta > 0 ? '+' : ''}${number(delta)}${u}입니다. ${stat ? '스킬이 제공하는 능력치의 증가분이며 전체 피해의 증가율이 아닙니다.' : '동일한 공격·적중 조건의 표기계수 비교이며 직업 전체 성능의 변화율은 아닙니다.'}`,
      });
    }
  }
  const cd = changes.find(
    (c) =>
      /^(재사용 대기시간|재발동 대기시간)$/.test(c.metric) &&
      sameBasis(c) &&
      c.before > 0 &&
      c.after > 0,
  );
  if (
    cd &&
    !/키다운|충전|준비|스택|최대.*횟수|발동.*변경|사용 즉시|스킬로 변경|공식/.test(
      text,
    )
  ) {
    notes.push({
      kind: 'calculation',
      title: '같은 방식으로 반복 사용한다면',
      text: `쿨타임 ${number(cd.before)}초 → ${number(cd.after)}초에서는 장기 구간의 이론적 재사용 빈도가 ${signed((cd.before / cd.after - 1) * 100)} 변합니다. 매번 즉시 사용하고 시전 방식·충전·초기화 조건이 같다는 가정이며, 제한된 전투 시간의 사용 횟수나 피해 비율을 뜻하지 않습니다.`,
    });
  }
  /** @type {Array<[RegExp, string, string]>} */
  const contexts = [
    [
      /한\s*명의?\s*적.*(?:제한|최대)|최대.*(?:출격|출력).*횟수|최대.*발생.*횟수/,
      '적중·발생 상한',
      '공격 횟수 제한이나 최대 발생량이 바뀝니다. 계수와 공격 빈도를 지속 시간 전체에 곱하기 전에 실제 적중 상한부터 확인해야 합니다.',
    ],
    [
      /파티원.*삭제/,
      '파티와 개인 효과',
      '파티원에게 적용하던 효과가 삭제되는 항목입니다. 지원 기여 감소와 자신의 공격·버프 보정은 따로 평가해야 합니다.',
    ],
    [
      /일반 몬스터|사냥 맵|보스 맵을 제외/,
      '사용 상황 분리',
      '사냥과 보스의 적용 조건이 다릅니다. 일반 몬스터 보정이나 맵 제한을 다른 상황의 피해 계산에 그대로 적용하지 않습니다.',
    ],
    [
      /공식이 변경|공식이변경/,
      '적용식 변경',
      '계산식 변경이 명시되어 있습니다. 표시된 수치나 마스터 레벨의 변화만으로 실제 능력치 손익을 확정할 수 없습니다.',
    ],
    [
      /도트 데미지.*삭제/,
      '지속 피해 삭제',
      '직접 공격 외에 도트 피해가 삭제됩니다. 남은 공격의 계수만 비교하면 이전의 지속 피해 기여가 빠집니다.',
    ],
    [
      /시전 동작이 삭제|다른 스킬 사용 중.*사용할 수/,
      '이동·연계 운용',
      '사용 동작이나 다른 스킬과의 연계 조건이 달라집니다. 예외 스킬과 입력 조건을 확인해야 하며, 이동 편의 개선을 곧바로 피해 증가율로 계산하지 않습니다.',
    ],
  ];
  for (const [pattern, title, detail] of contexts)
    if (pattern.test(text))
      notes.push({ kind: 'context', title, text: detail });
  if (
    !notes.length &&
    skill.lines.every((line) =>
      /이펙트|효과음|스킬 아이콘|스킬 설명/.test(line),
    )
  )
    notes.push({
      kind: 'context',
      title: '표현 변경 중심',
      text: '이 항목에는 연출·설명 변경이 명시되어 있습니다. 이를 계수 상향·하향으로 환산할 근거는 없습니다.',
    });
  return notes.slice(0, 3);
}
