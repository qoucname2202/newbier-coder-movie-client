// Helper function to check if payment/subscription request was sent successfully
export const checkPaymentSent = async (userId) => {
  try {
    const response = await fetch('/api/subscription/check-pending-for-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId })
    });
    
    const data = await response.json();
    return data.hasPending;
  } catch (error) {
    console.error("Không thể kiểm tra trạng thái đăng ký:", error);
    return false;
  }
};

export const isSuccessfulSubscription = (response) => {
  if (!response) return false;
  
  const hasSuccess = !!response.success;
  const hasSubscription = !!response.subscription;
  const hasPackage = !!response.package;
  const hasPayment = !!response.payment;
  
  return hasSuccess || hasSubscription || hasPackage || hasPayment;
};

// Helper function to get a comparable string ID from various forms of package identifiers
const getComparableId = (value) => {
  if (value === null || typeof value === 'undefined') {
    return null;
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'object') {
    if (typeof value._id !== 'undefined' && value._id !== null) {
      return String(value._id);
    }
    if (typeof value.id !== 'undefined' && value.id !== null) {
      return String(value.id);
    }
    return String(value);
  }
  return String(value);
};

/**
 * Utility function to check if a package is the currently active subscription.
 * Handles both object and string IDs by converting to string before comparison.
 * Uses the improved getComparableId helper function.
 */
export const isCurrentSubscribedPackage = (pkg, subscription) => {
  if (!pkg || typeof pkg._id === 'undefined' || pkg._id === null) {
    console.error("[isCurrentSubscribedPackage] Invalid pkg object or missing/null pkg._id", pkg);
    return false;
  }
  if (!subscription || !subscription.hasActiveSubscription || !subscription.subscription) {
    return false;
  }

  const packageIdFromSubscription = subscription.subscription.packageId;
  if (packageIdFromSubscription === null || typeof packageIdFromSubscription === 'undefined') {
    return false;
  }

  const subscriptionPackageId = getComparableId(packageIdFromSubscription);
  const packageId = getComparableId(pkg._id);
  
  const nameMatch = pkg.name && 
                   typeof packageIdFromSubscription === 'object' &&
                   packageIdFromSubscription !== null &&
                   packageIdFromSubscription.name === pkg.name;
  
  return subscriptionPackageId === packageId || nameMatch;
};

/**
 * Utility function to check if a package is pending approval
 * Uses the improved getComparableId helper function.
 */
export const isPendingSubscribedPackage = (pkg, pendingSubscription) => {
  if (!pkg || typeof pkg._id === 'undefined' || pkg._id === null) {
    console.error("[isPendingSubscribedPackage] Invalid pkg object or missing/null pkg._id", pkg);
    return false;
  }
  if (!pendingSubscription || !pendingSubscription.hasPendingSubscription || !pendingSubscription.pendingSubscription) {
    return false;
  }

  const packageIdFromPendingSub = pendingSubscription.pendingSubscription.packageId;
  if (packageIdFromPendingSub === null || typeof packageIdFromPendingSub === 'undefined') {
    return false;
  }

  const pendingSubscriptionPackageId = getComparableId(packageIdFromPendingSub);
  const packageId = getComparableId(pkg._id);
  
  const nameMatch = pkg.name && 
                   typeof packageIdFromPendingSub === 'object' &&
                   packageIdFromPendingSub !== null &&
                   packageIdFromPendingSub.name === pkg.name;
  
  return pendingSubscriptionPackageId === packageId || nameMatch;
};
