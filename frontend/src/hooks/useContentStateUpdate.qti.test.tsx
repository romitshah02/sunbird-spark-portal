import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useQueryClient } from '@tanstack/react-query';
import { useContentStateUpdate } from './useContentStateUpdate';
import userAuthInfoService from '../services/userAuthInfoService/userAuthInfoService';

const mockMutateAsync = vi.fn().mockResolvedValue(undefined);

const { mockUseQuery } = vi.hoisted(() => ({
  mockUseQuery: vi.fn(() => ({
    data: { uid: 'user_1', sid: 'session_1', isAuthenticated: true },
    isLoading: false,
    error: null,
  })),
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: vi.fn(),
  useQuery: mockUseQuery,
}));

vi.mock('./useBatch', () => ({
  useContentStateUpdateMutation: vi.fn(() => ({ mutateAsync: mockMutateAsync })),
}));

vi.mock('../services/userAuthInfoService/userAuthInfoService', () => ({
  default: { getUserId: vi.fn() },
}));

describe('useContentStateUpdate — QTI (mimeType)', () => {
  const mockInvalidateQueries = vi.fn().mockResolvedValue(undefined);
  const mockQueryClient = { invalidateQueries: mockInvalidateQueries };

  const qtiParams = {
    collectionId: 'course_1',
    contentId: 'content_1',
    effectiveBatchId: 'batch_1',
    isEnrolledInCurrentBatch: true,
    mimeType: 'application/vnd.ekstep.qti-archive',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue({
      data: { uid: 'user_1', sid: 'session_1', isAuthenticated: true },
      isLoading: false,
      error: null,
    });
    (useQueryClient as ReturnType<typeof vi.fn>).mockReturnValue(mockQueryClient);
    (userAuthInfoService.getUserId as ReturnType<typeof vi.fn>).mockReturnValue('user_1');
  });

  it('sends accumulated ASSESS events and completes on SUMMARY', async () => {
    const { result } = renderHook(() =>
      useContentStateUpdate({ ...qtiParams, currentContentStatus: 1 })
    );
    result.current({ eid: 'START', ets: 1700000000000 });
    result.current({
      eid: 'ASSESS',
      edata: { score: 1, item: { id: 'ITEM1' }, pass: 'Yes', resvalues: [], duration: 5 },
    } as Parameters<ReturnType<typeof useContentStateUpdate>>[0]);
    result.current({
      eid: 'ASSESS',
      edata: { score: 0, item: { id: 'ITEM2' }, pass: 'No', resvalues: [], duration: 3 },
    } as Parameters<ReturnType<typeof useContentStateUpdate>>[0]);
    result.current({ eid: 'END', edata: {} } as Parameters<ReturnType<typeof useContentStateUpdate>>[0]);
    result.current({ eid: 'SUMMARY', edata: {} } as Parameters<ReturnType<typeof useContentStateUpdate>>[0]);

    await vi.waitFor(() => {
      // Call 0 is START's status:1 PATCH; call 1 is SUMMARY's assessment send.
      expect(mockMutateAsync).toHaveBeenCalledTimes(2);
    });
    const call = mockMutateAsync.mock.calls[1]?.[0] as
      | {
          contents: { status: number }[];
          assessments?: { events: { edata: { score: number } }[] }[];
        }
      | undefined;
    expect(call?.contents).toEqual([
      expect.objectContaining({ contentId: 'content_1', status: 2 }),
    ]);
    expect(call?.assessments?.[0]?.events).toHaveLength(2);
    expect(call?.assessments?.[0]?.events.map((e) => e.edata.score)).toEqual([1, 0]);
  });

  it('does not send an assessment on SUMMARY when maxAttemptsExceeded is true', async () => {
    const { result } = renderHook(() =>
      useContentStateUpdate({ ...qtiParams, currentContentStatus: 1, maxAttemptsExceeded: true })
    );
    result.current({ eid: 'START', ets: 1700000000000 });
    result.current({
      eid: 'ASSESS',
      edata: { score: 1, item: { id: 'ITEM1' }, pass: 'Yes', resvalues: [], duration: 5 },
    } as Parameters<ReturnType<typeof useContentStateUpdate>>[0]);
    result.current({ eid: 'SUMMARY', edata: {} } as Parameters<ReturnType<typeof useContentStateUpdate>>[0]);

    // Only START's own status:1 PATCH should have fired - no assessment send.
    await vi.waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledTimes(1);
    });
    expect(mockMutateAsync.mock.calls[0]?.[0]?.assessments).toBeUndefined();
  });

  it('does not send a duplicate assessment if SUMMARY fires twice', async () => {
    const { result } = renderHook(() =>
      useContentStateUpdate({ ...qtiParams, currentContentStatus: 1 })
    );
    result.current({ eid: 'START', ets: 1700000000000 });
    result.current({
      eid: 'ASSESS',
      edata: { score: 1, item: { id: 'ITEM1' }, pass: 'Yes', resvalues: [], duration: 5 },
    } as Parameters<ReturnType<typeof useContentStateUpdate>>[0]);
    result.current({ eid: 'SUMMARY', edata: {} } as Parameters<ReturnType<typeof useContentStateUpdate>>[0]);
    result.current({ eid: 'SUMMARY', edata: {} } as Parameters<ReturnType<typeof useContentStateUpdate>>[0]);

    await vi.waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledTimes(2);
    });
    // Give any spurious extra call a chance to show up before asserting the final count.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mockMutateAsync).toHaveBeenCalledTimes(2);
  });
});