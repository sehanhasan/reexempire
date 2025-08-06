
import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

interface AdditionalInfoFormProps {
  terms: string;
  onTermsChange: (value: string) => void;
  requiresDeposit: boolean;
  onDepositToggle: (value: boolean) => void;
  depositPercentage: number;
  onDepositPercentageChange: (value: number) => void;
  depositAmount: number;
  onDepositAmountChange: (value: number) => void;
  subtotal: number;
}

export function AdditionalInfoForm({
  terms,
  onTermsChange,
  requiresDeposit,
  onDepositToggle,
  depositPercentage,
  onDepositPercentageChange,
  depositAmount,
  onDepositAmountChange,
  subtotal
}: AdditionalInfoFormProps) {
  const handleDepositPercentageChange = (value: number) => {
    onDepositPercentageChange(value);
    const newAmount = (subtotal * value) / 100;
    onDepositAmountChange(newAmount);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="terms">Terms & Conditions</Label>
        <Textarea
          id="terms"
          placeholder="Enter terms and conditions..."
          value={terms}
          onChange={(e) => onTermsChange(e.target.value)}
          className="min-h-[100px] mt-1"
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <Label htmlFor="deposit-toggle">Require Deposit Payment</Label>
          <p className="text-sm text-muted-foreground">
            Require a deposit payment before starting work
          </p>
        </div>
        <Switch
          id="deposit-toggle"
          checked={requiresDeposit}
          onCheckedChange={onDepositToggle}
        />
      </div>

      {requiresDeposit && (
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
          <div>
            <Label htmlFor="deposit-percentage">Deposit Percentage (%)</Label>
            <input
              id="deposit-percentage"
              type="number"
              min="0"
              max="100"
              value={depositPercentage}
              onChange={(e) => handleDepositPercentageChange(Number(e.target.value))}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
            />
          </div>
          <div>
            <Label htmlFor="deposit-amount">Amount (RM)</Label>
            <input
              id="deposit-amount"
              type="number"
              min="0"
              step="0.01"
              value={depositAmount.toFixed(2)}
              onChange={(e) => onDepositAmountChange(Number(e.target.value))}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
            />
          </div>
        </div>
      )}
    </div>
  );
}
