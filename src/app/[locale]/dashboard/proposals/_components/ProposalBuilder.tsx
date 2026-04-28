'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { bankAccountsControllerFindAllV1 } from '@/api-generated/endpoints/bank-accounts';
import {
  getProposalsControllerFindAllV1QueryKey,
  useProposalsControllerCreateV1 as useProposalsControllerCreate,
} from '@/api-generated/endpoints/proposals';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SharedSearchableSelectField } from '@/components/ui/form-controls/SharedSearchableSelectField';
import { SharedSelectField } from '@/components/ui/form-controls/SharedSelectField';
import { Textarea } from '@/components/ui/textarea';
import { productService } from '@/lib/api/products';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import { useProposalStore } from '@/store/useProposalStore';
import type { Product } from '@/types/products-generated';

import { ProposalSuccessModal } from './ProposalSuccessModal';

const currencyOptions = ['USD', 'TRY', 'EUR', 'GBP'] as const;

type CurrencyCode = (typeof currencyOptions)[number];

type SelectedAddon = {
  name: string;
  price: number;
};

type BankAccountOption = {
  id: string;
  bank_name: string;
  iban: string;
  currency: string;
  is_default: boolean;
};

const selectedAddonSchema = z.object({
  name: z.string(),
  price: z.number(),
});

const lineItemSchema = z.object({
  product_id: z.string().min(1),
  product_title: z.string().min(1),
  product_type: z.string().min(1),
  quantity: z.number().min(1),
  unit_price: z.number().min(0),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  product_instance_id: z.string().optional(),
  selected_addons: z.array(selectedAddonSchema),
});

const proposalBuilderSchema = z.object({
  selected_product_id: z.string(),
  line_items: z.array(lineItemSchema),
  bank_account_id: z.string().min(1, 'Please select a bank account'),
  client_notes: z.string(),
  currency: z.enum(currencyOptions),
  total_amount: z.number(),
});

export type ProposalBuilderValues = z.infer<typeof proposalBuilderSchema>;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function toNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function isCurrencyCode(value: unknown): value is CurrencyCode {
  return (
    typeof value === 'string' &&
    (currencyOptions as readonly string[]).includes(value)
  );
}

function normalizeBankAccounts(raw: unknown): BankAccountOption[] {
  const source = Array.isArray(raw)
    ? raw
    : Array.isArray(asRecord(raw).data)
      ? (asRecord(raw).data as unknown[])
      : [];

  return source.map((item) => {
    const record = asRecord(item);

    return {
      id: asString(record.id),
      bank_name: asString(record.bank_name),
      iban: asString(record.iban),
      currency: asString(record.currency),
      is_default: asBoolean(record.is_default),
    };
  });
}

function calculateLineItemTotal(
  item: ProposalBuilderValues['line_items'][number]
): number {
  const basePrice = toNumber(item.unit_price);
  const quantity = Math.max(1, toNumber(item.quantity));
  const addonsTotal = (item.selected_addons ?? []).reduce(
    (sum, addon) => sum + toNumber(addon.price),
    0
  );

  return (basePrice + addonsTotal) * quantity;
}

function DatePickerInput({
  value,
  onChange,
  disabled,
}: {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <Input
      type="date"
      value={value ?? ''}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
    />
  );
}

export function ProposalBuilder() {
  const queryClient = useQueryClient();
  const activeOrganizationId = useAuthStore(
    (state) => state.activeOrganizationId
  );
  const createdById = useAuthStore((state) => state.user?.id ?? null);
  const activeLead = useProposalStore((state) => state.activeLead);
  const [successHash, setSuccessHash] = useState('');
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  const defaultCurrency: CurrencyCode = isCurrencyCode(activeLead?.currency)
    ? activeLead.currency
    : 'USD';

  const leadName = activeLead
    ? `${activeLead.first_name} ${activeLead.last_name}`.trim()
    : '';
  const clientPhone = activeLead?.phone_number ?? '';

  const { mutateAsync: createProposal, isPending: isCreatingProposal } =
    useProposalsControllerCreate();

  const form = useForm<ProposalBuilderValues>({
    resolver: zodResolver(proposalBuilderSchema),
    defaultValues: {
      selected_product_id: '',
      line_items: [],
      bank_account_id: '',
      client_notes: '',
      currency: defaultCurrency,
      total_amount: 0,
    },
    mode: 'onChange',
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: 'line_items',
  });

  const { data: productsData, isLoading: isProductsLoading } = useQuery({
    queryKey: ['proposal-builder', 'products', activeOrganizationId],
    queryFn: async () => {
      if (!activeOrganizationId) {
        return [] as Product[];
      }

      const response = await productService.getAll(activeOrganizationId, {
        page: 1,
        limit: 100,
      });

      return response.data;
    },
    enabled: Boolean(activeOrganizationId),
    staleTime: 60_000,
  });

  const { data: bankAccountsData, isLoading: isBankAccountsLoading } = useQuery(
    {
      queryKey: ['proposal-builder', 'bank-accounts', activeOrganizationId],
      queryFn: async () => {
        const response = await bankAccountsControllerFindAllV1();
        return normalizeBankAccounts(response);
      },
      enabled: Boolean(activeOrganizationId),
      staleTime: 60_000,
    }
  );

  const products = productsData ?? [];
  const bankAccounts = bankAccountsData ?? [];

  const bankAccountOptions = useMemo(
    () =>
      bankAccounts.map((account) => ({
        value: account.id,
        label: `${account.bank_name} • ${account.currency} • ${account.iban.slice(-6)}`,
      })),
    [bankAccounts]
  );

  const productOptions = useMemo(
    () =>
      products.map((product) => ({
        value: product.id,
        label: `${product.title} (${product.currency} ${toNumber(product.base_price).toFixed(2)})`,
      })),
    [products]
  );

  const productsById = useMemo(() => {
    return new Map(products.map((product) => [product.id, product]));
  }, [products]);

  const selectedProductId = useWatch({
    control: form.control,
    name: 'selected_product_id',
  });

  const watchedLineItems =
    useWatch({
      control: form.control,
      name: 'line_items',
    }) ?? [];

  const totalAmount = useMemo(() => {
    return watchedLineItems.reduce(
      (sum, item) => sum + calculateLineItemTotal(item),
      0
    );
  }, [watchedLineItems]);

  useEffect(() => {
    form.setValue('total_amount', Number(totalAmount.toFixed(2)), {
      shouldDirty: false,
      shouldValidate: false,
    });
  }, [form, totalAmount]);

  useEffect(() => {
    const leadCurrency = activeLead?.currency;
    if (!isCurrencyCode(leadCurrency)) {
      return;
    }

    if (form.getValues('currency') === leadCurrency) {
      return;
    }

    form.setValue('currency', leadCurrency, {
      shouldDirty: false,
      shouldValidate: false,
    });
  }, [activeLead?.currency, form]);

  useEffect(() => {
    if (!selectedProductId) {
      return;
    }

    const product = productsById.get(selectedProductId);
    if (!product) {
      return;
    }

    append({
      product_id: product.id,
      product_title: product.title,
      product_type: product.type,
      quantity: 1,
      unit_price: toNumber(product.base_price),
      start_date: '',
      end_date: '',
      product_instance_id: '',
      selected_addons: [],
    });

    form.setValue('selected_product_id', '');
  }, [append, form, productsById, selectedProductId]);

  useEffect(() => {
    if (form.getValues('bank_account_id')) {
      return;
    }

    const defaultAccount =
      bankAccounts.find((account) => account.is_default) ?? bankAccounts[0];
    if (!defaultAccount) {
      return;
    }

    form.setValue('bank_account_id', defaultAccount.id, { shouldDirty: false });
  }, [bankAccounts, form]);

  const handleAddonToggle = (
    lineIndex: number,
    addon: SelectedAddon,
    checked: boolean
  ) => {
    const current = form.getValues(`line_items.${lineIndex}`);
    if (!current) {
      return;
    }

    const currentAddons = current.selected_addons ?? [];
    const nextAddons = checked
      ? [...currentAddons, addon]
      : currentAddons.filter((item) => item.name !== addon.name);

    update(lineIndex, {
      ...current,
      selected_addons: nextAddons,
    });
  };

  const getPublicLinkHash = (value: unknown): string => {
    const record = asRecord(value);
    const directHash = asString(record.public_link_hash);
    if (directHash) {
      return directHash;
    }

    const dataHash = asString(asRecord(record.data).public_link_hash);
    if (dataHash) {
      return dataHash;
    }

    return '';
  };

  const submitHandler = async (values: ProposalBuilderValues) => {
    if (!activeOrganizationId) {
      toast.error('Please select an organization first.');
      return;
    }

    if (!activeLead?.id) {
      toast.error('A lead is required to create a proposal.');
      return;
    }

    if (!createdById) {
      toast.error(
        'Unable to detect the current user. Please refresh and try again.'
      );
      return;
    }

    const mappedLineItems = values.line_items.map((item) => ({
      product_id: item.product_id,
      custom_name: item.product_title,
      unit_price: Number(item.unit_price),
      quantity: Number(item.quantity),
      ...(item.start_date ? { start_date: item.start_date } : {}),
      ...(item.end_date ? { end_date: item.end_date } : {}),
      ...(item.product_instance_id
        ? { product_instance_id: item.product_instance_id }
        : {}),
      ...(item.selected_addons.length
        ? { selected_addons: item.selected_addons }
        : {}),
    }));

    const payload = {
      lead_id: activeLead.id,
      created_by_id: createdById,
      bank_account_id: values.bank_account_id,
      total_amount: Number(totalAmount.toFixed(2)),
      currency: values.currency,
      client_notes: values.client_notes,
      line_items: mappedLineItems,
    };

    try {
      const response = await createProposal({
        organizationId: activeOrganizationId,
        data: payload,
      });

      await queryClient.invalidateQueries({
        queryKey: getProposalsControllerFindAllV1QueryKey(activeOrganizationId),
      });

      const hash = getPublicLinkHash(response);
      if (hash) {
        setSuccessHash(hash);
        setIsSuccessModalOpen(true);
      } else {
        toast.success('Proposal created successfully.');
      }
    } catch {
      toast.error('Failed to create proposal. Please try again.');
    }
  };

  return (
    <Form {...form}>
      <>
        <form onSubmit={form.handleSubmit(submitHandler)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Proposal Builder</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <FormItem>
                  <FormLabel>Lead Name</FormLabel>
                  <FormControl>
                    <Input value={leadName} readOnly placeholder="Lead name" />
                  </FormControl>
                </FormItem>

                <FormItem>
                  <FormLabel>Client Phone</FormLabel>
                  <FormControl>
                    <Input
                      value={clientPhone}
                      readOnly
                      placeholder="Client phone"
                    />
                  </FormControl>
                </FormItem>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <SharedSearchableSelectField
                  control={form.control}
                  name="selected_product_id"
                  label="Add Product"
                  placeholder={
                    isProductsLoading
                      ? 'Loading products...'
                      : 'Search products...'
                  }
                  searchPlaceholder="Type product name..."
                  emptyLabel="No products found"
                  options={productOptions}
                  disabled={isProductsLoading || !activeOrganizationId}
                />

                <SharedSelectField
                  control={form.control}
                  name="bank_account_id"
                  label="Bank Account"
                  placeholder={
                    isBankAccountsLoading
                      ? 'Loading bank accounts...'
                      : 'Select bank account'
                  }
                  options={bankAccountOptions}
                  disabled={isBankAccountsLoading || !activeOrganizationId}
                />
              </div>

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <FormControl>
                      <div className="flex flex-wrap gap-2">
                        {currencyOptions.map((currency) => (
                          <Button
                            key={currency}
                            type="button"
                            variant={
                              field.value === currency ? 'default' : 'outline'
                            }
                            onClick={() => field.onChange(currency)}
                            className="min-w-16"
                          >
                            {currency}
                          </Button>
                        ))}
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="client_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value ?? ''}
                        rows={4}
                        placeholder="Add any context, constraints, or custom terms for the client..."
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="space-y-4">
            {fields.length === 0 ? (
              <Card>
                <CardContent className="text-muted-foreground pt-6 text-sm">
                  Search and add products to start building this proposal.
                </CardContent>
              </Card>
            ) : null}

            {fields.map((field, index) => {
              const current = form.getValues(`line_items.${index}`);
              const product = productsById.get(current?.product_id ?? '');
              const itemTotal = current ? calculateLineItemTotal(current) : 0;
              const itemAddons = current?.selected_addons ?? [];
              const isResourceRental =
                current?.product_type === 'RESOURCE_RENTAL';
              const isScheduledEvent =
                current?.product_type === 'SCHEDULED_EVENT';

              return (
                <Card key={field.id}>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <CardTitle className="text-base">
                          {current?.product_title}
                        </CardTitle>
                        <p className="text-muted-foreground text-sm">
                          Type: {current?.product_type}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-5">
                    <div className="grid gap-4 md:grid-cols-3">
                      <FormField
                        control={form.control}
                        name={`line_items.${index}.quantity`}
                        render={({ field: qtyField }) => (
                          <FormItem>
                            <FormLabel>Quantity</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                step={1}
                                value={qtyField.value ?? 1}
                                onChange={(event) => {
                                  qtyField.onChange(
                                    Math.max(1, Number(event.target.value) || 1)
                                  );
                                }}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`line_items.${index}.unit_price`}
                        render={({ field: priceField }) => (
                          <FormItem>
                            <FormLabel>Unit Price</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                step="0.01"
                                value={priceField.value ?? 0}
                                onChange={(event) => {
                                  priceField.onChange(
                                    Math.max(0, Number(event.target.value) || 0)
                                  );
                                }}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <div className="bg-muted/40 rounded-md border p-3">
                        <p className="text-muted-foreground text-xs font-medium">
                          Line Total
                        </p>
                        <p className="mt-1 text-lg font-semibold">
                          {form.getValues('currency')} {itemTotal.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {isResourceRental ? (
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name={`line_items.${index}.start_date`}
                          render={({ field: startField }) => (
                            <FormItem>
                              <FormLabel>Start Date</FormLabel>
                              <FormControl>
                                <DatePickerInput
                                  value={startField.value}
                                  onChange={startField.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`line_items.${index}.end_date`}
                          render={({ field: endField }) => (
                            <FormItem>
                              <FormLabel>End Date</FormLabel>
                              <FormControl>
                                <DatePickerInput
                                  value={endField.value}
                                  onChange={endField.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    ) : null}

                    {isScheduledEvent ? (
                      <FormField
                        control={form.control}
                        name={`line_items.${index}.product_instance_id`}
                        render={({ field: scheduleField }) => (
                          <FormItem>
                            <FormLabel>Schedule</FormLabel>
                            <Select
                              value={scheduleField.value ?? ''}
                              onValueChange={scheduleField.onChange}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select schedule" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {(product?.instances ?? []).map((instance) => (
                                  <SelectItem
                                    key={instance.id}
                                    value={instance.id}
                                  >
                                    {instance.start_date} - {instance.end_date}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    ) : null}

                    <div className="space-y-3">
                      <p className="text-sm font-semibold">Add-ons</p>
                      {(product?.available_addons ?? []).length === 0 ? (
                        <p className="text-muted-foreground text-sm">
                          No add-ons available for this product.
                        </p>
                      ) : (
                        <div className="grid gap-2 md:grid-cols-2">
                          {(product?.available_addons ?? []).map((addon) => {
                            const checked = itemAddons.some(
                              (selected) => selected.name === addon.name
                            );

                            return (
                              <label
                                key={`${addon.name}-${addon.price}`}
                                className={cn(
                                  'flex cursor-pointer items-center justify-between rounded-md border px-3 py-2 text-sm',
                                  checked
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border'
                                )}
                              >
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    checked={checked}
                                    onCheckedChange={(value) => {
                                      handleAddonToggle(
                                        index,
                                        addon,
                                        Boolean(value)
                                      );
                                    }}
                                  />
                                  <span>{addon.name}</span>
                                </div>
                                <span className="text-muted-foreground">
                                  +{form.getValues('currency')}{' '}
                                  {toNumber(addon.price).toFixed(2)}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardContent className="flex items-center justify-between pt-6">
              <div>
                <p className="text-muted-foreground text-sm">Total Amount</p>
                <p className="text-2xl font-bold">
                  {form.getValues('currency')} {totalAmount.toFixed(2)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => form.reset()}
                >
                  Reset
                </Button>
                <Button
                  type="submit"
                  disabled={isCreatingProposal || fields.length === 0}
                  className="gap-2"
                >
                  {isCreatingProposal ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Save Proposal
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
        <ProposalSuccessModal
          open={isSuccessModalOpen}
          onOpenChange={setIsSuccessModalOpen}
          publicLinkHash={successHash}
          clientName={leadName || 'Client'}
          clientPhone={clientPhone}
        />
      </>
    </Form>
  );
}
