import { Navigate, useLocation, useParams } from 'react-router-dom';
import { APP_ROUTES } from '@/lib/config/routes';

/** Keep legacy booking links pointed at the existing experience request flow. */
export default function ExperienceBooking() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  if (!id) return <Navigate replace to={APP_ROUTES.EXPERIENCES} />;

  const search = new URLSearchParams(location.search);
  search.set('inquiry', '1');
  return (
    <Navigate
      replace
      to={{ pathname: `${APP_ROUTES.EXPERIENCES}/${encodeURIComponent(id)}`, search: search.toString() }}
      state={location.state}
    />
  );
}
