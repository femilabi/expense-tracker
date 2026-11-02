/**
 * In-memory stand-in for the parts of the Prisma client used by the password
 * and account deletion flows. Interactive transactions run one at a time
 * (like rows locked by the conditional updates in MySQL) and roll back every
 * change when they throw.
 */

export type UserRow = {
  id: string;
  name: string;
  email: string;
  passwordHash: string | null;
  passwordChangedAt: Date | null;
  sessionVersion: number;
};

export type ResetTokenRow = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
};

/** A row of a table that only matters here because it belongs to a user. */
export type OwnedRow = {
  id: string;
  userId: string;
};

export const OWNED_TABLES = [
  "profiles",
  "incomes",
  "expenses",
  "monthlySummaries",
] as const;

export type OwnedTable = (typeof OWNED_TABLES)[number];

type State = {
  users: UserRow[];
  resetTokens: ResetTokenRow[];
} & Record<OwnedTable, OwnedRow[]>;

type UserWhere = { id?: string; email?: string };
type TokenWhere = { id?: string; userId?: string; usedAt?: null };

let nextId = 1;
function emptyState(): State {
  return {
    users: [],
    resetTokens: [],
    profiles: [],
    incomes: [],
    expenses: [],
    monthlySummaries: [],
  };
}

let state: State = emptyState();
let failures = new Set<string>();
let transactionQueue: Promise<unknown> = Promise.resolve();

function cloneState(source: State): State {
  return {
    users: source.users.map((user) => ({ ...user })),
    resetTokens: source.resetTokens.map((token) => ({ ...token })),
    profiles: source.profiles.map((row) => ({ ...row })),
    incomes: source.incomes.map((row) => ({ ...row })),
    expenses: source.expenses.map((row) => ({ ...row })),
    monthlySummaries: source.monthlySummaries.map((row) => ({ ...row })),
  };
}

function failIfRequested(operation: string) {
  if (failures.delete(operation)) {
    throw new Error(`Simulated failure in ${operation}`);
  }
}

function findUser(where: UserWhere): UserRow | undefined {
  return state.users.find(
    (user) =>
      (where.id === undefined || user.id === where.id) &&
      (where.email === undefined || user.email === where.email),
  );
}

function tokenMatches(token: ResetTokenRow, where: TokenWhere): boolean {
  return (
    (where.id === undefined || token.id === where.id) &&
    (where.userId === undefined || token.userId === where.userId) &&
    (!("usedAt" in where) || token.usedAt === where.usedAt)
  );
}

/** `deleteMany({ where: { userId } })` for a table of user owned rows. */
function ownedModel(table: OwnedTable) {
  return {
    async deleteMany({ where }: { where: { userId: string } }) {
      const before = state[table].length;
      state[table] = state[table].filter((row) => row.userId !== where.userId);
      return { count: before - state[table].length };
    },
  };
}

const models = {
  user: {
    async findUnique({ where }: { where: UserWhere }) {
      const user = findUser(where);
      return user ? { ...user } : null;
    },
    async update({
      where,
      data,
    }: {
      where: UserWhere;
      data: {
        passwordHash?: string;
        passwordChangedAt?: Date;
        sessionVersion?: { increment: number };
      };
    }) {
      failIfRequested("user.update");
      const user = findUser(where);
      if (!user) {
        throw new Error("User not found");
      }
      if (data.passwordHash !== undefined) {
        user.passwordHash = data.passwordHash;
      }
      if (data.passwordChangedAt !== undefined) {
        user.passwordChangedAt = data.passwordChangedAt;
      }
      if (data.sessionVersion) {
        user.sessionVersion += data.sessionVersion.increment;
      }
      return { ...user };
    },
    async delete({ where }: { where: UserWhere }) {
      failIfRequested("user.delete");
      const user = findUser(where);
      if (!user) {
        throw new Error("User not found");
      }
      // Rows still pointing at the user would violate a foreign key.
      const remaining = [
        ...state.resetTokens,
        ...OWNED_TABLES.flatMap((table) => state[table]),
      ].some((row) => row.userId === user.id);
      if (remaining) {
        throw new Error("Foreign key constraint failed");
      }
      state.users = state.users.filter((row) => row !== user);
      return { ...user };
    },
  },
  passwordResetToken: {
    async findUnique({ where }: { where: { tokenHash: string } }) {
      const token = state.resetTokens.find(
        (row) => row.tokenHash === where.tokenHash,
      );
      return token ? { ...token } : null;
    },
    async create({
      data,
    }: {
      data: { userId: string; tokenHash: string; expiresAt: Date };
    }) {
      const token: ResetTokenRow = {
        id: `token-${nextId++}`,
        usedAt: null,
        createdAt: new Date(),
        ...data,
      };
      state.resetTokens.push(token);
      return { ...token };
    },
    async updateMany({
      where,
      data,
    }: {
      where: TokenWhere;
      data: { usedAt: Date };
    }) {
      failIfRequested("passwordResetToken.updateMany");
      const matches = state.resetTokens.filter((token) =>
        tokenMatches(token, where),
      );
      for (const token of matches) {
        token.usedAt = data.usedAt;
      }
      return { count: matches.length };
    },
    async deleteMany({ where }: { where: { userId: string } }) {
      const before = state.resetTokens.length;
      state.resetTokens = state.resetTokens.filter(
        (token) => token.userId !== where.userId,
      );
      return { count: before - state.resetTokens.length };
    },
  },
  profile: ownedModel("profiles"),
  income: ownedModel("incomes"),
  expense: ownedModel("expenses"),
  monthlySummary: ownedModel("monthlySummaries"),
};

const client = {
  ...models,
  async $transaction<T>(
    input: ((tx: typeof models) => Promise<T>) | Promise<unknown>[],
  ): Promise<T | unknown[]> {
    if (Array.isArray(input)) {
      return Promise.all(input);
    }

    const run = transactionQueue.then(async () => {
      const snapshot = cloneState(state);
      try {
        return await input(models);
      } catch (error) {
        state = snapshot;
        throw error;
      }
    });
    transactionQueue = run.catch(() => undefined);
    return run;
  },
};

export const fakeDb = {
  client,
  reset() {
    state = emptyState();
    failures = new Set();
    transactionQueue = Promise.resolve();
  },
  /** Makes the next call of the given operation throw. */
  failNext(
    operation: "user.update" | "user.delete" | "passwordResetToken.updateMany",
  ) {
    failures.add(operation);
  },
  addUser(user: Omit<UserRow, "id" | "passwordChangedAt" | "sessionVersion">) {
    const row: UserRow = {
      id: `user-${nextId++}`,
      passwordChangedAt: null,
      sessionVersion: 0,
      ...user,
    };
    state.users.push(row);
    return { ...row };
  },
  addResetToken(token: Omit<ResetTokenRow, "id" | "usedAt" | "createdAt">) {
    const row: ResetTokenRow = {
      id: `token-${nextId++}`,
      usedAt: null,
      createdAt: new Date(),
      ...token,
    };
    state.resetTokens.push(row);
    return { ...row };
  },
  addOwnedRow(table: OwnedTable, userId: string) {
    const row: OwnedRow = { id: `${table}-${nextId++}`, userId };
    state[table].push(row);
    return { ...row };
  },
  /** Counts the rows of every table, reset tokens included, owned by a user. */
  countOwnedRows(userId: string) {
    const count = (rows: OwnedRow[]) =>
      rows.filter((row) => row.userId === userId).length;

    return {
      resetTokens: count(state.resetTokens),
      profiles: count(state.profiles),
      incomes: count(state.incomes),
      expenses: count(state.expenses),
      monthlySummaries: count(state.monthlySummaries),
    };
  },
  getUser(id: string) {
    const user = findUser({ id });
    return user ? { ...user } : undefined;
  },
  getResetTokens(userId: string) {
    return state.resetTokens
      .filter((token) => token.userId === userId)
      .map((token) => ({ ...token }));
  },
};
