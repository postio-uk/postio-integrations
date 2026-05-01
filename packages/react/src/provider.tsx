"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import { Postio } from "@postio/core";

interface PostioContextValue {
  client: Postio;
  apiKey: string;
}

const PostioContext = createContext<PostioContextValue | null>(null);

export interface PostioProviderProps {
  apiKey: string;
  baseUrl?: string;
  /**
   * Pass your own client to override the default. Useful for tests or for
   * sharing a single client across providers.
   */
  client?: Postio;
  children: ReactNode;
}

/**
 * Wrap your tree with `<PostioProvider>` once. If you already have a
 * TanStack `QueryClientProvider` higher up, we use yours; otherwise we
 * mount a fresh QueryClient internally so the hooks Just Work.
 */
export function PostioProvider({
  apiKey,
  baseUrl,
  client,
  children,
}: PostioProviderProps) {
  // useQueryClient throws when there is no surrounding provider, so we
  // probe via try/catch — but we want to keep hook order stable, so we
  // call it via a wrapper.
  const existingQueryClient = useTryQueryClient();
  const [fallbackClient] = useState(() => new QueryClient());

  const value = useMemo<PostioContextValue>(() => {
    const ctor = client ?? new Postio({ apiKey, ...(baseUrl ? { baseUrl } : {}) });
    return { client: ctor, apiKey };
  }, [apiKey, baseUrl, client]);

  const inner = (
    <PostioContext.Provider value={value}>{children}</PostioContext.Provider>
  );

  if (existingQueryClient) return inner;
  return (
    <QueryClientProvider client={fallbackClient}>{inner}</QueryClientProvider>
  );
}

function useTryQueryClient(): QueryClient | null {
  try {
    return useQueryClient();
  } catch {
    return null;
  }
}

export function usePostioContext(): PostioContextValue {
  const ctx = useContext(PostioContext);
  if (!ctx) {
    throw new Error(
      "@postio/react: hook used outside <PostioProvider>. Wrap your tree with <PostioProvider apiKey=... />.",
    );
  }
  return ctx;
}

export function usePostio(): Postio {
  return usePostioContext().client;
}
