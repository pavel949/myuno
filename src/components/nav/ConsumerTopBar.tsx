import { ConsumerHeader } from './ConsumerHeader';
import { useTopBarSearch } from './useTopBarSearch';

export function ConsumerTopBar() {
  const { openSearch, searchDialog } = useTopBarSearch(true);

  return (
    <>
      <ConsumerHeader onSearch={openSearch} />
      {searchDialog}
    </>
  );
}
