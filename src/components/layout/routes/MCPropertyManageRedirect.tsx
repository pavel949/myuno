import { Navigate, useLocation, useParams } from 'react-router-dom';

/** Keep legacy bookmarks inside the canonical property editor and existing MC scope. */
export const MCPropertyManageRedirect = () => {
  const { id } = useParams();
  const { search, hash, state } = useLocation();
  return <Navigate replace to={{ pathname: id ? `/mc/properties/${encodeURIComponent(id)}/editor` : '/mc/properties', search, hash }} state={state} />;
};

