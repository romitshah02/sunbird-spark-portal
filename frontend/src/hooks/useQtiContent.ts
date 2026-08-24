import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { buildRunnerConfig } from 'test-qti-player-web-component-react/config';
import type { ContentData } from '@/types/contentTypes';

interface UseQtiContentOptions {
  enabled?: boolean;
}

/**
 * Hook for fetching and processing QTI content data.
 *
 */
export const useQtiContent = (
  content: ContentData | undefined,
  options?: UseQtiContentOptions
): UseQueryResult<ContentData, Error> => {
  const enabled = options?.enabled ?? true;

  return useQuery({
    queryKey: ['qti', 'content', content?.identifier],
    enabled: enabled && Boolean(content?.identifier),
    queryFn: async () => {
      const runnerConfig = await buildRunnerConfig(content!.identifier, content!);
      return { ...content, ...runnerConfig } as ContentData;
    },
  });
};