'use client';

import { useState } from 'react';
import { Landmark, Plus, Trash2, Save, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { orgService, type BankAccount } from '@/lib/org.service';
import { bankAccountSchema } from '../_schema';
import { SectionCard } from './SectionCard';
import * as z from 'zod';

type BankAccountFormValues = z.infer<typeof bankAccountSchema>;

function BankAccountRow({
  account,
  onRemoveEmpty,
}: {
  account?: BankAccount;
  onRemoveEmpty?: () => void;
}) {
  const queryClient = useQueryClient();
  const isNew = !account;

  const form = useForm<BankAccountFormValues>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: {
      bank_name: account?.bank_name ?? '',
      iban: account?.iban ?? '',
      account_holder_name: account?.account_holder_name ?? '',
      currency: account?.currency ?? 'USD',
      is_default: account?.is_default ?? false,
    },
  });

  const saveMutation = useMutation({
    mutationFn: (data: BankAccountFormValues) => {
      if (isNew) {
        return orgService.createBankAccount(data);
      }
      return orgService.updateBankAccount(account.id, data);
    },
    onSuccess: () => {
      toast.success(isNew ? 'Bank account added' : 'Bank account updated');
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      if (isNew && onRemoveEmpty) onRemoveEmpty(); // remove the temporary empty row
    },
    onError: () => toast.error('Failed to save bank account'),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (isNew) return Promise.resolve({ data: undefined } as any);
      return orgService.deleteBankAccount(account.id);
    },
    onSuccess: () => {
      if (!isNew) toast.success('Bank account removed');
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
    },
    onError: () => toast.error('Failed to remove bank account'),
  });

  const onSubmit = (data: BankAccountFormValues) => {
    saveMutation.mutate(data);
  };

  const isSaving = saveMutation.isPending;
  const isDeleting = deleteMutation.isPending;

  return (
    <Card className="group bg-surface-container-low/50 border-outline-variant/20 rounded-lg">
      <CardContent className="p-5">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="bank_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Chase Manhattan" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="account_holder_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Holder</FormLabel>
                      <FormControl>
                        <Input placeholder="Kinetic Monolith Systems Corp." {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="iban"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>IBAN / Account Number</FormLabel>
                    <FormControl>
                      <Input placeholder="US00 2938 1203 9948 2210" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <FormControl>
                      <Input placeholder="USD" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center justify-between mt-2">
              <FormField
                control={form.control}
                name="is_default"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="font-medium">Mark as Primary Account</FormLabel>
                  </FormItem>
                )}
              />

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={`transition-opacity ${!isNew ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'} text-error/60 hover:text-error`}
                  disabled={isSaving || isDeleting}
                  onClick={() => {
                    if (isNew && onRemoveEmpty) onRemoveEmpty();
                    else deleteMutation.mutate();
                  }}
                >
                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>

                <Button
                  type="submit"
                  size="sm"
                  disabled={isSaving || isDeleting || !form.formState.isDirty}
                  className={`transition-opacity ${!form.formState.isDirty && !isNew ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'} bg-primary/20 text-primary hover:bg-primary/30`}
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Save
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export function BankAccountsSection() {
  const [showNewRow, setShowNewRow] = useState(false);

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['bank-accounts'],
    queryFn: async () => {
      const res = await orgService.getBankAccounts();
      return (res as any).data ?? res;
    },
  });

  return (
    <SectionCard title="Bank Accounts" icon={Landmark} className="lg:col-span-7">
      <div className="mb-6 flex justify-end">
        <Button
          type="button"
          variant="outline"
          className="border-primary/30 text-primary hover:bg-primary/10"
          onClick={() => setShowNewRow(true)}
          disabled={showNewRow}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Account
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-4">
          {accounts.map((account: BankAccount) => (
            <BankAccountRow key={account.id} account={account} />
          ))}
          {showNewRow && <BankAccountRow onRemoveEmpty={() => setShowNewRow(false)} />}
        </div>
      )}
    </SectionCard>
  );
}
