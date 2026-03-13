import LoanRate from '../models/LoanRate.js';

export const DEFAULT_LOAN_RATES = {
  personal: 8.5,
  home: 6.5,
  auto: 7.2,
  business: 9.5,
};

export const LOAN_TYPES = Object.keys(DEFAULT_LOAN_RATES);

function round2(value) {
  return Math.round(value * 100) / 100;
}

export async function ensureLoanRates() {
  await Promise.all(
    LOAN_TYPES.map((loanType) =>
      LoanRate.updateOne(
        { loanType },
        {
          $setOnInsert: {
            loanType,
            rate: DEFAULT_LOAN_RATES[loanType],
          },
        },
        { upsert: true }
      )
    )
  );
}

export async function getLoanRatesMap() {
  await ensureLoanRates();

  const docs = await LoanRate.find({ loanType: { $in: LOAN_TYPES } })
    .select('loanType rate')
    .lean();

  return LOAN_TYPES.reduce((acc, loanType) => {
    const fromDb = docs.find((item) => item.loanType === loanType);
    acc[loanType] = round2(fromDb?.rate ?? DEFAULT_LOAN_RATES[loanType]);
    return acc;
  }, {});
}

export function loanRateMapToList(rateMap) {
  return LOAN_TYPES.map((loanType) => ({
    loanType,
    rate: round2(Number(rateMap[loanType]) || 0),
  }));
}