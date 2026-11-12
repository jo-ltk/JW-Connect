import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  DutyCandidate,
  DutyHistoryType,
  DutySlot,
  DutyType,
} from '../src/definition/duties';
import {
  DutyMeetingInfo,
  dutyReconcileHistory,
  dutyValidateSlots,
  generateDutyRoster,
} from '../src/services/app/duty_engine';

const NOW = '2026-11-12T00:00:00.000Z';

const duty = (
  uid: string,
  eligible: string[],
  extra: Partial<DutyType['duty_data']> = {}
): DutyType => ({
  duty_uid: uid,
  duty_data: {
    _deleted: false,
    updatedAt: NOW,
    name: uid,
    meeting: 'both',
    required: 1,
    eligible,
    active: true,
    sort_index: 0,
    ...extra,
  },
});

const person = (
  uid: string,
  away: string[] = [],
  inactive = false
): DutyCandidate => ({
  person_uid: uid,
  name: uid,
  inactive,
  isAwayOn: (date) => away.includes(date),
});

const meetingsOf = (weekOf: string): DutyMeetingInfo[] => {
  const [y, m, d] = weekOf.split('/').map(Number);
  const fmt = (offset: number) => {
    const date = new Date(y, m - 1, d + offset);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}/${mm}/${dd}`;
  };
  return [
    { meeting: 'midweek', meeting_date: fmt(2) },
    { meeting: 'weekend', meeting_date: fmt(6) },
  ];
};

const addWeeks = (weekOf: string, n: number) => {
  const [y, m, d] = weekOf.split('/').map(Number);
  const date = new Date(y, m - 1, d + n * 7);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}/${mm}/${dd}`;
};

let idCounter = 0;
const makeId = () => `h${++idCounter}`;

/** Generates `count` weeks in order, recording history as the app does. */
const simulateWeeks = (
  startWeek: string,
  count: number,
  duties: DutyType[],
  candidates: DutyCandidate[]
) => {
  let history: DutyHistoryType[] = [];
  const rosters: { weekOf: string; slots: DutySlot[] }[] = [];

  for (let i = 0; i < count; i++) {
    const weekOf = addWeeks(startWeek, i);
    const meetings = meetingsOf(weekOf);
    const result = generateDutyRoster({
      weekOf,
      meetings,
      duties,
      existingSlots: [],
      history,
      candidates,
      now: NOW,
    });

    const changes = dutyReconcileHistory({
      weekOf,
      slots: result.slots,
      history,
      duties,
      meetings,
      now: NOW,
      makeId,
    });
    history = mergeHistory(history, changes);
    rosters.push({ weekOf, slots: result.slots });
  }

  return { history, rosters };
};

const mergeHistory = (
  history: DutyHistoryType[],
  changes: DutyHistoryType[]
) => {
  const byId = new Map(history.map((record) => [record.id, record]));
  for (const change of changes) byId.set(change.id, change);
  return [...byId.values()];
};

const STANDARD = (people: string[]) => [
  duty('sound', people, { sort_index: 0 }),
  duty('stage', people, { sort_index: 1 }),
  duty('mic1', people, { sort_index: 2 }),
  duty('mic2', people, { sort_index: 3 }),
];

const PEOPLE = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10'];
const WEEK = '2026/11/09';

test('generates a complete weekly roster', () => {
  const result = generateDutyRoster({
    weekOf: WEEK,
    meetings: meetingsOf(WEEK),
    duties: STANDARD(PEOPLE),
    existingSlots: [],
    history: [],
    candidates: PEOPLE.map((uid) => person(uid)),
    now: NOW,
  });

  assert.equal(result.slots.length, 8); // 4 duties × 2 meetings
  assert.ok(result.slots.every((slot) => slot.person_uid));
  assert.ok(result.slots.every((slot) => slot.source === 'auto'));
  assert.equal(result.shortages.length, 0);
  assert.equal(result.warnings.length, 0);
});

test('never puts one person in two positions of the same meeting', () => {
  const people = ['a', 'b', 'c', 'd'];
  const result = generateDutyRoster({
    weekOf: WEEK,
    meetings: meetingsOf(WEEK),
    duties: STANDARD(people),
    existingSlots: [],
    history: [],
    candidates: people.map((uid) => person(uid)),
    now: NOW,
  });

  for (const meeting of ['midweek', 'weekend']) {
    const assigned = result.slots
      .filter((slot) => slot.meeting === meeting)
      .map((slot) => slot.person_uid);
    assert.equal(new Set(assigned).size, assigned.length);
    assert.equal(assigned.length, 4);
  }
});

test('only assigns eligible people', () => {
  const duties = [
    duty('sound', ['s1', 's2'], { sort_index: 0 }),
    duty('stage', ['t1'], { sort_index: 1 }),
  ];
  const result = generateDutyRoster({
    weekOf: WEEK,
    meetings: meetingsOf(WEEK),
    duties,
    existingSlots: [],
    history: [],
    candidates: ['s1', 's2', 't1', 'x'].map((uid) => person(uid)),
    now: NOW,
  });

  for (const slot of result.slots) {
    const d = duties.find((item) => item.duty_uid === slot.duty_uid)!;
    assert.ok(d.duty_data.eligible.includes(slot.person_uid));
  }
});

test('excludes people who are away or inactive', () => {
  const meetings = meetingsOf(WEEK);
  const midweekDate = meetings[0].meeting_date;
  const result = generateDutyRoster({
    weekOf: WEEK,
    meetings,
    duties: [duty('sound', ['away', 'gone', 'here'], { meeting: 'midweek' })],
    existingSlots: [],
    history: [],
    candidates: [
      person('away', [midweekDate]),
      person('gone', [], true),
      person('here'),
    ],
    now: NOW,
  });

  assert.equal(result.slots[0].person_uid, 'here');
});

test('reports shortages with the reason instead of assigning anyone', () => {
  const meetings = meetingsOf(WEEK);
  const midweekDate = meetings[0].meeting_date;
  const result = generateDutyRoster({
    weekOf: WEEK,
    meetings: [meetings[0]],
    duties: [
      duty('nobody', [], { sort_index: 0 }),
      duty('away', ['a'], { sort_index: 1 }),
      duty('pair', ['b', 'c'], { sort_index: 2, required: 3 }),
    ],
    existingSlots: [],
    history: [],
    candidates: [person('a', [midweekDate]), person('b'), person('c')],
    now: NOW,
  });

  const reasons = Object.fromEntries(
    result.shortages.map((s) => [s.slot_id, s.reason])
  );

  assert.equal(reasons['midweek:nobody:0'], 'no_eligible');
  assert.equal(reasons['midweek:away:0'], 'all_unavailable');
  assert.equal(result.shortages.filter((s) => s.duty_uid === 'pair').length, 1);
  assert.equal(
    result.shortages.find((s) => s.duty_uid === 'pair')!.reason,
    'all_busy'
  );
  // the unfilled slots stay empty: nobody is forced in
  assert.equal(
    result.slots.filter((slot) => !slot.person_uid).length,
    result.shortages.length
  );
});

test('regenerating keeps locked and manual assignments exactly', () => {
  const duties = STANDARD(PEOPLE);
  const meetings = meetingsOf(WEEK);
  const first = generateDutyRoster({
    weekOf: WEEK,
    meetings,
    duties,
    existingSlots: [],
    history: [],
    candidates: PEOPLE.map((uid) => person(uid)),
    now: NOW,
  });

  const slots = first.slots.map((slot) => ({ ...slot }));
  const locked = slots.find((slot) => slot.id === 'midweek:sound:0')!;
  locked.locked = true;
  const manual = slots.find((slot) => slot.id === 'weekend:stage:0')!;
  manual.person_uid = 'p10';
  manual.source = 'manual';
  const lockedEmpty = slots.find((slot) => slot.id === 'weekend:mic2:0')!;
  lockedEmpty.person_uid = '';
  lockedEmpty.locked = true;

  // regenerate with a different history so unlocked slots would change
  const fakeHistory: DutyHistoryType[] = PEOPLE.slice(0, 5).map((uid, i) => ({
    id: `x${i}`,
    slot_id: 'midweek:mic1:0',
    weekOf: '2026/11/02',
    meeting: 'midweek',
    meeting_date: '2026/11/04',
    duty_uid: 'mic1',
    duty_name: 'mic1',
    person_uid: uid,
    source: 'auto',
    status: 'active',
    created_at: NOW,
  }));

  const second = generateDutyRoster({
    weekOf: WEEK,
    meetings,
    duties,
    existingSlots: slots,
    history: fakeHistory,
    candidates: PEOPLE.map((uid) => person(uid)),
    now: NOW,
  });

  const get = (id: string) => second.slots.find((slot) => slot.id === id)!;
  assert.equal(get('midweek:sound:0').person_uid, locked.person_uid);
  assert.equal(get('midweek:sound:0').locked, true);
  assert.equal(get('weekend:stage:0').person_uid, 'p10');
  assert.equal(get('weekend:stage:0').source, 'manual');
  assert.equal(get('weekend:mic2:0').person_uid, '');
  // pinned people are not reused elsewhere in the same meeting
  const weekend = second.slots
    .filter((slot) => slot.meeting === 'weekend' && slot.person_uid)
    .map((slot) => slot.person_uid);
  assert.equal(new Set(weekend).size, weekend.length);
});

test('warns about a pinned person who became unavailable, never hides it', () => {
  const meetings = meetingsOf(WEEK);
  const slot: DutySlot = {
    id: 'midweek:sound:0',
    meeting: 'midweek',
    duty_uid: 'sound',
    index: 0,
    person_uid: 'a',
    source: 'manual',
    locked: true,
    updatedAt: NOW,
  };
  const result = generateDutyRoster({
    weekOf: WEEK,
    meetings: [meetings[0]],
    duties: [duty('sound', ['b'])],
    existingSlots: [slot],
    history: [],
    candidates: [person('a', [meetings[0].meeting_date]), person('b')],
    now: NOW,
  });

  const reasons = result.warnings.map((w) => w.reason).sort();
  assert.deepEqual(reasons, ['away', 'not_eligible']);
  assert.equal(result.slots[0].person_uid, 'a');
});

test('rotates fairly across many weeks', () => {
  const people = ['a', 'b', 'c', 'd', 'e', 'f'];
  const duties = [duty('sound', people, { meeting: 'midweek' })];
  const { rosters } = simulateWeeks(
    WEEK,
    12,
    duties,
    people.map((uid) => person(uid))
  );

  const order = rosters.map((week) => week.slots[0].person_uid);

  // every person takes a turn before anyone repeats
  assert.equal(new Set(order.slice(0, 6)).size, 6);
  assert.equal(new Set(order.slice(6, 12)).size, 6);

  const counts = people.map((uid) => order.filter((p) => p === uid).length);
  assert.deepEqual(counts, [2, 2, 2, 2, 2, 2]);
});

test('balances total duties when pools overlap', () => {
  const duties = STANDARD(PEOPLE);
  const { history } = simulateWeeks(
    WEEK,
    10,
    duties,
    PEOPLE.map((uid) => person(uid))
  );

  const active = history.filter((record) => record.status === 'active');
  assert.equal(active.length, 80); // 10 weeks × 8 slots

  const counts = PEOPLE.map(
    (uid) => active.filter((record) => record.person_uid === uid).length
  );
  // 80 duties over 10 people: everyone gets 8, give or take one
  assert.ok(Math.max(...counts) - Math.min(...counts) <= 1, String(counts));
});

test('does not repeat the same person when others are available', () => {
  const people = ['a', 'b', 'c'];
  const duties = [duty('sound', people, { meeting: 'midweek' })];
  const { rosters } = simulateWeeks(
    WEEK,
    9,
    duties,
    people.map((uid) => person(uid))
  );

  const order = rosters.map((week) => week.slots[0].person_uid);
  for (let i = 1; i < order.length; i++) {
    assert.notEqual(order[i], order[i - 1]);
  }
});

test('history keeps old records when assignments are edited', () => {
  const duties = [duty('sound', ['a', 'b'], { meeting: 'midweek' })];
  const meetings = [meetingsOf(WEEK)[0]];
  let history: DutyHistoryType[] = [];

  const slot: DutySlot = {
    id: 'midweek:sound:0',
    meeting: 'midweek',
    duty_uid: 'sound',
    index: 0,
    person_uid: 'a',
    source: 'auto',
    locked: false,
    updatedAt: NOW,
  };

  const apply = (slots: DutySlot[]) => {
    const changes = dutyReconcileHistory({
      weekOf: WEEK,
      slots,
      history,
      duties,
      meetings,
      now: NOW,
      makeId,
    });
    history = mergeHistory(history, changes);
    return changes;
  };

  apply([slot]);
  // same person, no change: nothing written
  assert.equal(apply([slot]).length, 0);
  // replace a → b manually
  apply([{ ...slot, person_uid: 'b', source: 'manual' }]);
  // remove
  apply([{ ...slot, person_uid: '', source: 'manual' }]);

  assert.equal(history.length, 2);
  const a = history.find((record) => record.person_uid === 'a')!;
  const b = history.find((record) => record.person_uid === 'b')!;
  assert.equal(a.status, 'replaced');
  assert.equal(a.source, 'auto');
  assert.equal(b.status, 'removed');
  assert.equal(b.source, 'manual');
  assert.equal(b.meeting_date, meetings[0].meeting_date);
  assert.equal(b.duty_name, 'sound');
  assert.equal(
    history.filter((record) => record.status === 'active').length,
    0
  );
});

test('edited history feeds the next week correctly', () => {
  const people = ['a', 'b', 'c'];
  const duties = [duty('sound', people, { meeting: 'midweek' })];
  const meetings = [meetingsOf(WEEK)[0]];

  const first = generateDutyRoster({
    weekOf: WEEK,
    meetings,
    duties,
    existingSlots: [],
    history: [],
    candidates: people.map((uid) => person(uid)),
    now: NOW,
  });
  let history = mergeHistory(
    [],
    dutyReconcileHistory({
      weekOf: WEEK,
      slots: first.slots,
      history: [],
      duties,
      meetings,
      now: NOW,
      makeId,
    })
  );

  // user changes the assignment to someone else
  const auto = first.slots[0].person_uid;
  const manual = people.find((uid) => uid !== auto)!;
  history = mergeHistory(
    history,
    dutyReconcileHistory({
      weekOf: WEEK,
      slots: [{ ...first.slots[0], person_uid: manual, source: 'manual' }],
      history,
      duties,
      meetings,
      now: NOW,
      makeId,
    })
  );

  const nextWeek = addWeeks(WEEK, 1);
  const second = generateDutyRoster({
    weekOf: nextWeek,
    meetings: [meetingsOf(nextWeek)[0]],
    duties,
    existingSlots: [],
    history,
    candidates: people.map((uid) => person(uid)),
    now: NOW,
  });

  // the person who actually served last week is not chosen again
  assert.notEqual(second.slots[0].person_uid, manual);
});

test('validation flags manual double-booking', () => {
  const meetings = meetingsOf(WEEK);
  const slots: DutySlot[] = ['sound', 'stage'].map((uid) => ({
    id: `midweek:${uid}:0`,
    meeting: 'midweek',
    duty_uid: uid,
    index: 0,
    person_uid: 'a',
    source: 'manual',
    locked: false,
    updatedAt: NOW,
  }));

  const warnings = dutyValidateSlots({
    slots,
    duties: [duty('sound', ['a']), duty('stage', ['a'])],
    meetings,
    candidates: [person('a')],
  });

  assert.equal(warnings.filter((w) => w.reason === 'double_booked').length, 2);
});
