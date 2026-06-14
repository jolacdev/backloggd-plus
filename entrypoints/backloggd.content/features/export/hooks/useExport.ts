/* eslint-disable perfectionist/sort-objects */
import { StatusFiltersState } from '@globalShared/hooks/useStatusFilters';

import { ExportPhase, ExportProgress } from '../types';
import useGameDetails from './useGameDetails';
import useProfileGames from './useProfileGames';

type UseExportProps = {
  username: string;
};

// Resolve the export lifecycle phase by priority (highest first).
const resolvePhase = ({
  areDetailsComplete,
  areProfilePagesReady,
  hasProfileError,
  isExportEnabled,
  isProfileEmpty,
}: {
  areDetailsComplete: boolean;
  areProfilePagesReady: boolean;
  hasProfileError: boolean;
  isExportEnabled: boolean;
  isProfileEmpty: boolean;
}): ExportPhase => {
  if (!isExportEnabled) return 'idle';
  if (hasProfileError) return 'error';
  // No games to export also resolves as complete; the dialog surfaces the empty result.
  if (areDetailsComplete || isProfileEmpty) return 'complete';
  if (areProfilePagesReady) return 'exporting'; // Pages resolved -> fetching details.
  return 'analyzing';
};

const useExport = ({ username }: UseExportProps) => {
  const [isExportEnabled, setIsExportEnabled] = useState(false);
  const [selectedStatuses, setSelectedStatuses] =
    useState<StatusFiltersState>(); // Default `undefined` to rely on the truthiness of the object to check if the filters have been set.

  // Stages 1 and 2: resolve the full list of games to export.
  const profilePagesData = useProfileGames({
    username,
    selectedStatuses,
    enabled: isExportEnabled && !!selectedStatuses,
  });

  // Stage 3: fetch each game's details sequentially, gated on the game list.
  const gameDetailsData = useGameDetails({
    profileGames: profilePagesData.games,
    enabled: profilePagesData.isReady,
  });

  // Single source of truth for the export lifecycle.
  const phase = resolvePhase({
    isExportEnabled,
    hasProfileError: profilePagesData.isError,
    areDetailsComplete: gameDetailsData.isComplete,
    areProfilePagesReady: profilePagesData.isReady,
    isProfileEmpty: profilePagesData.isEmpty,
  });

  const progress: ExportProgress = {
    phase,
    current: gameDetailsData.settledCount,
    total: gameDetailsData.total,
  };

  const fetchData = (selectedFilters: StatusFiltersState) => {
    // Prevent fetching if username has no value.
    if (!username) return;

    gameDetailsData.reset(); // Reset sequential index at the start of a new fetch.

    if (!isExportEnabled) {
      setSelectedStatuses(selectedFilters);
      setIsExportEnabled(true);
    }
  };

  return {
    fetchData,
    gameDetails: gameDetailsData.details,
    isExportEnabled,
    isComplete: phase === 'complete',
    isError: phase === 'error',
    progress,
  };
};

export default useExport;
