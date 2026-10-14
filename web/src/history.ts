import { useInfiniteQuery } from "@tanstack/react-query";
import { useRuntime } from "./data";
import type { Runtime } from "./config";
import type { Address, Hex } from "viem";

export type HistoryEvent = {
  eventName: string;
  args: Record<string, unknown>;
  blockNumber: bigint;
  logIndex: number;
  transactionHash: Hex;
};
async function range(
  r: Runtime,
  eventName: string,
  args: Record<string, unknown>,
  fromBlock: bigint,
  toBlock: bigint,
): Promise<HistoryEvent[]> {
  try {
    return (await r.client.getContractEvents({
      address: r.weir.address,
      abi: r.weir.abi,
      eventName,
      args,
      fromBlock,
      toBlock,
      strict: true,
    })) as unknown as HistoryEvent[];
  } catch (e) {
    // Public endpoints can impose different block-range limits. Split only range/size errors.
    if (
      toBlock - fromBlock < 500n ||
      !/range|limit|too many|response size/i.test(String(e))
    )
      throw e;
    const middle = (fromBlock + toBlock) / 2n;
    return [
      ...(await range(r, eventName, args, fromBlock, middle)),
      ...(await range(r, eventName, args, middle + 1n, toBlock)),
    ];
  }
}
export function useCreatedEvents(account?: Address) {
  const r = useRuntime();
  return useInfiniteQuery({
    queryKey: ["created-events", account],
    initialPageParam: undefined as bigint | undefined,
    enabled: !!account,
    staleTime: 15_000,
    queryFn: async ({ pageParam }) => {
      const to = pageParam ?? (await r.client.getBlockNumber());
      const from = to - 49_999n > r.fromBlock ? to - 49_999n : r.fromBlock;
      const events: HistoryEvent[] = [];
      for (let start = from; start <= to; start += 10_000n) {
        const end = start + 9999n < to ? start + 9999n : to;
        const [client, recipient] = await Promise.all([
          range(r, "StreamCreated", { client: account }, start, end),
          range(r, "StreamCreated", { recipient: account }, start, end),
        ]);
        events.push(...client, ...recipient);
      }
      return { events, from, to };
    },
    getNextPageParam: (last) =>
      last.from > r.fromBlock ? last.from - 1n : undefined,
  });
}
export function useStreamEvents(id: bigint) {
  const r = useRuntime();
  return useInfiniteQuery({
    queryKey: ["stream-events", id.toString()],
    initialPageParam: undefined as bigint | undefined,
    staleTime: 15_000,
    queryFn: async ({ pageParam }) => {
      const to = pageParam ?? (await r.client.getBlockNumber());
      const from = to - 49_999n > r.fromBlock ? to - 49_999n : r.fromBlock;
      const events: HistoryEvent[] = [];
      // All ordinary stream events place the stream ID in indexed topic 1.
      for (let start = from; start <= to; start += 10_000n) {
        const end = start + 9999n < to ? start + 9999n : to;
        const logs = (await r.client.getContractEvents({
          address: r.weir.address,
          abi: r.weir.abi,
          fromBlock: start,
          toBlock: end,
          strict: true,
        })) as unknown as HistoryEvent[];
        events.push(
          ...logs.filter(
            (log) => log.args.id === id || log.args.streamId === id,
          ),
        );
      }
      return { events, from, to };
    },
    getNextPageParam: (last) =>
      last.from > r.fromBlock ? last.from - 1n : undefined,
  });
}
