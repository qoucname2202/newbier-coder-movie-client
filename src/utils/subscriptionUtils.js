// Hàm helper để kiểm tra xem đăng ký đã được gửi thành công hay chưa,
// bất kể kết quả từ API hoặc lỗi
export const checkPaymentSent = async (userId) => {
  try {
    // Kiểm tra backend xem có đăng ký nào chờ duyệt không
    const response = await fetch('/api/subscription/check-pending-for-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId })
    });
    
    const data = await response.json();
    
    // Nếu có đăng ký chờ duyệt, coi như đã gửi thành công
    return data.hasPending;
  } catch (error) {
    console.error("Không thể kiểm tra trạng thái đăng ký:", error);
    return false;
  }
};

// Hỗ trợ các đối tượng response để xác định thành công thực sự
export const isSuccessfulSubscription = (response) => {
  if (!response) return false;
  
  // Kiểm tra các trường dữ liệu cần thiết cho một đăng ký thành công
  const hasSuccess = !!response.success;
  const hasSubscription = !!response.subscription;
  const hasPackage = !!response.package;
  const hasPayment = !!response.payment;
  
  // Ghi log debug
  console.log("Kiểm tra phản hồi đăng ký:", {
    hasSuccess, hasSubscription, hasPackage, hasPayment
  });
  
  // Coi là thành công nếu có ít nhất một trong các trường
  return hasSuccess || hasSubscription || hasPackage || hasPayment;
};

// Helper function to get a comparable string ID from various forms of package identifiers
const getComparableId = (value) => {
  // console.log('[getComparableId] Input:', value, 'Type:', typeof value);
  if (value === null || typeof value === 'undefined') {
    // console.log('[getComparableId] Returning null for null/undefined input');
    return null;
  }
  // If value is already a string, use it directly
  if (typeof value === 'string') {
    // console.log('[getComparableId] Returning string value directly:', value);
    return value;
  }
  // If value is an object (could be a Mongoose document or an ObjectId)
  if (typeof value === 'object') {
    // If it has an _id property (likely a Mongoose document)
    if (typeof value._id !== 'undefined' && value._id !== null) {
      // console.log('[getComparableId] Returning String(value._id):', String(value._id));
      return String(value._id);
    }
    // If it has an id property 
    if (typeof value.id !== 'undefined' && value.id !== null) {
      return String(value.id);
    }
    // Otherwise, assume the object itself is an ObjectId or can be stringified to its ID
    // console.log('[getComparableId] Returning String(value) for object:', String(value));
    return String(value);
  }
  // Fallback for other types (e.g., numbers, though not expected for IDs)
  // console.log('[getComparableId] Returning String(value) for other type:', String(value));
  return String(value);
};

/**
 * Utility function to check if a package is the currently active subscription.
 * Handles both object and string IDs by converting to string before comparison.
 * Uses the improved getComparableId helper function.
 */
export const isCurrentSubscribedPackage = (pkg, subscription) => {
  // Detailed logging for debugging
  console.log(`[isCurrentSubscribedPackage] Package: ${pkg?.name}, ID: ${pkg?._id}, 
  Subscription data:`, JSON.stringify(subscription, null, 2));

  // Basic validation checks
  if (!pkg || typeof pkg._id === 'undefined' || pkg._id === null) {
    console.error("[isCurrentSubscribedPackage] Invalid pkg object or missing/null pkg._id", pkg);
    return false;
  }
  if (!subscription || !subscription.hasActiveSubscription || !subscription.subscription) {
    console.log("[isCurrentSubscribedPackage] No active subscription details or missing subscription object", subscription);
    return false;
  }

  const packageIdFromSubscription = subscription.subscription.packageId;
  if (packageIdFromSubscription === null || typeof packageIdFromSubscription === 'undefined') {
    console.log("[isCurrentSubscribedPackage] No packageId found in current subscription object", subscription.subscription);
    return false;
  }

  // Get comparable IDs
  const subscriptionPackageId = getComparableId(packageIdFromSubscription);
  const packageId = getComparableId(pkg._id);
  
  // Also try matching by name if available (as a fallback)
  const nameMatch = pkg.name && 
                   typeof packageIdFromSubscription === 'object' &&
                   packageIdFromSubscription !== null &&
                   packageIdFromSubscription.name === pkg.name;
  
  // Enhanced logging for better debugging
  console.log("PACKAGE COMPARISON:", {
    packageName: pkg.name,
    extractedPackageId: packageId,
    extractedSubscriptionPackageId: subscriptionPackageId,
    areEqual: subscriptionPackageId === packageId,
    nameMatch: nameMatch,
    originalSubscriptionPackageId: packageIdFromSubscription,
    originalPackageId: pkg._id
  });
  
  // Return true if either the IDs match or the names match (as a fallback)
  return subscriptionPackageId === packageId || nameMatch;
};

/**
 * Utility function to check if a package is pending approval
 * Uses the improved getComparableId helper function.
 */
export const isPendingSubscribedPackage = (pkg, pendingSubscription) => {
  // Detailed logging for debugging
  console.log(`[isPendingSubscribedPackage] Package: ${pkg?.name}, ID: ${pkg?._id}, 
  PendingSubscription data:`, JSON.stringify(pendingSubscription, null, 2));

  // Basic validation checks
  if (!pkg || typeof pkg._id === 'undefined' || pkg._id === null) {
    console.error("[isPendingSubscribedPackage] Invalid pkg object or missing/null pkg._id", pkg);
    return false;
  }
  if (!pendingSubscription || !pendingSubscription.hasPendingSubscription || !pendingSubscription.pendingSubscription) {
    console.log("[isPendingSubscribedPackage] No pending subscription details or missing pendingSubscription object", pendingSubscription);
    return false;
  }

  const packageIdFromPendingSub = pendingSubscription.pendingSubscription.packageId;
  if (packageIdFromPendingSub === null || typeof packageIdFromPendingSub === 'undefined') {
    console.log("[isPendingSubscribedPackage] No packageId found in pending subscription object", pendingSubscription.pendingSubscription);
    return false;
  }

  // Get comparable IDs
  const pendingSubscriptionPackageId = getComparableId(packageIdFromPendingSub);
  const packageId = getComparableId(pkg._id);
  
  // Also try matching by name if available (as a fallback)
  const nameMatch = pkg.name && 
                   typeof packageIdFromPendingSub === 'object' &&
                   packageIdFromPendingSub !== null &&
                   packageIdFromPendingSub.name === pkg.name;
  
  // Enhanced logging for better debugging
  console.log("PENDING PACKAGE COMPARISON:", {
    packageName: pkg.name,
    extractedPackageId: packageId,
    extractedPendingSubscriptionPackageId: pendingSubscriptionPackageId,
    areEqual: pendingSubscriptionPackageId === packageId,
    nameMatch: nameMatch,
    originalPendingSubscriptionPackageId: packageIdFromPendingSub,
    originalPackageId: pkg._id
  });
  
  // Return true if either the IDs match or the names match (as a fallback)
  return pendingSubscriptionPackageId === packageId || nameMatch;
};
