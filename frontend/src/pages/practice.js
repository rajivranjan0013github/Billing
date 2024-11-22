 const calculateQuantityValue = (qty, conversionRate) => {
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
const t = calculateQuantityValue('2:1', 10).toFixed(3);
console.log(t);
console.log(typeof t);

  