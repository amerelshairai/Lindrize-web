/**
 * The "what it could free up" estimate in Design your agent (SPEC 4.1).
 * It is always a range, built only from the visitor's own answers and the owner's stated
 * assumptions, and it describes staff time freed up, never staff replaced.
 */
export interface Range {
  low: number;
  high: number;
}
export interface Assumptions {
  /** Share of customer messages the assistant can answer by itself (0 to 1). */
  routineShare: number;
  /** Minutes a staff member spends on one routine reply. */
  minutesPerReply: number;
  /** Working hours in a month for one staff member. */
  workHoursPerMonth: number;
}
export interface EstimateInput {
  messagesPerDay: Range;
  staff: Range;
  /** Monthly salary per staff member, in US dollars. */
  salaryUsd?: Range | undefined;
}
export interface Estimate {
  hoursPerWeek: Range;
  /** Value of that time per month in US dollars, when a salary range was given. */
  costPerMonthUsd?: Range;
}

const WEEKS_PER_MONTH = 52 / 12;

export function estimate(input: EstimateInput, a: Assumptions): Estimate {
  const hours = (messages: number, staff: number): number => {
    const routine = (messages * 7 * a.routineShare * a.minutesPerReply) / 60;
    // The time freed can never be more than the time those people work.
    const available = (staff * a.workHoursPerMonth) / WEEKS_PER_MONTH;
    return Math.min(routine, available);
  };
  const hoursPerWeek = {
    low: hours(input.messagesPerDay.low, input.staff.low),
    high: hours(input.messagesPerDay.high, input.staff.high),
  };
  const result: Estimate = { hoursPerWeek };
  if (input.salaryUsd) {
    const cost = (h: number, salary: number): number => h * WEEKS_PER_MONTH * (salary / a.workHoursPerMonth);
    result.costPerMonthUsd = {
      low: cost(hoursPerWeek.low, input.salaryUsd.low),
      high: cost(hoursPerWeek.high, input.salaryUsd.high),
    };
  }
  return result;
}

/** Round to a clean number for display: 2 significant figures, never below 1. */
export function roundNice(value: number): number {
  if (value < 1) return value > 0 ? 1 : 0;
  const magnitude = 10 ** (Math.floor(Math.log10(value)) - 1);
  return Math.round(value / magnitude) * magnitude;
}

export const isComplete = (a: {
  routineShare: number | null;
  minutesPerReply: number | null;
  workHoursPerMonth: number | null;
}): a is Assumptions => a.routineShare !== null && a.minutesPerReply !== null && a.workHoursPerMonth !== null;
