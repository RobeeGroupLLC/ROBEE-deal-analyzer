const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateDeal, estimateArv } = require('./calculations');

test('calculates the wholesale deal waterfall', () => {
  const result = calculateDeal({ arv: 300000, margin: 25, rehab: 40000, costs: 10000, assignment: 15000 });
  assert.equal(result.buyerTarget, 225000);
  assert.equal(result.mao, 175000);
  assert.equal(result.contractPrice, 160000);
  assert.equal(result.openingOffer, 144000);
  assert.equal(result.endBuyerPrice, 175000);
  assert.equal(result.buyerProfit, 75000);
});

test('estimates ARV from average comp price per square foot', () => {
  const estimate = estimateArv([{ soldPrice: 200000, squareFeet: 1000 }, { soldPrice: 330000, squareFeet: 1500 }], 1200);
  assert.equal(estimate, 252000);
});

test('falls back to average sold price without subject square footage', () => {
  assert.equal(estimateArv([{ soldPrice: 200000 }, { soldPrice: 300000 }], 0), 250000);
});
