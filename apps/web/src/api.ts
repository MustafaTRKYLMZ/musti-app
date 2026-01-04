import {
    fetchTransactions as coreFetchTransactions,
    createTransaction as coreCreateTransaction,
    updateTransaction as coreUpdateTransaction,
    deleteTransactionApi as coreDeleteTransaction,
    type ApiConfig,
    type Transaction,
  } from "@musti/core";
  
  const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";
  
  const config: ApiConfig = {
    baseUrl: API_URL,
  };
  
  export async function fetchTransactions() {
    return coreFetchTransactions(config);
  }
  
  export async function createTransaction(tx: Transaction) {
    return coreCreateTransaction(config, tx);
  }
  
  export async function updateTransaction(tx: Transaction) {
    return coreUpdateTransaction(config, tx);
  }
  
  export async function deleteTransaction(id: Transaction["id"]) {
    return coreDeleteTransaction(config, id);
  }
  