type JsonRecord = Record<string, unknown>;
type QueryValue = string | number | boolean | null | undefined;

type QueryParams = Record<string, QueryValue>;

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function buildPath(path: string, query?: QueryParams) {
  if (!query) return path;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    params.set(key, String(value));
  }

  const queryString = params.toString();
  return queryString ? `${path}?${queryString}` : path;
}

async function readJson<T>(path: string, fallback: T, query?: QueryParams): Promise<T> {
  try {
    const response = await fetch(`${apiUrl}${buildPath(path, query)}`, { cache: 'no-store' });
    if (!response.ok) return fallback;
    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

export type V4ModuleData = {
  module: string;
  status: string;
  readiness: number;
  nextSteps: string[];
};

export type RwaOverview = V4ModuleData & {
  items: Array<JsonRecord>;
  total: number;
  page: number;
  pageSize: number;
};

export type SsiOverview = V4ModuleData & {
  credentials: Array<JsonRecord>;
  total: number;
  page: number;
  pageSize: number;
};

export type SubscriptionOverview = V4ModuleData & {
  plans: Array<JsonRecord>;
  total: number;
  page: number;
  pageSize: number;
};

export type DaoOverview = V4ModuleData & {
  proposals: Array<JsonRecord>;
  total: number;
  page: number;
  pageSize: number;
};

export type V4Overview = V4ModuleData & {
  modules: Array<{
    id: string;
    title: string;
    href: string;
    status: string;
    readiness: number;
    items: number;
  }>;
};

export async function getV4Overview(): Promise<V4Overview> {
  return readJson<V4Overview>('/v4', {
    module: 'v4',
    status: 'frontend-and-api-scaffold',
    readiness: 0,
    modules: [],
    nextSteps: [],
  });
}

export async function getRwaOverview(query?: QueryParams): Promise<RwaOverview> {
  return readJson<RwaOverview>('/rwa', {
    module: 'rwa',
    status: 'frontend-and-api-scaffold',
    readiness: 0.35,
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
    nextSteps: [],
  }, query);
}

export async function getSsiOverview(query?: QueryParams): Promise<SsiOverview> {
  return readJson<SsiOverview>('/ssi', {
    module: 'ssi',
    status: 'frontend-and-api-scaffold',
    readiness: 0.3,
    credentials: [],
    total: 0,
    page: 1,
    pageSize: 20,
    nextSteps: [],
  }, query);
}

export async function getSubscriptionOverview(query?: QueryParams): Promise<SubscriptionOverview> {
  return readJson<SubscriptionOverview>('/subscriptions', {
    module: 'subscription',
    status: 'frontend-and-api-scaffold',
    readiness: 0.25,
    plans: [],
    total: 0,
    page: 1,
    pageSize: 20,
    nextSteps: [],
  }, query);
}

export async function getDaoOverview(query?: QueryParams): Promise<DaoOverview> {
  return readJson<DaoOverview>('/dao', {
    module: 'dao',
    status: 'frontend-and-api-scaffold',
    readiness: 0.4,
    proposals: [],
    total: 0,
    page: 1,
    pageSize: 20,
    nextSteps: [],
  }, query);
}