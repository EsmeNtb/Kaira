import type { Transaction } from "@/lib/types/finance";

export const mockTransactions: Transaction[] = [
  {
    id: "1",
    merchant: "NOMINA",
    amount: 16000,
    date: "2026-05-01",
    type: "income",
  },

  {
    id: "2",
    merchant: "SPOTIFY",
    amount: 129,
    date: "2026-05-14",
    type: "expense",
    category: "Entertainment",
  },

  {
    id: "3",
    merchant: "NETFLIX",
    amount: 219,
    date: "2026-05-18",
    type: "expense",
    category: "Entertainment",
  },

  {
    id: "4",
    merchant: "TELCEL",
    amount: 599,
    date: "2026-05-24",
    type: "expense",
    category: "Utilities",
  },

  {
    id: "5",
    merchant: "SPOTIFY",
    amount: 129,
    date: "2026-06-14",
    type: "expense",
    category: "Entertainment",
  },

  {
    id: "6",
    merchant: "NETFLIX.COM",
    amount: 219,
    date: "2026-06-19",
    type: "expense",
    category: "Entertainment",
  },

  {
    id: "7",
    merchant: "TELCEL MX",
    amount: 605,
    date: "2026-06-24",
    type: "expense",
    category: "Utilities",
  },

  {
    id: "8",
    merchant: "SPOTIFY MEXICO",
    amount: 129,
    date: "2026-07-14",
    type: "expense",
    category: "Entertainment",
  },

  {
    id: "9",
    merchant: "NETFLIX",
    amount: 219,
    date: "2026-07-18",
    type: "expense",
    category: "Entertainment",
  },

  {
    id: "10",
    merchant: "TELCEL",
    amount: 599,
    date: "2026-07-25",
    type: "expense",
    category: "Utilities",
  },

  {
    id: "11",
    merchant: "SPOTIFY",
    amount: 129,
    date: "2026-08-14",
    type: "expense",
    category: "Entertainment",
  },

  {
    id: "12",
    merchant: "NETFLIX",
    amount: 219,
    date: "2026-08-18",
    type: "expense",
    category: "Entertainment",
  },
];