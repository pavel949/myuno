import React from 'react';
import { Navigate } from 'react-router-dom';

// VendorOrders redirects to VendorBookings - they are the same page
const VendorOrders = () => {
  return <Navigate to="/vendor/bookings" replace />;
};

export default VendorOrders;
