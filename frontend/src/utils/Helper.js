export const formatCurrency = (amount) => {
    const formattedAmount = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    })
      .format(Math.abs(amount))
      .replace(/^(\D+)/, "₹");
    
    return amount < 0 ? `-${formattedAmount}` : formattedAmount;
  };

  export const roundToTwo = (num) => {
    return Math.round((num + Number.EPSILON) * 100) / 100;
  };  