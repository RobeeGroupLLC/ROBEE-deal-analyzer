(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.DealMath = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const number = value => Number(value) || 0;

  function calculateDeal(deal) {
    const arv = number(deal.arv);
    const margin = number(deal.margin) / 100;
    const rehab = number(deal.rehab);
    const costs = number(deal.costs);
    const assignment = number(deal.assignment);
    const buyerTarget = arv * (1 - margin);
    const mao = buyerTarget - rehab - costs;
    const contractPrice = mao - assignment;
    const openingOffer = contractPrice * 0.9;
    const endBuyerPrice = contractPrice + assignment;
    const buyerProfit = arv - endBuyerPrice - rehab - costs;
    const investment = endBuyerPrice + rehab + costs;
    const roi = investment > 0 ? buyerProfit / investment * 100 : 0;
    return { arv, buyerTarget, rehab, costs, mao, contractPrice, openingOffer, assignment, endBuyerPrice, buyerProfit, roi };
  }

  function estimateArv(comps, squareFeet) {
    const valid = (comps || []).filter(comp => number(comp.soldPrice) > 0);
    if (!valid.length) return 0;
    const ppsf = valid.map(comp => number(comp.ppsf) || (number(comp.squareFeet) ? number(comp.soldPrice) / number(comp.squareFeet) : 0)).filter(Boolean);
    if (number(squareFeet) > 0 && ppsf.length) return ppsf.reduce((a, b) => a + b, 0) / ppsf.length * number(squareFeet);
    return valid.reduce((sum, comp) => sum + number(comp.soldPrice), 0) / valid.length;
  }

  return { calculateDeal, estimateArv };
});
