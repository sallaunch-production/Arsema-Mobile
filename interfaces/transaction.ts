export interface ITransaction {
  id: string;
  type: 'send' | 'receive';
  amount: number;
  currency: string;
  recipient: string;
  bank: string;
  accountNumber: string;
  status: 'pending' | 'completed' | 'failed';
  date: string;
}

export interface ITransferRequest {
  amount: number;
  currency: string;
  recipient: string;
  bank: string;
  accountNumber: string;
}
