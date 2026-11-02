"use client";

import * as React from "react";
import {
  Box,
  Button,
  Dialog,
  Flex,
  Heading,
  HStack,
  IconButton,
  Input,
  NativeSelect,
  Portal,
  SimpleGrid,
  Stack,
  Table,
  Toast,
  Toaster,
  Text,
} from "@chakra-ui/react";

import { formatCurrency } from "@/lib/format";
import { COLORS } from "@/components/shared/colors";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  SearchIcon,
} from "@/components/shared/icons";
import {
  controlStyles,
  dangerButtonStyles,
  dialogSurfaceStyles,
  focusRing,
  nativeSelectOptionStyles,
  primaryButtonStyles,
  secondaryButtonStyles,
  surfaceStyles,
  tableHeaderStyles,
} from "@/components/shared/styles";

import { createIncome, deleteIncome, updateIncome } from "../actions";
import type { IncomeInput } from "../income-schema";
import { toaster } from "../toaster";
import type {
  DateRangeFilter,
  IncomeFilters,
  IncomeRecord,
  IncomeSummary,
  SortOption,
} from "../types";
import {
  filterAndSortIncomes,
  formatIncomeDate,
  parseIncomeDateKey,
  summarizeIncomes,
} from "../utils";
import { IncomeDialog } from "./income-dialog";

const PAGE_SIZE = 8;

const DEFAULT_FILTERS: IncomeFilters = {
  search: "",
  dateRange: "all",
  sort: "date-desc",
};

interface IncomeHistoryProps {
  referenceDate: string;
  initialIncomes: IncomeRecord[];
  currency: string;
}

interface IncomeDetailsDialogProps {
  open: boolean;
  income: IncomeRecord | null;
  currency: string;
  onClose: () => void;
  onEdit: (income: IncomeRecord) => void;
  onDelete: (income: IncomeRecord) => void;
  onExitComplete: () => void;
}

function IncomeDetailsDialog({
  open,
  income,
  currency,
  onClose,
  onEdit,
  onDelete,
  onExitComplete,
}: IncomeDetailsDialogProps) {
  return (
    <DialogSurface
      open={open}
      title="Income details"
      onClose={onClose}
      onExitComplete={onExitComplete}
    >
      {income ? (
        <>
          <Flex mt={6} align="flex-start" justify="space-between" gap={4}>
            <Box minW={0}>
              <Text fontSize="lg" fontWeight="medium" color={COLORS.text}>
                {income.source?.trim() || "Income"}
              </Text>
              <Text mt={2} fontSize="sm" color={COLORS.muted}>
                {formatIncomeDate(income.incomeDate)}
              </Text>
              {income.description?.trim() ? (
                <Text mt={3} fontSize="sm" color={COLORS.muted}>
                  {income.description}
                </Text>
              ) : null}
            </Box>
            <Text
              flexShrink={0}
              fontSize="xl"
              fontWeight="semibold"
              color={COLORS.text}
              fontVariantNumeric="tabular-nums"
            >
              {formatCurrency(income.amount, currency)}
            </Text>
          </Flex>
          <Flex
            mt={6}
            pt={5}
            borderTopWidth="1px"
            borderColor={COLORS.border}
            gap={3}
            align="stretch"
          >
            <Button
              type="button"
              flex="1"
              onClick={() => onEdit(income)}
              {...primaryButtonStyles}
            >
              Edit
            </Button>
            <Button
              type="button"
              flex="1"
              onClick={() => onDelete(income)}
              {...dangerButtonStyles}
            >
              Delete
            </Button>
          </Flex>
        </>
      ) : null}
    </DialogSurface>
  );
}

interface DialogSurfaceProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  onExitComplete?: () => void;
  children: React.ReactNode;
  alert?: boolean;
}

function DialogSurface({
  open,
  title,
  description,
  onClose,
  onExitComplete,
  children,
  alert = false,
}: DialogSurfaceProps) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => {
        if (!details.open) {
          onClose();
        }
      }}
      onExitComplete={onExitComplete}
      size="sm"
      placement="center"
      lazyMount
      unmountOnExit
    >
      <Dialog.Backdrop bg={COLORS.backdrop} />
      <Dialog.Positioner p={4}>
        <Dialog.Content
          {...dialogSurfaceStyles}
          role={alert ? "alertdialog" : undefined}
        >
          <Dialog.Title
            fontSize="lg"
            fontWeight="semibold"
            letterSpacing="tight"
            color={COLORS.text}
          >
            {title}
          </Dialog.Title>
          {description ? (
            <Dialog.Description mt={2} fontSize="sm" color={COLORS.muted}>
              {description}
            </Dialog.Description>
          ) : null}
          {children}
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

export function IncomeHistory({
  referenceDate,
  initialIncomes,
  currency,
}: IncomeHistoryProps) {
  const [incomes, setIncomes] = React.useState<IncomeRecord[]>(initialIncomes);
  const [filters, setFilters] = React.useState<IncomeFilters>(DEFAULT_FILTERS);
  const [page, setPage] = React.useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [editingIncome, setEditingIncome] = React.useState<IncomeRecord | null>(
    null,
  );
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [viewedIncome, setViewedIncome] = React.useState<IncomeRecord | null>(
    null,
  );
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);
  const [deletingIncome, setDeletingIncome] =
    React.useState<IncomeRecord | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const pendingDetailsActionRef = React.useRef<(() => void) | null>(null);

  const reference = React.useMemo(
    () => parseIncomeDateKey(referenceDate),
    [referenceDate],
  );
  const summary = React.useMemo(
    () => summarizeIncomes(incomes, reference),
    [incomes, reference],
  );
  const filteredIncomes = React.useMemo(
    () => filterAndSortIncomes(incomes, filters, reference),
    [incomes, filters, reference],
  );
  const pageCount = Math.max(1, Math.ceil(filteredIncomes.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visibleIncomes = filteredIncomes.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const hasFilters =
    filters.search.trim() !== "" || filters.dateRange !== "all";

  const updateFilters = (patch: Partial<IncomeFilters>) => {
    setFilters((current) => ({ ...current, ...patch }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  };

  const handleAddIncome = async (values: IncomeInput) => {
    try {
      const income = await createIncome(values);
      setIncomes((current) => [income, ...current]);
      setFilters(DEFAULT_FILTERS);
      setPage(1);
      setIsAddDialogOpen(false);
      toaster.create({ title: "Income saved.", type: "success" });
    } catch {
      toaster.create({
        title: "Income could not be saved.",
        description: "Please try again.",
        type: "error",
      });
    }
  };

  const handleUpdateIncome = async (values: IncomeInput) => {
    if (!editingIncome) {
      return;
    }

    try {
      const updatedIncome = await updateIncome(editingIncome.id, values);
      setIncomes((current) =>
        current.map((income) =>
          income.id === updatedIncome.id ? updatedIncome : income,
        ),
      );
      setIsEditDialogOpen(false);
      toaster.create({ title: "Income updated.", type: "success" });
    } catch {
      toaster.create({
        title: "Income could not be updated.",
        description: "Please try again.",
        type: "error",
      });
    }
  };

  const handleDeleteIncome = async () => {
    if (!deletingIncome || isDeleting) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteIncome(deletingIncome.id);
      setIncomes((current) =>
        current.filter((income) => income.id !== deletingIncome.id),
      );
      setIsDeleteDialogOpen(false);
      toaster.create({ title: "Income deleted.", type: "success" });
    } catch {
      toaster.create({
        title: "Income could not be deleted.",
        description: "Please try again.",
        type: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const closeDetailsThen = (action: () => void) => {
    pendingDetailsActionRef.current = action;
    setIsDetailsOpen(false);
  };

  const handleDetailsExitComplete = () => {
    const pendingAction = pendingDetailsActionRef.current;
    pendingDetailsActionRef.current = null;
    pendingAction?.();
  };

  const openEditDialog = (income: IncomeRecord) => {
    setEditingIncome(income);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (income: IncomeRecord) => {
    setDeletingIncome(income);
    setIsDeleteDialogOpen(true);
  };

  return (
    <Box
      as="main"
      minH="100dvh"
      bg={COLORS.page}
      color={COLORS.text}
      fontFamily="var(--font-geist-sans), Arial, Helvetica, sans-serif"
    >
      <Box
        maxW="6xl"
        mx="auto"
        px={{ base: 4, md: 6 }}
        py={{ base: 8, md: 10 }}
      >
        <Stack gap={6}>
          <Flex
            as="header"
            direction={{ base: "column", sm: "row" }}
            align={{ base: "stretch", sm: "flex-start" }}
            justify="space-between"
            gap={4}
          >
            <Box>
              <Heading
                as="h1"
                fontSize={{ base: "2xl", md: "3xl" }}
                fontWeight="semibold"
                letterSpacing="tight"
                color={COLORS.text}
              >
                Income
              </Heading>
              <Text mt={2} fontSize="sm" lineHeight="1.6" color={COLORS.muted}>
                Review and manage your income records.
              </Text>
            </Box>
            <Button
              type="button"
              flexShrink={0}
              onClick={() => setIsAddDialogOpen(true)}
              {...primaryButtonStyles}
            >
              <HStack gap={2}>
                <PlusIcon />
                <Text as="span">Add income</Text>
              </HStack>
            </Button>
          </Flex>

          <Stack gap={4}>
            <IncomeSummaryCards summary={summary} currency={currency} />
            <IncomeToolbar
              filters={filters}
              hasFilters={hasFilters}
              onFilterChange={updateFilters}
              onClearFilters={clearFilters}
            />
            <IncomeTable
              incomes={visibleIncomes}
              totalCount={filteredIncomes.length}
              page={currentPage}
              pageCount={pageCount}
              pageSize={PAGE_SIZE}
              hasFilters={hasFilters}
              hasAnyIncomes={incomes.length > 0}
              currency={currency}
              onPageChange={setPage}
              onClearFilters={clearFilters}
              onViewIncome={(income) => {
                setViewedIncome(income);
                setIsDetailsOpen(true);
              }}
              onAddIncome={() => setIsAddDialogOpen(true)}
            />
          </Stack>
        </Stack>
      </Box>

      <IncomeDetailsDialog
        open={isDetailsOpen}
        income={viewedIncome}
        currency={currency}
        onClose={() => setIsDetailsOpen(false)}
        onEdit={(income) => closeDetailsThen(() => openEditDialog(income))}
        onDelete={(income) => closeDetailsThen(() => openDeleteDialog(income))}
        onExitComplete={handleDetailsExitComplete}
      />

      <IncomeDialog
        open={isAddDialogOpen || isEditDialogOpen}
        today={referenceDate}
        income={isEditDialogOpen ? editingIncome : null}
        onClose={() => {
          setIsAddDialogOpen(false);
          setIsEditDialogOpen(false);
        }}
        onSubmit={isEditDialogOpen ? handleUpdateIncome : handleAddIncome}
      />

      <DialogSurface
        open={isDeleteDialogOpen}
        title="Delete income?"
        description="This will permanently delete this income record."
        onClose={() => setIsDeleteDialogOpen(false)}
        alert
      >
        {deletingIncome ? (
          <Box
            mt={5}
            py={4}
            borderTopWidth="1px"
            borderBottomWidth="1px"
            borderColor={COLORS.border}
          >
            <Flex align="flex-start" justify="space-between" gap={4}>
              <Box minW={0}>
                <Text fontWeight="medium" color={COLORS.text}>
                  {deletingIncome.source?.trim() || "Income"}
                </Text>
                <Text mt={1.5} fontSize="sm" color={COLORS.muted}>
                  {formatIncomeDate(deletingIncome.incomeDate)}
                </Text>
              </Box>
              <Text
                flexShrink={0}
                fontWeight="semibold"
                color={COLORS.text}
                fontVariantNumeric="tabular-nums"
              >
                {formatCurrency(deletingIncome.amount, currency)}
              </Text>
            </Flex>
          </Box>
        ) : null}
        <Flex mt={6} gap={3} align="stretch">
          <Button
            type="button"
            flex="1"
            onClick={() => setIsDeleteDialogOpen(false)}
            {...secondaryButtonStyles}
          >
            Cancel
          </Button>
          <Button
            type="button"
            flex="1"
            onClick={handleDeleteIncome}
            loading={isDeleting}
            disabled={isDeleting}
            {...dangerButtonStyles}
          >
            Delete income
          </Button>
        </Flex>
      </DialogSurface>
      <Portal>
        <Toaster toaster={toaster} w="calc(100vw - 2rem)" maxW="sm">
          {(toast) => (
            <Toast.Root key={toast.id} data-type={toast.type}>
              <Toast.Title>{toast.title}</Toast.Title>
              {toast.description ? (
                <Toast.Description>{toast.description}</Toast.Description>
              ) : null}
            </Toast.Root>
          )}
        </Toaster>
      </Portal>
    </Box>
  );
}

function IncomeSummaryCards({
  summary,
  currency,
}: {
  summary: IncomeSummary;
  currency: string;
}) {
  const metrics = [
    {
      label: "This month",
      value: formatCurrency(summary.monthTotal, currency),
      caption: `${summary.monthCount} income ${
        summary.monthCount === 1 ? "entry" : "entries"
      }`,
    },
    {
      label: "Last month",
      value: formatCurrency(summary.lastMonthTotal, currency),
      caption: "Recorded income",
    },
    {
      label: "Year to date",
      value: formatCurrency(summary.yearTotal, currency),
      caption: "Recorded this year",
    },
    {
      label: "All time",
      value: formatCurrency(summary.lifetimeTotal, currency),
      caption: `${summary.lifetimeCount} total ${
        summary.lifetimeCount === 1 ? "entry" : "entries"
      }`,
    },
  ];

  return (
    <SimpleGrid columns={{ base: 2, xl: 4 }} gap={3}>
      {metrics.map((metric) => (
        <Box key={metric.label} {...surfaceStyles} p={{ base: 3, md: 5 }}>
          <Text {...tableHeaderStyles}>{metric.label}</Text>
          <Text
            mt={2}
            fontSize={{ base: "lg", sm: "2xl" }}
            fontWeight="semibold"
            lineHeight="1.2"
            letterSpacing="tight"
            color={COLORS.text}
            fontVariantNumeric="tabular-nums"
          >
            {metric.value}
          </Text>
          <Text mt={2} fontSize="xs" lineHeight="1.5" color={COLORS.muted}>
            {metric.caption}
          </Text>
        </Box>
      ))}
    </SimpleGrid>
  );
}

function IncomeToolbar({
  filters,
  hasFilters,
  onFilterChange,
  onClearFilters,
}: {
  filters: IncomeFilters;
  hasFilters: boolean;
  onFilterChange: (patch: Partial<IncomeFilters>) => void;
  onClearFilters: () => void;
}) {
  return (
    <Flex
      as="search"
      aria-label="Filter income"
      direction={{ base: "column", lg: "row" }}
      align={{ lg: "center" }}
      gap={2}
    >
      <Box position="relative" flex="1" minW={{ base: "full", lg: "16rem" }}>
        <Box
          position="absolute"
          top="50%"
          left="3"
          zIndex="1"
          transform="translateY(-50%)"
          color={COLORS.muted}
          pointerEvents="none"
          aria-hidden="true"
        >
          <SearchIcon />
        </Box>
        <Input
          ps="10"
          placeholder="Search sources and descriptions…"
          aria-label="Search income sources and descriptions"
          value={filters.search}
          onChange={(event) => onFilterChange({ search: event.target.value })}
          {...controlStyles}
        />
      </Box>

      <NativeSelect.Root
        w={{ base: "full", lg: "40" }}
        flexShrink={0}
        size="sm"
      >
        <NativeSelect.Field
          aria-label="Filter income by date range"
          value={filters.dateRange}
          onChange={(event) =>
            onFilterChange({
              dateRange: event.target.value as DateRangeFilter,
            })
          }
          {...controlStyles}
          css={nativeSelectOptionStyles}
        >
          <option value="all">All time</option>
          <option value="this-month">This month</option>
          <option value="last-month">Last month</option>
          <option value="this-year">This year</option>
        </NativeSelect.Field>
        <NativeSelect.Indicator color={COLORS.muted} />
      </NativeSelect.Root>

      <NativeSelect.Root
        w={{ base: "full", lg: "44" }}
        flexShrink={0}
        size="sm"
      >
        <NativeSelect.Field
          aria-label="Sort income"
          value={filters.sort}
          onChange={(event) =>
            onFilterChange({ sort: event.target.value as SortOption })
          }
          {...controlStyles}
          css={nativeSelectOptionStyles}
        >
          <option value="date-desc">Newest first</option>
          <option value="date-asc">Oldest first</option>
          <option value="amount-desc">Highest amount</option>
          <option value="amount-asc">Lowest amount</option>
        </NativeSelect.Field>
        <NativeSelect.Indicator color={COLORS.muted} />
      </NativeSelect.Root>

      {hasFilters ? (
        <Button
          size="sm"
          variant="ghost"
          flexShrink={0}
          color={COLORS.text}
          _hover={{ bg: COLORS.primarySurface }}
          _focusVisible={focusRing}
          onClick={onClearFilters}
        >
          Reset
        </Button>
      ) : null}
    </Flex>
  );
}

interface IncomeTableProps {
  incomes: IncomeRecord[];
  currency: string;
  totalCount: number;
  page: number;
  pageCount: number;
  pageSize: number;
  hasFilters: boolean;
  hasAnyIncomes: boolean;
  onPageChange: (page: number) => void;
  onClearFilters: () => void;
  onViewIncome: (income: IncomeRecord) => void;
  onAddIncome: () => void;
}

function IncomeTable({
  incomes,
  currency,
  totalCount,
  page,
  pageCount,
  pageSize,
  hasFilters,
  hasAnyIncomes,
  onPageChange,
  onClearFilters,
  onViewIncome,
  onAddIncome,
}: IncomeTableProps) {
  const start = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalCount);

  return (
    <Box {...surfaceStyles} overflow="hidden">
      <Flex
        align="center"
        justify="space-between"
        gap={3}
        px={{ base: 4, md: 5 }}
        py={4}
      >
        <Box>
          <Text fontWeight="semibold" color={COLORS.text}>
            Income history
          </Text>
          <Text mt={0.5} fontSize="sm" color={COLORS.muted}>
            {hasAnyIncomes
              ? `${totalCount} ${totalCount === 1 ? "entry" : "entries"}${
                  hasFilters ? " matching your filters" : ""
                }`
              : "No income recorded yet"}
          </Text>
        </Box>
      </Flex>

      <Table.ScrollArea borderTopWidth="1px" borderColor={COLORS.border}>
        <Table.Root
          size="md"
          variant="line"
          aria-label="Income history"
          bg="transparent"
          css={{ "& th, & td": { borderColor: COLORS.border } }}
        >
          <Table.Header>
            <Table.Row bg={COLORS.raised}>
              <Table.ColumnHeader {...tableHeaderStyles}>
                Source / description
              </Table.ColumnHeader>
              <Table.ColumnHeader
                display={{ base: "none", md: "table-cell" }}
                {...tableHeaderStyles}
              >
                Date
              </Table.ColumnHeader>
              <Table.ColumnHeader textAlign="right" {...tableHeaderStyles}>
                Amount
              </Table.ColumnHeader>
              <Table.ColumnHeader {...tableHeaderStyles} w="12">
                <Text srOnly>Actions</Text>
              </Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {incomes.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={4} px={4}>
                  <Stack align="center" gap={3} py={12} textAlign="center">
                    <Box>
                      <Text fontWeight="semibold" color={COLORS.text}>
                        {hasAnyIncomes
                          ? "No income matches your filters"
                          : "No income yet"}
                      </Text>
                      <Text mt={1} fontSize="sm" color={COLORS.muted}>
                        {hasAnyIncomes
                          ? "Try a different search or date range."
                          : "Add your first income entry to start tracking."}
                      </Text>
                    </Box>
                    {hasAnyIncomes && hasFilters ? (
                      <Button
                        type="button"
                        onClick={onClearFilters}
                        {...secondaryButtonStyles}
                      >
                        Clear filters
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        onClick={onAddIncome}
                        {...primaryButtonStyles}
                      >
                        Add income
                      </Button>
                    )}
                  </Stack>
                </Table.Cell>
              </Table.Row>
            ) : (
              incomes.map((income) => {
                const source = income.source?.trim() || "Unspecified source";
                const formattedAmount = formatCurrency(income.amount, currency);

                return (
                  <Table.Row
                    key={income.id}
                    data-income-id={income.id}
                    bg={COLORS.card}
                    _hover={{ bg: COLORS.raised }}
                    cursor="pointer"
                    onClick={() => onViewIncome(income)}
                    transition="background-color 0.15s ease"
                  >
                    <Table.Cell>
                      <Text
                        display="block"
                        maxW={{ base: "11rem", md: "24rem" }}
                        truncate
                        color={COLORS.text}
                        title={source}
                      >
                        {source}
                      </Text>
                      {income.description?.trim() ? (
                        <Text
                          display="block"
                          maxW={{ base: "11rem", md: "24rem" }}
                          truncate
                          mt={1}
                          fontSize="sm"
                          color={COLORS.muted}
                          title={income.description}
                        >
                          {income.description}
                        </Text>
                      ) : null}
                      <Text
                        display={{ base: "block", md: "none" }}
                        mt={1}
                        fontSize="xs"
                        color={COLORS.muted}
                      >
                        {formatIncomeDate(income.incomeDate)}
                      </Text>
                    </Table.Cell>
                    <Table.Cell
                      display={{ base: "none", md: "table-cell" }}
                      whiteSpace="nowrap"
                      fontSize="sm"
                      color={COLORS.muted}
                    >
                      {formatIncomeDate(income.incomeDate)}
                    </Table.Cell>
                    <Table.Cell
                      textAlign="right"
                      whiteSpace="nowrap"
                      fontWeight="medium"
                      color={COLORS.text}
                      fontVariantNumeric="tabular-nums"
                    >
                      {formattedAmount}
                    </Table.Cell>
                    <Table.Cell textAlign="right" pr={{ base: 3, md: 4 }}>
                      <IconButton
                        type="button"
                        size="sm"
                        variant="ghost"
                        aria-label={`View details for ${source}, ${formattedAmount}`}
                        aria-haspopup="dialog"
                        color={COLORS.muted}
                        _hover={{ bg: COLORS.raisedHover, color: COLORS.text }}
                        _focusVisible={focusRing}
                        onClick={(event) => {
                          event.stopPropagation();
                          onViewIncome(income);
                        }}
                      >
                        <ChevronRightIcon size={18} />
                      </IconButton>
                    </Table.Cell>
                  </Table.Row>
                );
              })
            )}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>

      {totalCount > 0 ? (
        <Flex
          direction={{ base: "column", sm: "row" }}
          align={{ base: "flex-start", sm: "center" }}
          justify="space-between"
          gap={3}
          borderTopWidth="1px"
          borderColor={COLORS.border}
          px={{ base: 4, md: 5 }}
          py={3}
        >
          <Text css={{ fontSize: "sm", color: COLORS.muted }}>
            Showing {start}–{end} of {totalCount}
          </Text>
          <HStack gap={2}>
            <IconButton
              type="button"
              size="sm"
              variant="ghost"
              aria-label="Previous page"
              color={COLORS.muted}
              disabled={page <= 1}
              _hover={{ bg: COLORS.raised, color: COLORS.text }}
              _focusVisible={focusRing}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeftIcon />
            </IconButton>
            <Text
              minW="20"
              textAlign="center"
              fontSize="sm"
              color={COLORS.muted}
              fontVariantNumeric="tabular-nums"
            >
              Page {page} of {pageCount}
            </Text>
            <IconButton
              type="button"
              size="sm"
              variant="ghost"
              aria-label="Next page"
              color={COLORS.muted}
              disabled={page >= pageCount}
              _hover={{ bg: COLORS.raised, color: COLORS.text }}
              _focusVisible={focusRing}
              onClick={() => onPageChange(page + 1)}
            >
              <ChevronRightIcon />
            </IconButton>
          </HStack>
        </Flex>
      ) : null}
    </Box>
  );
}
