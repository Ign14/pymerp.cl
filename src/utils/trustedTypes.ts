type TrustedTypesPolicyLike = {
  createHTML?: (input: string) => unknown;
  createScript?: (input: string) => unknown;
  createScriptURL?: (input: string) => unknown;
};

let cachedPolicy: TrustedTypesPolicyLike | null = null;

export const getTrustedTypesPolicy = (): TrustedTypesPolicyLike | null => {
  if (typeof window === 'undefined') return null;
  const tt = (window as any).trustedTypes;
  if (!tt?.createPolicy) return null;
  if (cachedPolicy) return cachedPolicy;

  try {
    cachedPolicy = tt.createPolicy('agendaweb', {
      createHTML: (input: string) => input,
      createScript: (input: string) => input,
      createScriptURL: (input: string) => input,
    });
  } catch {
    cachedPolicy = null;
  }

  return cachedPolicy;
};

export const setElementHTML = (element: Element, html: string): void => {
  const policy = getTrustedTypesPolicy();
  const trustedHtml = policy?.createHTML ? policy.createHTML(html) : html;
  (element as any).innerHTML = trustedHtml;
};
