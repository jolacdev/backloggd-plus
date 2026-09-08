import { subscribeToPageChanges } from '@content/shared/utils/navigation';
import { isProfileGamesPage } from '@content/shared/utils/url';

/**
 * Backloggd navigates without full page loads, so the route is state rather than a
 * one-time read — this is what lets the badge layer mount once and decide for itself.
 */
const useIsProfileGamesPage = () => {
  const [isLibraryPage, setIsLibraryPage] = useState(isProfileGamesPage);

  useEffect(
    () =>
      subscribeToPageChanges(() => {
        setIsLibraryPage(isProfileGamesPage());
      }),
    [],
  );

  return isLibraryPage;
};

export default useIsProfileGamesPage;
