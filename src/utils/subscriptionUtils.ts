/**
 * subscriptionUtils.ts
 *
 * Utility functions that check the subscription and the payment state.
 */
import { apiUrl } from '@/config/apiPaths';
import authService from '@/API/services/authService';

/**
 * Checks whether the user has a pending payment request.
 *
 * @param userId - The id of the user to check.
 * @returns true when a pending request exists, false otherwise.
 */
export const checkPaymentSent = async (_userId: string): Promise<boolean> => {
  // /subscription/current endpoint is removed per user request (not in use)
  return false;
};

/**
 * Checks whether a response describes a successful subscription.
 *
 * @param response - The API response to inspect.
 * @returns true when the response contains any success marker.
 */
export const isSuccessfulSubscription = (response: Record<string, unknown> | null): boolean => {
  if (!response) return false;

  const hasSuccess = !!response.success;
  const hasSubscription = !!response.subscription;
  const hasPackage = !!response.package;
  const hasPayment = !!response.payment;

  return hasSuccess || hasSubscription || hasPackage || hasPayment;
};

/**
 * Reads an identifier that can be compared, whatever shape it has.
 *
 * @param value - The identifier to normalize. It can be a string, an object
 *                with an `_id` or `id` field, or any other value.
 * @returns The identifier as a string, or null when the value is empty.
 */
const getComparableId = (value: unknown): string | null => {
  if (value === null || typeof value === 'undefined') return null;

  if (typeof value === 'string') return value;

  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (obj._id !== undefined && obj._id !== null) return String(obj._id);
    if (obj.id !== undefined && obj.id !== null) return String(obj.id);
    return String(value);
  }

  return String(value);
};

interface PackageItem {
  _id?: string | null;
  name?: string;
}

interface SubscriptionItem {
  hasActiveSubscription?: boolean;
  subscription?: {
    packageId?: unknown;
    name?: string;
  };
  hasPendingSubscription?: boolean;
  pendingSubscription?: {
    packageId?: unknown;
    name?: string;
  };
}

/**
 * Checks whether the package is the one of the active subscription.
 *
 * @param pkg - The package to compare.
 * @param subscription - The current subscription state.
 * @returns true when the package is the subscribed one.
 */
export const isCurrentSubscribedPackage = (pkg: PackageItem, subscription: SubscriptionItem): boolean => {
  if (!pkg || pkg._id === undefined || pkg._id === null) {

    return false;
  }
  if (!subscription || !subscription.hasActiveSubscription || !subscription.subscription) {
    return false;
  }

  const packageIdFromSubscription = subscription.subscription.packageId;
  if (packageIdFromSubscription === null || packageIdFromSubscription === undefined) {
    return false;
  }

  const subscriptionPackageId = getComparableId(packageIdFromSubscription);
  const packageId = getComparableId(pkg._id);

  const nameMatch =
    pkg.name &&
    typeof packageIdFromSubscription === 'object' &&
    packageIdFromSubscription !== null &&
    (packageIdFromSubscription as Record<string, unknown>).name === pkg.name;

  return subscriptionPackageId === packageId || !!nameMatch;
};

/**
 * Checks whether the package is waiting for approval.
 *
 * @param pkg - The package to compare.
 * @param pendingSubscription - The pending subscription state.
 * @returns true when the package is the one waiting for approval.
 */
export const isPendingSubscribedPackage = (pkg: PackageItem, pendingSubscription: SubscriptionItem): boolean => {
  if (!pkg || pkg._id === undefined || pkg._id === null) {

    return false;
  }
  if (!pendingSubscription || !pendingSubscription.hasPendingSubscription || !pendingSubscription.pendingSubscription) {
    return false;
  }

  const packageIdFromPendingSub = pendingSubscription.pendingSubscription.packageId;
  if (packageIdFromPendingSub === null || packageIdFromPendingSub === undefined) {
    return false;
  }

  const pendingSubscriptionPackageId = getComparableId(packageIdFromPendingSub);
  const packageId = getComparableId(pkg._id);

  const nameMatch =
    pkg.name &&
    typeof packageIdFromPendingSub === 'object' &&
    packageIdFromPendingSub !== null &&
    (packageIdFromPendingSub as Record<string, unknown>).name === pkg.name;

  return pendingSubscriptionPackageId === packageId || !!nameMatch;
};

export default {
  checkPaymentSent,
  isSuccessfulSubscription,
  isCurrentSubscribedPackage,
  isPendingSubscribedPackage
};
