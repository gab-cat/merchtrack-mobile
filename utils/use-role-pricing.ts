interface RolePricingInput {
    variant: {
      price: number | string;
      rolePricing: Record<string, number>;
    };
    customerRole: string | null;
    customerCollege: string | null;
    productPostedByCollege: string | null;
  }
  
  interface RolePricingResult {
    price: number;
    appliedRole: string;
    formattedPrice: string;
    originalPrice?: string;
    isRange?: boolean;
  }
  
export function useRolePricing({
  variant,
  customerRole,
  customerCollege,
  productPostedByCollege
}: RolePricingInput): RolePricingResult {
  // Check if variant has valid data
  if (!variant || variant.price === undefined || variant.price === null) {
    return {
      price: 0,
      appliedRole: "OTHERS",
      formattedPrice: "₱0.00",
      originalPrice: "₱0.00"
    };
  }
  
  // Convert price to number if it's a string
  const basePrice = typeof variant.price === 'string' ? parseFloat(variant.price) : variant.price;
  
  // Verify that basePrice is a valid number
  const validBasePrice = isNaN(basePrice) ? 0 : basePrice;
    
  // Default to the base price and "OTHERS" role
  let finalPrice = validBasePrice;
  let appliedRole = "OTHERS";
  
  // If customer has no role or college, use other pricing
  if (!customerRole || !customerCollege || !productPostedByCollege) {
    return {
      price: finalPrice,
      appliedRole,
      formattedPrice: `₱${finalPrice.toFixed(2)}`,
      originalPrice: `₱${validBasePrice.toFixed(2)}`
    };
  }
  
  // Make sure rolePricing exists
  const rolePricing = variant.rolePricing || {};
  
  // Check if customer's college matches the product's college
  const isFromSameCollege = customerCollege === productPostedByCollege;
  
  // If from different college, use other pricing
  if (!isFromSameCollege) {
    // Look for OTHERS role pricing or fallback to base price
    finalPrice = rolePricing["OTHERS"] ?? validBasePrice;
    appliedRole = "OTHERS";
  } else {
    // If from same college, use role-specific pricing
    const roleSpecificPrice = rolePricing[customerRole];
    if (roleSpecificPrice !== undefined) {
      finalPrice = roleSpecificPrice;
      appliedRole = customerRole;
    }
  }
  
  // Ensure final price is a valid number
  finalPrice = isNaN(finalPrice) ? validBasePrice : finalPrice;
  
  return {
    price: finalPrice,
    appliedRole,
    formattedPrice: `₱${finalPrice.toFixed(2)}`,
    originalPrice: finalPrice !== validBasePrice ? `₱${validBasePrice.toFixed(2)}` : undefined
  };
}