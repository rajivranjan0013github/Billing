//function for displaying quantity in primary and secondary units
export const formatQuantityDisplay = (quantity, unit, secondary_unit, showOnlyPrimary = false) => {
  if (!secondary_unit) {
    return `${quantity} ${unit}`;
  }

  const conversionRate = secondary_unit.conversion_rate;
  const primaryQty = Math.floor(quantity); // Get whole number part
  const remainingInSecondary = Math.round((quantity - primaryQty) * conversionRate);

  // If there's a remainder in secondary units, show both
  if (remainingInSecondary > 0) {
    if (showOnlyPrimary) {
      return `${primaryQty}:${remainingInSecondary} ${unit}`;
    }
    return `${primaryQty} ${unit} : ${remainingInSecondary} ${secondary_unit.unit}`;
  }
  // If it divides evenly, just show primary
  return `${primaryQty} ${unit}`;
};

export const calculateQuantityValue = (qty, conversionRate) => {
  if (!qty) return 0;
  const formattedQty = qty.split(":").map(Number);
  let value = 0;
  if (formattedQty.length === 1) {
    value = formattedQty[0];
  } else {
    value = formattedQty[0] + formattedQty[1] / conversionRate;
  }
  return value.toFixed(3);
};