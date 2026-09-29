import {
  INITIAL_ACCOUNTS,
  INITIAL_ALIASES,
  INITIAL_AUDIT_LOGS,
  INITIAL_KEYS,
  INITIAL_METRICS,
  INITIAL_MODELS,
  INITIAL_PROVIDERS,
  INITIAL_REQUESTS,
  INITIAL_ROUTES,
} from '../data/mockData';

const clone = <T>(value: T): T => structuredClone(value);
const ok = <T>(value: T) => Promise.resolve(value);
const makeId = (prefix: string) => `${prefix}-${Date.now().toString(36)}`;

let publicBaseUrl = 'https://kinetix.kosal.dev';
let lifecycleSettings = {
  reconciliation_interval_secs: 21600,
  pricing_sync_interval_secs: 43200,
  jitter_secs: 900,
  probe_freshness_secs: 86400,
};

let keys = clone(INITIAL_KEYS);
let providers = clone(INITIAL_PROVIDERS);
let accounts = clone(INITIAL_ACCOUNTS);
let models = clone(INITIAL_MODELS);
let routes = clone(INITIAL_ROUTES);
let aliases = clone(INITIAL_ALIASES);

const lifecycle = () => ({
  reconciliation: {
    last_attempt: '2026-09-28T09:31:00Z',
    last_success: '2026-09-28T09:31:00Z',
    last_failure: null,
    last_error: null,
  },
  pricing_sync: {
    last_attempt: '2026-09-28T09:30:00Z',
    last_success: '2026-09-28T09:30:00Z',
    last_failure: null,
    last_error: null,
  },
});

const discoveredModels = (providerId: string) =>
  models
    .filter((model: any) => model.providerId === providerId)
    .map((model: any) => {
      const levelNames = Object.keys(model.thinkingMap?.levels || {});
      return {
        id: model.upstreamModelId,
        display_name: model.displayName,
        context_window: model.contextWindow,
        max_output_tokens: model.maxOutputTokens,
        capabilities: {
          text: model.capabilities?.text ?? null,
          reasoning: model.capabilities?.reasoning ?? null,
          vision: model.capabilities?.vision ?? null,
          tool_calling: model.capabilities?.toolCalling ?? null,
          structured_output: model.capabilities?.structuredOutput ?? null,
        },
        reasoning_capability: model.capabilities?.reasoning
          ? {
              mode: model.thinkingMap?.mode || 'level',
              levels: levelNames,
              default: levelNames.includes('medium')
                ? 'medium'
                : levelNames.includes('high')
                  ? 'high'
                  : levelNames[0] || null,
              can_disable: true,
              upstream_format: model.transportOverride || 'openai',
            }
          : null,
        thinking_map: {
          levels: model.thinkingMap?.levels || {},
          mode: model.thinkingMap?.mode || null,
          budget_field: model.thinkingMap?.budgetField || null,
          level_field: model.thinkingMap?.levelField || null,
        },
        transport: model.transportOverride || null,
        transport_source: 'plugin',
        capability_sources: {
          text: 'provider_metadata',
          reasoning: 'plugin',
          vision: 'provider_metadata',
          tool_calling: 'plugin',
          structured_output: 'plugin',
        },
        prices: {
          input_per_1m: model.prices?.inputPer1M ?? null,
          output_per_1m: model.prices?.outputPer1M ?? null,
          cached_per_1m: model.prices?.cachedPer1M ?? null,
          cache_write_per_1m: model.prices?.cacheWritePer1M ?? null,
          thinking_per_1m: model.prices?.thinkingPer1M ?? null,
        },
        price_sources: {
          input_per_1m: model.providerId === 'prov-opencode' ? 'plugin' : 'models.dev',
          output_per_1m: model.providerId === 'prov-opencode' ? 'plugin' : 'models.dev',
        },
        raw_metadata: { demo: true, provider_id: providerId },
        raw_metadata_truncated: false,
        canonical_identity: {
          status: 'resolved',
          upstream_model_id: model.upstreamModelId,
          canonical_model_id: model.upstreamModelId,
          match: 'exact',
          source: 'demo',
          candidates: [],
        },
        canonical_model_id: model.upstreamModelId,
        canonical_match: 'exact',
        model_type: 'chat',
        execution_supported: true,
        catalog: {
          canonical: {
            source: 'models.dev',
            reference: model.upstreamModelId,
            canonical_model_id: model.upstreamModelId,
            model_type: 'chat',
            max_input_tokens: model.contextWindow,
          },
          provider: {
            source: 'plugin',
            reference: providerId,
            provider_id: providerId,
            model_id: model.upstreamModelId,
            model_type: 'chat',
            max_input_tokens: model.contextWindow,
          },
        },
        reconciliation: clone(model.discovery?.reconciliation || { status: 'unchanged', diff: [] }),
        already_imported: true,
      };
    });

const plugins: any[] = [
  {
    id: 'antigravity-oauth',
    name: 'Antigravity OAuth',
    version: '0.1.6-demo',
    plugin_api_major: 1,
    sha256: 'demo-antigravity',
    signature: 'verified-demo',
    status: 'enabled',
    provides: [
      { capability: 'provider_adapter', name: 'Antigravity Adapter' },
      { capability: 'credential_strategy', name: 'Google OAuth' },
      { capability: 'model_source', name: 'Antigravity Models' },
    ],
    integrations: [{
      id: 'antigravity',
      name: 'Antigravity',
      description: 'OAuth-backed Antigravity integration.',
      provider_adapter: 'antigravity-oauth',
      credential_strategy: 'antigravity-oauth',
      auth_flow: 'google-oauth',
      credential_mode: 'auth_flow',
      model_source: 'antigravity-oauth',
      provider: {
        base_url: 'https://daily-cloudcode-pa.googleapis.com',
        wire_format: 'plugin',
        auth_scheme: 'bearer',
        extra_headers: {},
        timeout_ms: 120000,
        capability_mode: 'strict',
        follow_redirects: true,
        credential_hosts: ['accounts.google.com', 'oauth2.googleapis.com'],
      },
    }],
    ui: {
      actions: [{
        id: 'connect',
        label: 'Connect Google account',
        kind: 'auth',
        integration: 'antigravity',
        description: 'Enroll or refresh an Antigravity OAuth credential.',
      }],
      settings: [],
    },
    permissions: {
      network_hosts: ['daily-cloudcode-pa.googleapis.com', 'accounts.google.com', 'oauth2.googleapis.com'],
      credential_scopes: ['antigravity'],
      credential_read: true,
    },
    limits: {
      memory: '64 MiB',
      wall_time_ms: 30000,
      max_outbound_requests: 8,
      max_http_body: '8 MiB',
      storage: 'none',
    },
    routing_facts_mode: 'cached',
    routing_facts_refresh_ms: 300000,
    packages: [],
  },
  {
    id: 'ai-studio',
    name: 'Google AI Studio',
    version: '0.1.0-demo',
    plugin_api_major: 1,
    sha256: 'demo-ai-studio',
    signature: 'verified-demo',
    status: 'enabled',
    provides: [
      { capability: 'provider_adapter', name: 'Gemini Adapter' },
      { capability: 'credential_strategy', name: 'API Key' },
      { capability: 'model_source', name: 'AI Studio Models' },
    ],
    integrations: [{
      id: 'ai-studio',
      name: 'Google AI Studio',
      description: 'Gemini API via user-supplied API key.',
      provider_adapter: 'ai-studio',
      credential_strategy: 'api-key',
      auth_flow: null,
      credential_mode: 'manual',
      model_source: 'ai-studio',
      provider: {
        base_url: 'https://generativelanguage.googleapis.com',
        wire_format: 'gemini',
        auth_scheme: 'custom_header',
        custom_header_name: 'x-goog-api-key',
        extra_headers: {},
        timeout_ms: 120000,
        capability_mode: 'strict',
        follow_redirects: true,
        credential_hosts: ['generativelanguage.googleapis.com'],
      },
    }],
    ui: { actions: [], settings: [] },
    permissions: {
      network_hosts: ['generativelanguage.googleapis.com'],
      credential_scopes: ['ai-studio'],
      credential_read: true,
    },
    limits: {
      memory: '64 MiB',
      wall_time_ms: 30000,
      max_outbound_requests: 8,
      max_http_body: '8 MiB',
      storage: 'none',
    },
    routing_facts_mode: 'cached',
    routing_facts_refresh_ms: 300000,
    packages: [],
  },
  {
    id: 'b-ai',
    name: 'B.AI',
    version: '0.1.0-demo',
    plugin_api_major: 1,
    sha256: 'demo-bai',
    signature: 'verified-demo',
    status: 'enabled',
    provides: [
      { capability: 'provider_adapter', name: 'B.AI Adapter' },
      { capability: 'credential_strategy', name: 'API Key' },
      { capability: 'model_source', name: 'B.AI Models' },
    ],
    integrations: [{
      id: 'b-ai',
      name: 'B.AI',
      description: 'B.AI OpenAI-compatible API.',
      provider_adapter: 'b-ai',
      credential_strategy: 'api-key',
      auth_flow: null,
      credential_mode: 'manual',
      model_source: 'b-ai',
      provider: {
        base_url: 'https://api.b-ai.dev',
        wire_format: 'openai',
        auth_scheme: 'bearer',
        extra_headers: {},
        timeout_ms: 120000,
        capability_mode: 'strict',
        follow_redirects: true,
        credential_hosts: ['api.b-ai.dev'],
      },
    }],
    ui: { actions: [], settings: [] },
    permissions: {
      network_hosts: ['api.b-ai.dev'],
      credential_scopes: ['b-ai'],
      credential_read: true,
    },
    limits: {
      memory: '64 MiB',
      wall_time_ms: 30000,
      max_outbound_requests: 8,
      max_http_body: '8 MiB',
      storage: 'none',
    },
    routing_facts_mode: 'cached',
    routing_facts_refresh_ms: 300000,
    packages: [],
  },
  {
    id: 'opencode-free',
    name: 'OpenCode Free',
    version: '0.1.0-demo',
    plugin_api_major: 1,
    sha256: 'demo-opencode',
    signature: 'verified-demo',
    status: 'enabled',
    provides: [
      { capability: 'provider_adapter', name: 'OpenCode Free Adapter' },
      { capability: 'model_source', name: 'OpenCode Free Models' },
    ],
    integrations: [{
      id: 'opencode-free',
      name: 'OpenCode Free',
      description: 'Credential-free OpenCode integration.',
      provider_adapter: 'opencode-free',
      credential_strategy: null,
      auth_flow: null,
      credential_mode: 'none',
      model_source: 'opencode-free',
      provider: {
        base_url: 'https://opencode.ai',
        wire_format: 'openai',
        auth_scheme: 'bearer',
        extra_headers: {},
        timeout_ms: 120000,
        capability_mode: 'permissive',
        follow_redirects: true,
        credential_hosts: ['opencode.ai'],
      },
    }],
    ui: { actions: [], settings: [] },
    permissions: {
      network_hosts: ['opencode.ai'],
      credential_scopes: [],
      credential_read: false,
    },
    limits: {
      memory: '64 MiB',
      wall_time_ms: 30000,
      max_outbound_requests: 8,
      max_http_body: '8 MiB',
      storage: 'none',
    },
    routing_facts_mode: 'cached',
    routing_facts_refresh_ms: 300000,
    packages: [],
  },
];

const catalogEntry = (plugin: any) => ({
  id: plugin.id,
  name: plugin.name,
  description: `${plugin.name} integration for the standalone Kinetix workbench.`,
  publisher: 'PrightCord',
  official: true,
  homepage: 'https://github.com/PrightCord/kinetix-plugins',
  latest_version: plugin.version,
  artifact_name: `${plugin.id}.kxp`,
  capabilities: plugin.provides.map((item: any) => item.capability),
  installable: true,
  install_ready: true,
  trust_status: 'trusted',
  installed: true,
  installed_version: plugin.version,
  update_available: false,
  distribution: null,
  note: 'Demo catalog entry',
});

const demoClientProfileModels = (keyId: string) => {
  const key: any = keys.find((entry: any) => entry.id === keyId);
  if (!key || key.status !== 'active') return [];
  const grants = Array.isArray(key.allowedModels) ? key.allowedModels : [];
  const routeNames = routes
    .filter((route: any) => route.enabled !== false)
    .map((route: any) => route.name)
    .filter(Boolean);
  const ids = grants.includes('*') ? routeNames : grants;
  return Array.from(new Set(ids)).map((id) => ({ id: String(id) }));
};

const demoShellQuote = (value: string) => "'" + value.replace(/'/g, "'\\''") + "'";

const demoApiKeyFile = (apiKey: string) => ({
  filename: 'kinetix-api-key.sh',
  destination: null,
  content_type: 'text/x-shellscript',
  content: '# Source this file in the shell that starts your client.\nexport KINETIX_API_KEY=' + demoShellQuote(apiKey) + '\n',
});

const demoClientProfileFiles = (client: string, model: string, apiKeyValue?: string) => {
  const trimmed = publicBaseUrl.trim().replace(/\/+$/, '');
  const root = trimmed.endsWith('/v1') ? trimmed.slice(0, -3).replace(/\/+$/, '') : trimmed;
  const openaiBaseUrl = root + '/v1';
  const apiKey = apiKeyValue?.trim() || 'sk-kinetix-<paste-your-key>';

  if (client === 'pi') {
    return [
      {
        filename: 'models.json',
        destination: '~/.pi/agent/models.json',
        content_type: 'application/json',
        content: JSON.stringify({
          providers: {
            kinetix: {
              baseUrl: openaiBaseUrl,
              apiKey: '$KINETIX_API_KEY',
              api: 'openai-completions',
              models: [{ id: model, name: model }],
            },
          },
        }, null, 2),
      },
      {
        filename: 'settings.json',
        destination: '~/.pi/agent/settings.json',
        content_type: 'application/json',
        content: JSON.stringify({ defaultProvider: 'kinetix', defaultModel: model }, null, 2),
      },
      demoApiKeyFile(apiKey),
    ];
  }

  if (client === 'claude_code') {
    return [{
      filename: 'kinetix-claude.sh',
      destination: null,
      content_type: 'text/x-shellscript',
      content: [
        '#!/usr/bin/env bash',
        'set -euo pipefail',
        '',
        'export ANTHROPIC_BASE_URL=' + demoShellQuote(root),
        'export ANTHROPIC_API_KEY=' + demoShellQuote(apiKey),
        "export ANTHROPIC_AUTH_TOKEN=''",
        '',
        'exec claude --model ' + demoShellQuote(model) + ' "$@"',
        '',
      ].join('\n'),
    }];
  }

  if (client === 'codex') {
    const config = [
      'model = ' + JSON.stringify(model),
      'model_provider = "kinetix"',
      '',
      '[model_providers.kinetix]',
      'name = "Kinetix"',
      'base_url = ' + JSON.stringify(openaiBaseUrl),
      'env_key = "KINETIX_API_KEY"',
      'wire_api = "responses"',
      'requires_openai_auth = false',
      '',
    ].join('\n');
    return [
      { filename: 'config.toml', destination: '~/.codex/config.toml', content_type: 'application/toml', content: config },
      demoApiKeyFile(apiKey),
    ];
  }

  return [
    {
      filename: 'opencode.json',
      destination: 'opencode.json',
      content_type: 'application/json',
      content: JSON.stringify({
        $schema: 'https://opencode.ai/config.json',
        model: 'kinetix/default',
        provider: {
          kinetix: {
            name: 'Kinetix',
            npm: '@ai-sdk/openai-compatible',
            options: { baseURL: openaiBaseUrl, apiKey: '{env:KINETIX_API_KEY}' },
            models: { default: { id: model, name: model } },
          },
        },
      }, null, 2),
    },
    demoApiKeyFile(apiKey),
  ];
};

const pluginSettings = new Map<string, any>();

export const DemoKinetix: any = {
  me: () => ok({ authenticated: true, user: 'demo@kinetix.local' }),
  login: (_password: string) => ok({ ok: true, user: 'demo@kinetix.local' }),
  logout: () => ok({ ok: true }),
  changePassword: () => ok({ ok: true, note: 'Demo mode does not persist credentials.' }),

  publicBaseUrl: () =>
    ok({
      public_base_url: publicBaseUrl,
      source: 'dashboard',
      environment_default: 'http://127.0.0.1:20128',
    }),
  updatePublicBaseUrl: (value: string) => {
    publicBaseUrl = value;
    return ok({ ok: true, public_base_url: publicBaseUrl, source: 'dashboard' });
  },

  modelLifecycleSettings: () => ok(clone(lifecycleSettings)),
  updateModelLifecycleSettings: (patch: any) => {
    lifecycleSettings = { ...lifecycleSettings, ...patch };
    return ok({ ok: true, ...clone(lifecycleSettings) });
  },

  exports: () =>
    ok({
      dir: '/var/lib/kinetix/exports (demo)',
      retention_days: 30,
      files: [
        { name: 'usage-2026-09-27.jsonl', day: '2026-09-27', kind: 'jsonl', bytes: 184210 },
        { name: 'usage-2026-09-27.csv', day: '2026-09-27', kind: 'csv', bytes: 72210 },
      ],
      days: [
        { day: '2026-09-27', requests: 11840, tokens: 88200000 },
        { day: '2026-09-26', requests: 10918, tokens: 79100000 },
      ],
    }),
  exportDay: (day?: string) =>
    ok({
      ok: true,
      day: day || '2026-09-27',
      jsonl: 'usage-demo.jsonl',
      csv: 'usage-demo.csv',
    }),
  deleteExport: () => ok({ ok: true }),

  overview: () => ok(clone(INITIAL_METRICS)),

  keys: () => ok(clone(keys)),
  createKey: (body: any) => {
    const key = {
      id: makeId('key'),
      key: 'sk-kinetix-demo-generated',
      name: body.name,
      owner: body.owner,
      tag: body.tag,
      allowedModels: body.allowed_models || ['*'],
      allowedProviders: [],
      rpmLimit: body.rpm_limit || 0,
      tpmLimit: body.tpm_limit || 0,
      dailyBudget: body.daily_budget || 0,
      monthlyBudget: body.monthly_budget || 0,
      currentDailySpend: 0,
      currentMonthlySpend: 0,
      createdAt: new Date().toISOString(),
      expiresAt: null,
      status: 'active',
      allowedIps: [],
      totalRequests: 0,
      totalTokens: 0,
    };
    keys = [key, ...keys];
    return ok({ key: clone(key), fullKey: key.key });
  },
  updateKey: (id: string, patch: any) => {
    keys = keys.map((key: any) =>
      key.id === id
        ? {
            ...key,
            name: patch.name ?? key.name,
            status: patch.status ?? key.status,
            allowedModels: patch.allowed_models ?? key.allowedModels,
            allowedProviders: patch.allowed_providers ?? key.allowedProviders,
            allowedIps: patch.allowed_ips ?? key.allowedIps,
          }
        : key,
    );
    return ok({ ok: true });
  },
  deleteKey: (id: string) => {
    keys = keys.filter((key: any) => key.id !== id);
    return ok({ ok: true });
  },

  clientProfileModels: (keyId: string) => {
    const key: any = keys.find((entry: any) => entry.id === keyId);
    if (!key) return Promise.reject(new Error('Virtual key not found.'));
    if (key.status !== 'active') return Promise.reject(new Error('Virtual key is not active.'));
    return ok({ models: demoClientProfileModels(keyId) });
  },
  generateClientProfile: (body: any) => {
    const key: any = keys.find((entry: any) => entry.id === body.key_id);
    if (!key) return Promise.reject(new Error('Virtual key not found.'));
    if (key.status !== 'active') return Promise.reject(new Error('Virtual key is not active.'));
    const visible = demoClientProfileModels(body.key_id);
    if (!visible.some((entry: any) => entry.id === body.model)) {
      return Promise.reject(new Error('Selected model or Route is not available to this key.'));
    }
    const supplied = typeof body.api_key === 'string' ? body.api_key.trim() : '';
    if (supplied && !supplied.startsWith('sk-kinetix-')) {
      return Promise.reject(new Error('The supplied value is not a Kinetix virtual key.'));
    }
    if (supplied && key.key && supplied !== key.key) {
      return Promise.reject(new Error('The supplied virtual key does not match the selected key.'));
    }
    return ok({
      client: body.client,
      model: body.model,
      public_base_url: publicBaseUrl.replace(/\/+$/, ''),
      files: demoClientProfileFiles(body.client, body.model, supplied || undefined),
    });
  },

  providers: () => ok(clone(providers)),
  createProvider: (body: any) => {
    const provider = {
      id: makeId('prov'),
      name: body.name || 'Demo provider',
      baseUrl: body.base_url || 'https://example.invalid',
      wireFormat: body.wire_format || 'openai',
      authScheme: body.auth_scheme || 'bearer',
      status: 'healthy',
      modelsCount: 0,
      accountsCount: 0,
      timeoutMs: body.timeout_ms || 120000,
      capabilityMode: body.capability_mode || 'permissive',
      followRedirects: body.follow_redirects ?? true,
      credentialHosts: body.credential_hosts || '',
      credentialMode: body.credential_mode || 'manual',
      credentialEnrollment: {
        mode: body.credential_mode || 'manual',
        actionLabel: 'Add credential',
        available: true,
      },
      lastPingMs: 52,
    };
    providers = [...providers, provider];
    return ok({ ok: true, provider: clone(provider) });
  },
  getProvider: (id: string) =>
    ok(clone(providers.find((provider: any) => provider.id === id) || providers[0])),
  updateProvider: (id: string, patch: any) => {
    providers = providers.map((provider: any) =>
      provider.id === id
        ? {
            ...provider,
            name: patch.name ?? provider.name,
            baseUrl: patch.base_url ?? provider.baseUrl,
          }
        : provider,
    );
    return ok({ ok: true });
  },
  deleteProvider: (id: string) => {
    providers = providers.filter((provider: any) => provider.id !== id);
    accounts = accounts.filter((account: any) => account.providerId !== id);
    models = models.filter((model: any) => model.providerId !== id);
    return ok({ ok: true });
  },
  validateProvider: () =>
    ok({
      valid: true,
      problems: [],
      warnings: ['Demo validation: no upstream request was sent.'],
      outbound_security: 'demo',
    }),
  cachedDiscovery: (providerId: string) =>
    ok({
      models: clone(discoveredModels(providerId)),
      disappeared: [],
      lifecycle: lifecycle(),
    }),
  discover: (providerId: string) => ok(clone(discoveredModels(providerId))),
  reconcileProvider: (providerId: string) =>
    ok({
      models: clone(discoveredModels(providerId)),
      disappeared: [],
      lifecycle: lifecycle(),
    }),
  syncProviderPricing: (providerId: string) =>
    ok({
      ok: true,
      updated: models
        .filter((model: any) => model.providerId === providerId)
        .map((model: any) => model.id),
      skipped_manual: [],
      lifecycle: lifecycle(),
    }),
  test: () =>
    ok({
      ok: true,
      status: 200,
      latency_ms: 121,
      response_preview: 'Demo provider test passed.',
    }),

  models: () => ok(clone(models)),
  createModel: (providerId: string, body: any) => {
    const provider = providers.find((item: any) => item.id === providerId);
    models = [
      ...models,
      {
        id: makeId('model'),
        providerId,
        providerName: provider?.name || providerId,
        upstreamModelId: body.upstream_id || body.id || 'demo-model',
        displayName: body.display_name || body.upstream_id || 'Demo model',
        enabled: body.enabled !== false,
        contextWindow: body.context_window ?? null,
        maxOutputTokens: body.max_output_tokens ?? null,
        capabilities: {
          text: body.capabilities?.text ?? true,
          vision: body.capabilities?.vision ?? false,
          reasoning: body.capabilities?.reasoning ?? false,
          toolCalling: body.capabilities?.tool_calling ?? false,
          structuredOutput: body.capabilities?.structured_output ?? false,
          audio: body.capabilities?.audio ?? false,
        },
        prices: {
          inputPer1M: body.prices?.input_per_1m ?? null,
          outputPer1M: body.prices?.output_per_1m ?? null,
          cachedPer1M: body.prices?.cached_per_1m ?? null,
          cacheWritePer1M: body.prices?.cache_write_per_1m ?? null,
          thinkingPer1M: body.prices?.thinking_per_1m ?? null,
        },
        parameters: body.parameters || {},
        thinkingMap: body.thinking_map || { levels: {} },
        transportOverride: body.transport_override || null,
        discovery: {
          reconciliation: {
            status: 'new',
            checked_at: new Date().toISOString(),
            diff: [],
            pinned_fields: [],
          },
        },
      },
    ];
    return ok({ ok: true });
  },
  updateModel: (id: string, patch: any) => {
    models = models.map((model: any) =>
      model.id === id
        ? {
            ...model,
            displayName: patch.display_name ?? model.displayName,
            upstreamModelId: patch.upstream_id ?? model.upstreamModelId,
            enabled: patch.enabled ?? model.enabled,
          }
        : model,
    );
    return ok({ ok: true });
  },
  reconcileModel: (id: string, action: string, fields: string[] = []) => {
    models = models.map((model: any) => {
      if (model.id !== id) return model;
      const reconciliation = clone(model.discovery?.reconciliation || {});
      if (action === 'accept') {
        reconciliation.status = 'accepted';
        reconciliation.diff = (reconciliation.diff || []).filter(
          (diff: any) => !fields.includes(diff.field),
        );
      } else if (action === 'pin') {
        reconciliation.pinned_fields = Array.from(
          new Set([...(reconciliation.pinned_fields || []), ...fields]),
        );
        reconciliation.diff = (reconciliation.diff || []).filter(
          (diff: any) => !fields.includes(diff.field),
        );
        reconciliation.status = reconciliation.diff.length ? 'changed' : 'unchanged';
      } else {
        reconciliation.status = 'ignored';
      }
      return {
        ...model,
        discovery: { ...(model.discovery || {}), reconciliation },
      };
    });
    return ok({ ok: true });
  },
  probeModel: (
    id: string,
    capability: string,
    value?: unknown,
    maxCostUsd?: number,
    accountId?: string,
    transport?: string,
  ) => {
    const model = models.find((item: any) => item.id === id);
    const account =
      accounts.find((item: any) => item.id === accountId) ||
      accounts.find((item: any) => item.providerId === model?.providerId);
    const selectedTransport = transport || model?.transportOverride || 'openai';
    return ok({
      status: 'supported',
      reason: value === undefined
        ? `Demo probe accepted ${capability}.`
        : `Demo probe accepted ${capability}=${String(value)}.`,
      transport: selectedTransport,
      scope: {
        provider_id: model?.providerId || 'demo',
        account_id: account?.id || 'demo',
        model_id: id,
        transport: selectedTransport,
      },
      evidence: {
        status: 'supported',
        verified_at: new Date().toISOString(),
        fresh_until: new Date(Date.now() + lifecycleSettings.probe_freshness_secs * 1000).toISOString(),
        estimated_max_cost_usd: maxCostUsd ?? 0.01,
        detail: 'Synthetic demo verification; no upstream request was sent.',
      },
    });
  },
  deleteModel: (id: string) => {
    models = models.filter((model: any) => model.id !== id);
    return ok({ ok: true });
  },

  validateModel: () =>
    ok({ valid: true, problems: [], warnings: ['Demo validation only.'] }),
  accounts: () => ok(clone(accounts)),
  validateAccount: () => ok({ valid: true, problems: [] }),
  createAccount: (body: any) => {
    const provider = providers.find((item: any) => item.id === body.provider_id);
    accounts = [
      ...accounts,
      {
        id: makeId('acc'),
        providerId: body.provider_id,
        providerName: provider?.name || body.provider_id,
        label: body.label || 'Demo account',
        keyMasked: 'demo••••',
        status: 'healthy',
        quotaType: body.quota_type || 'none',
        softQuotaSpendLimit: body.soft_quota_usd ?? undefined,
        currentSpend: 0,
        requestsCount: 0,
        tokensCount: 0,
        priority: body.priority ?? 100,
        weight: body.weight ?? 100,
      },
    ];
    return ok({ ok: true });
  },
  startProviderCredentialEnrollment: (providerId: string) =>
    ok({
      authorize_url: `#demo-oauth-${providerId}`,
      redirect_uri: 'http://127.0.0.1:20128/admin/api/plugins/auth/callback',
      state: `demo-${providerId}`,
      expires_in_secs: 300,
      manual_callback_supported: true,
    }),
  updateAccount: (id: string, patch: any) => {
    accounts = accounts.map((account: any) =>
      account.id === id
        ? {
            ...account,
            label: patch.label ?? account.label,
            priority: patch.priority ?? account.priority,
            weight: patch.weight ?? account.weight,
          }
        : account,
    );
    return ok({ ok: true });
  },
  deleteAccount: (id: string) => {
    accounts = accounts.filter((account: any) => account.id !== id);
    return ok({ ok: true });
  },
  resetAccount: () => ok({ ok: true }),
  testAccount: () =>
    ok({
      ok: true,
      status: 200,
      latency_ms: 109,
      response_preview: 'Demo account test passed.',
    }),

  routes: () => ok(clone(routes)),
  createRoute: (body: any) => {
    routes = [
      ...routes,
      {
        id: makeId('route'),
        name: body.name,
        description: body.description || '',
        selectionStrategy: body.strategy || 'priority',
        fallbackTriggers: body.fallback_triggers || {
          on429: true,
          onQuota: true,
          on5xx: true,
          onTimeout: true,
        },
        targets: body.targets || [],
        portabilityPolicy: body.portability_policy || 'strip_with_warning',
        cacheAffinity: body.cache_affinity ?? true,
        stickyRouting: body.sticky_routing ?? true,
        totalHops: 0,
        status: 'active',
      },
    ];
    return ok({ ok: true });
  },
  updateRoute: (id: string, patch: any) => {
    routes = routes.map((route: any) =>
      route.id === id
        ? {
            ...route,
            name: patch.name ?? route.name,
            description: patch.description ?? route.description,
            selectionStrategy: patch.strategy ?? route.selectionStrategy,
          }
        : route,
    );
    return ok({ ok: true });
  },
  deleteRoute: (id: string) => {
    routes = routes.filter((route: any) => route.id !== id);
    return ok({ ok: true });
  },
  dryRunRoute: (model: string) =>
    ok({
      model,
      selected: routes.find((route: any) => route.name === model)?.targets?.[0] || null,
      trace: ['demo: alias/route resolution', 'demo: cache affinity', 'demo: adaptive target accepted'],
    }),

  aliases: () => ok(clone(aliases)),
  createAlias: (body: any) => {
    aliases = [
      ...aliases,
      {
        id: makeId('alias'),
        aliasName: body.alias,
        targetType: body.target_type,
        targetId: body.target_id,
        targetDisplayName: body.target_id,
        description: body.description || '',
      },
    ];
    return ok({ ok: true });
  },
  deleteAlias: (id: string) => {
    aliases = aliases.filter((alias: any) => alias.id !== id);
    return ok({ ok: true });
  },

  requests: () => ok(clone(INITIAL_REQUESTS)),
  liveRequests: () =>
    ok(
      INITIAL_REQUESTS.slice(0, 4).map((request: any, index: number) => ({
        requestId: request.requestId,
        keyName: request.virtualKeyName,
        frontend: request.clientFormat,
        requestedModel: request.requestedModel,
        routeName: request.routeName || null,
        phase: index === 0 ? 'streaming' : 'done',
        commitState: request.commitState,
        fallbackHops: request.fallbackHops,
        retryCount: request.retryCount,
        inputTokens: request.inputTokens,
        outputTokens: request.outputTokens,
        status: request.status,
        latencyMs: request.latencyMs,
        ttftMs: request.ttftMs,
        finished: index !== 0,
      })),
    ),

  plugins: () => ok(clone(plugins)),
  pluginCatalog: (params?: { q?: string; capability?: string }) => {
    let entries = plugins.map(catalogEntry);
    if (params?.q) {
      const q = params.q.toLowerCase();
      entries = entries.filter(
        (entry: any) =>
          entry.id.toLowerCase().includes(q) ||
          entry.name.toLowerCase().includes(q) ||
          entry.description.toLowerCase().includes(q),
      );
    }
    if (params?.capability) {
      entries = entries.filter((entry: any) =>
        entry.capabilities.includes(params.capability),
      );
    }
    return ok({ schema_version: 1, plugins: clone(entries) });
  },
  refreshPluginCatalog: () =>
    ok({ schema_version: 1, count: plugins.length, refreshed: true }),
  previewCatalogPlugin: (id: string) => {
    const plugin = plugins.find((item: any) => item.id === id) || plugins[0];
    return ok({
      id: plugin.id,
      name: plugin.name,
      current_version: plugin.version,
      target_version: plugin.version,
      sha256: plugin.sha256,
      signature: 'verified',
      source: 'demo',
      permissions: clone(plugin.permissions),
      permission_diff: {
        network_hosts: { added: [], removed: [] },
        credential_scopes: { added: [], removed: [] },
        credential_read: { from: plugin.permissions.credential_read, to: plugin.permissions.credential_read, changed: false },
      },
      provides: clone(plugin.provides),
    });
  },
  installCatalogPlugin: (id: string) => {
    const plugin = plugins.find((item: any) => item.id === id) || plugins[0];
    return ok({
      id: plugin.id,
      version: plugin.version,
      sha256: plugin.sha256,
      signature: 'verified',
      provides: clone(plugin.provides),
      enabled: true,
      note: 'Demo install completed.',
    });
  },
  plugin: (id: string) =>
    ok(clone(plugins.find((item: any) => item.id === id) || plugins[0])),
  pluginPermissions: (id: string) => {
    const plugin = plugins.find((item: any) => item.id === id) || plugins[0];
    return ok({ id: plugin.id, requested: clone(plugin.permissions), approved: [] });
  },
  pluginSettings: (id: string) => {
    const plugin = plugins.find((item: any) => item.id === id) || plugins[0];
    const existing = pluginSettings.get(plugin.id);
    if (existing) return ok(clone(existing));
    const state = {
      id: plugin.id,
      settings: (plugin.ui?.settings || []).map((setting: any) => ({
        ...setting,
        configured: setting.default != null,
        value: setting.default ?? null,
      })),
    };
    pluginSettings.set(plugin.id, state);
    return ok(clone(state));
  },
  updatePluginSettings: (id: string, values: Record<string, unknown>) => {
    const current = pluginSettings.get(id) || { id, settings: [] };
    current.settings = current.settings.map((setting: any) => ({
      ...setting,
      value: values[setting.key] ?? setting.value,
      configured: values[setting.key] !== undefined || setting.configured,
    }));
    pluginSettings.set(id, current);
    return ok(clone(current));
  },
  installPlugin: () => {
    const plugin = plugins[0];
    return ok({
      id: plugin.id,
      version: plugin.version,
      sha256: plugin.sha256,
      signature: 'verified',
      provides: clone(plugin.provides),
      enabled: true,
    });
  },
  setupPluginIntegrationProvider: (pluginId: string, integrationId: string) => {
    const plugin = plugins.find((item: any) => item.id === pluginId);
    const integration = plugin?.integrations?.find((item: any) => item.id === integrationId);
    return ok({
      id: providers.find((item: any) => item.sourcePluginId === pluginId)?.id || `prov-${pluginId}`,
      name: integration?.name || plugin?.name || pluginId,
      created: false,
    });
  },
  startPluginAuth: (_pluginId: string, _flowName: string, providerId: string) =>
    ok({
      authorize_url: `#demo-plugin-auth-${providerId}`,
      redirect_uri: 'http://127.0.0.1:20128/admin/api/plugins/auth/callback',
      state: `demo-state-${providerId}`,
      expires_in_secs: 300,
      manual_callback_supported: true,
    }),
  completePluginAuth: () => ok({ ok: true, result: 'completed', provider_id: 'prov-antigravity' }),
  pluginAuthStatus: () => ok({ result: 'completed', provider_id: 'prov-antigravity' }),
  approvePluginPermissions: (id: string) => ok({ ok: true, id, approved: [] }),
  revokePluginPermission: (id: string, permission: string) =>
    ok({ ok: true, id, revoked: permission, enabled: true }),
  enablePlugin: (id: string) => ok({ ok: true, id, enabled: true }),
  disablePlugin: (id: string) => ok({ ok: true, id, enabled: false }),
  validatePlugin: (id: string) => {
    const plugin = plugins.find((item: any) => item.id === id) || plugins[0];
    return ok({ ok: true, id: plugin.id, provides: clone(plugin.provides) });
  },
  previewPluginRollback: (id: string, sha256: string) => {
    const plugin = plugins.find((item: any) => item.id === id) || plugins[0];
    return ok({
      id: plugin.id,
      current_version: plugin.version,
      target_version: plugin.version,
      package_sha256: sha256,
      signature: 'verified',
      source: 'demo',
      permissions: clone(plugin.permissions),
      permission_diff: {
        network_hosts: { added: [], removed: [] },
        credential_scopes: { added: [], removed: [] },
        credential_read: { from: plugin.permissions.credential_read, to: plugin.permissions.credential_read, changed: false },
      },
      provides: clone(plugin.provides),
    });
  },
  rollbackPlugin: (id: string) => {
    const plugin = plugins.find((item: any) => item.id === id) || plugins[0];
    return ok({
      id: plugin.id,
      version: plugin.version,
      sha256: plugin.sha256,
      signature: 'verified',
      provides: clone(plugin.provides),
      enabled: true,
    });
  },
  reinstallPluginPackage: (id: string) => {
    const plugin = plugins.find((item: any) => item.id === id) || plugins[0];
    return ok({
      id: plugin.id,
      version: plugin.version,
      sha256: plugin.sha256,
      signature: 'verified',
      provides: clone(plugin.provides),
      enabled: true,
    });
  },
  removePlugin: (id: string) => ok({ ok: true, id }),

  audit: () => ok(clone(INITIAL_AUDIT_LOGS)),
};
