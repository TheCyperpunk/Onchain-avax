import { formatSIPData } from "./format";
import type { SIPPlan } from "./types";

export const toDashboardSIPs = (plans: SIPPlan[]) => plans.map((sip, index) => {
  const formatted = formatSIPData(sip);
  return {
    id: sip.poolName || `sip-${index}`,
    tokenName: "AVAX",
    totalInvested: formatted?.totalAmount || "0",
    currentValue: formatted?.executedAmount || "0",
    progress: formatted?.progress || 0,
    nextExecution: formatted?.nextExecution?.toLocaleDateString() || "N/A",
    status: sip.active ? "active" : "completed",
  };
});

export const toManageSIPs = (plans: SIPPlan[]) => plans.map((sip, index) => {
  const formatted = formatSIPData(sip);
  const totalAmt = Number(sip.totalAmount);
  const executedAmt = Number(sip.executedAmount);
  const perInterval = Number(sip.amountPerInterval);
  const installmentsDone = perInterval > 0 ? Math.floor(executedAmt / perInterval) : 0;
  const totalInstallments = perInterval > 0 ? Math.floor(totalAmt / perInterval) : 0;
  const frequencyDays = Number(sip.frequency) / 86400;
  const frequencyLabel = frequencyDays >= 365 ? "Yearly" : frequencyDays >= 90 ? "Quarterly" : frequencyDays >= 28 ? "Monthly" : frequencyDays >= 7 ? "Weekly" : frequencyDays >= 1 ? "Daily" : "Custom";

  return {
    id: sip.poolName || `sip-${index}`,
    tokenName: "AVAX",
    totalAmount: formatted?.totalAmount || "0",
    executedAmount: formatted?.executedAmount || "0",
    remainingAmount: formatted?.remainingAmount || "0",
    amountPerInterval: formatted?.amountPerInterval || "0",
    installmentsDone,
    totalInstallments,
    remainingInstallments: totalInstallments - installmentsDone,
    frequencyLabel,
    progress: formatted?.progress || 0,
    nextExecution: formatted?.nextExecution?.toLocaleDateString() || "N/A",
    maturityDate: formatted?.maturity?.toLocaleDateString() || "N/A",
    active: sip.active,
    canExecute: formatted?.canExecute || false,
    canFinalize: formatted?.canFinalize || false,
  };
});
