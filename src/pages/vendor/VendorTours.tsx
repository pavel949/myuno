import { Navigate } from 'react-router-dom';

// VendorTours is consolidated into VendorExperiences
// This component only exists as a fallback redirect
const VendorTours = () => {
  return <Navigate to="/vendor/experiences" replace />;
};

export default VendorTours;
