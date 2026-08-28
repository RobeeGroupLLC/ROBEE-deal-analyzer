# Robee Group Deal Analyzer

A mobile-first real estate lead manager and wholesale deal calculator for Robee Group LLC. The first version is a dependency-free browser application that stores properties and comparable sales locally on the device.

## Run locally

```bash
npm start
```

Open `http://localhost:4173`. Data is persisted in the browser's `localStorage`. Use **Add property** to create a lead, click a dashboard card to edit it, and use **Add comparable** within the property workspace to build an ARV estimate.

## Deal calculation assumptions

- **Buyer target purchase price** = ARV × (1 − target profit margin)
- **Maximum Allowable Offer (MAO)** = buyer target purchase price − rehab − closing/holding costs
- **Recommended contract price** = MAO − assignment fee
- **Recommended opening offer** = 90% of recommended contract price
- **End buyer purchase price** = recommended contract price + assignment fee
- **Estimated buyer profit** = ARV − end buyer purchase price − rehab − closing/holding costs
- **Buyer ROI** = buyer profit ÷ (end buyer price + rehab + closing/holding costs)
- **Comp-estimated ARV** = average comp price per square foot × subject square footage (or average sold price when subject square footage is unavailable)

The calculator is an acquisition-screening aid, not an appraisal or financial advice. Browser-local storage is intended for a first working version; hosted authentication and a shared database are sensible next steps.
