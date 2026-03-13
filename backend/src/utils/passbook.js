function transactionMatchesQuery(transaction, q) {
  if (!q) {
    return true;
  }

  const safeQ = String(q).trim();
  if (!safeQ) {
    return true;
  }

  const escaped = safeQ.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escaped, 'i');
  return [transaction.name, transaction.category, transaction.note, transaction.recipient].some((value) =>
    regex.test(value || '')
  );
}

function buildPassbookEntriesFromTransactions(transactions, currentBalance) {
  let runningClosingBalance = Number(currentBalance || 0);

  return transactions.map((transaction) => {
    const amount = Number(transaction.amount || 0);
    const openingBalance =
      transaction.type === 'credit'
        ? runningClosingBalance - amount
        : runningClosingBalance + amount;

    const entry = {
      ...transaction,
      openingBalance,
      closingBalance: runningClosingBalance,
    };

    runningClosingBalance = openingBalance;
    return entry;
  });
}

export { transactionMatchesQuery, buildPassbookEntriesFromTransactions };
