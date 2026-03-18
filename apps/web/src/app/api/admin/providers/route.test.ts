import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockDetectAvailableProviders = vi.fn();

vi.mock('@/lib/scraper/ai-registry', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/scraper/ai-registry')>();
  return {
    ...actual,
    detectAvailableProviders: () => mockDetectAvailableProviders(),
  };
});

import { GET } from './route';

describe('GET /api/admin/providers', () => {
  const savedEnv: Record<string, string | undefined> = {};

  beforeEach(() => {
    vi.clearAllMocks();
    savedEnv.SELF_HOSTED = process.env.SELF_HOSTED;
    delete process.env.SELF_HOSTED;
  });

  afterEach(() => {
    if (savedEnv.SELF_HOSTED === undefined) delete process.env.SELF_HOSTED;
    else process.env.SELF_HOSTED = savedEnv.SELF_HOSTED;
  });

  it('marks available providers as ready', async () => {
    mockDetectAvailableProviders.mockResolvedValue(['anthropic', 'openai']);

    const res = await GET();
    const body = await res.json();

    expect(body.ok).toBe(true);
    expect(body.data.anthropic.status).toBe('ready');
    expect(body.data.openai.status).toBe('ready');
  });

  it('marks API-key providers without keys as no_key', async () => {
    mockDetectAvailableProviders.mockResolvedValue([]);

    const res = await GET();
    const body = await res.json();

    expect(body.data.anthropic.status).toBe('no_key');
    expect(body.data.openai.status).toBe('no_key');
    expect(body.data.google.status).toBe('no_key');
  });

  it('marks CLI providers as not_installed when unavailable', async () => {
    mockDetectAvailableProviders.mockResolvedValue([]);

    const res = await GET();
    const body = await res.json();

    expect(body.data['claude-code'].status).toBe('not_installed');
    expect(body.data.codex.status).toBe('not_installed');
  });

  it('marks local providers as unreachable when SELF_HOSTED=true but not available', async () => {
    process.env.SELF_HOSTED = 'true';
    mockDetectAvailableProviders.mockResolvedValue([]);

    const res = await GET();
    const body = await res.json();

    expect(body.data.ollama.status).toBe('unreachable');
    expect(body.data.llamacpp.status).toBe('unreachable');
    expect(body.data.vllm.status).toBe('unreachable');
  });

  it('marks local providers as not_installed when SELF_HOSTED is not set', async () => {
    mockDetectAvailableProviders.mockResolvedValue([]);

    const res = await GET();
    const body = await res.json();

    expect(body.data.ollama.status).toBe('not_installed');
    expect(body.data.llamacpp.status).toBe('not_installed');
    expect(body.data.vllm.status).toBe('not_installed');
  });

  it('marks local providers as ready when available', async () => {
    process.env.SELF_HOSTED = 'true';
    mockDetectAvailableProviders.mockResolvedValue(['ollama', 'vllm']);

    const res = await GET();
    const body = await res.json();

    expect(body.data.ollama.status).toBe('ready');
    expect(body.data.vllm.status).toBe('ready');
    expect(body.data.llamacpp.status).toBe('unreachable');
  });

  it('includes displayName and models for every provider', async () => {
    mockDetectAvailableProviders.mockResolvedValue([]);

    const res = await GET();
    const body = await res.json();

    for (const [, provider] of Object.entries(body.data)) {
      const p = provider as { displayName: string; models: string[] };
      expect(p.displayName).toBeTruthy();
      expect(Array.isArray(p.models)).toBe(true);
    }
  });
});
