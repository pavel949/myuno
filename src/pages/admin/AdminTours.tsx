import { Navigate } from 'react-router-dom';

// AdminTours is consolidated into AdminExperiences
// This component only exists as a fallback redirect
export default function AdminTours() {
  return <Navigate to="/admin/experiences" replace />;
}
