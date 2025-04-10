const roundToTwo = (num) => {
    return Math.round((num + Number.EPSILON) * 100) / 100;
  };

  const p = roundToTwo(-5);

  console.log(p);
  