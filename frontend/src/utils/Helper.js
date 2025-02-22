export const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    })
      .format(amount)
      .replace(/^(\D+)/, "₹");
  };

  export const roundToTwo = (num) => {
    return Math.round((num + Number.EPSILON) * 100) / 100;
  };  