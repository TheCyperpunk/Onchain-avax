export interface SIPPlan {
  token: string;
  totalAmount: bigint;
  amountPerInterval: bigint;
  frequency: bigint;
  nextExecution: bigint;
  maturity: bigint;
  destAddress: string;
  executedAmount: bigint;
  active: boolean;
  poolName: string;
}

export interface SIPEvent {
  user: string;
  pool: string;
  total: bigint;
  intervalAmount: bigint;
  blockNumber: bigint;
  transactionHash: string;
}
