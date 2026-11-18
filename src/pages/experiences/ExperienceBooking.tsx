import { Navigate, useParams } from 'react-router-dom';

/** Keep existing booking links, but all experience requests now go to myUNO. */
export default function ExperienceBooking() {
  const { id } = useParams<{ id: string }>();
  return <Navigate replace to={id ? `/experiences/${encodeURIComponent(id)}?inquiry=1` : '/experiences'} />;
}
