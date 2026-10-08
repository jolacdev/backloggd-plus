import { useQuery, useQueryClient } from '@tanstack/react-query';

import { resolveHltbGame } from './api';
import { RegisteredCard } from './useGameCards';

/** Resolve nearby cards, pausing retries offscreen and stopping after a settled match. */
const useHltbGame = (card: RegisteredCard, revision: number) => {
  const [isNear, setIsNear] = useState(false);
  const queryClient = useQueryClient();
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => setIsNear(entries.some((entry) => entry.isIntersecting)),
      { rootMargin: '200px' },
    );
    observer.observe(card.element);
    return () => observer.disconnect();
  }, [card.element]);

  const { data } = useQuery({
    enabled: isNear,
    gcTime: 5 * 60 * 1000,
    queryKey: ['hltbResolution', revision, card.meta.igdbId],
    retry: false,
    queryFn: async () => await resolveHltbGame(card.meta, queryClient),
    refetchInterval: (query) =>
      query.state.data?.status === 'unavailable'
        ? Math.max(query.state.data.retryAt - Date.now(), 1000)
        : false,
    refetchOnReconnect: (query) => query.state.data?.status === 'unavailable',
    refetchOnWindowFocus: (query) => query.state.data?.status === 'unavailable',
    staleTime: (query) =>
      query.state.data?.status === 'unavailable'
        ? Math.max(query.state.data.retryAt - query.state.dataUpdatedAt, 0)
        : Infinity,
  });
  return data;
};

export default useHltbGame;
