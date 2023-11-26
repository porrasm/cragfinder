export const QueryParamsKeys = ['selectedPoint'] as const;
export type QueryParamsKey = typeof QueryParamsKeys[number];

const getKeys = (): QueryParamsKey[] => [...QueryParamsKeys]

const getEmptyQueryParams = (): QueryParams => {
  const params: Record<string, string | undefined> = {}
  for (let key of QueryParamsKeys) {
    params[key] = undefined;
  }
  return params as QueryParams;
}

export type QueryParams = Record<QueryParamsKey, string | undefined>;

export const getQueryParams = (): QueryParams => {
  const params: QueryParams = getEmptyQueryParams();
  const queryString = window.location.search.substring(1);
  const pairs = queryString.split("&");

  for (let pair of pairs) {
    const [key, value] = pair.split("=");
    if (getKeys().includes(key as QueryParamsKey)) {
      params[key as QueryParamsKey] = decodeURIComponent(value);
    }
  }

  return params;
};

export const setQueryParams = (params: QueryParams): void => {
  const pairs: string[] = [];

  for (const key of getKeys()) {
    if (params[key] !== undefined) {
      pairs.push(`${key}=${encodeURIComponent(params[key] as string)}`);
    }
  }

  const queryString = pairs.join("&");

  if (queryString === "") {
    window.history.pushState({}, '', window.location.pathname);
    return;
  }

  window.history.pushState({}, '', '?' + queryString);
};