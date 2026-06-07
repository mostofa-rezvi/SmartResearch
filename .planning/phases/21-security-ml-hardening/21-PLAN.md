# Phase 21: Security ML Hardening - SBERT Threshold Calibration Plan

## Context
The FastAPI ML service currently recommends the top 20 users regardless of their Reciprocal Rank Fusion (RRF) or cosine similarity score. To prevent low-quality matches, we need to calibrate an SBERT similarity threshold using an offline evaluation.

## Execution Plan

### Step 1: Create Offline Evaluation Script
- **File**: `ml-service/scripts/calibrate.py`
- **Objective**: Determine a reasonable cutoff score to filter out low-quality recommendations.
- **Approach**:
  1. Fetch sample researcher profiles from the database (`researcher_profiles`).
  2. Fetch "known good pairs" from the database (users participating in the same project via `project_members`).
  3. Generate a set of "random pairs" of the same size.
  4. Generate SBERT embeddings using `ml_model.py`.
  5. Calculate SBERT cosine similarity for all pairs.
  6. Plot an ASCII histogram of the score distribution for both groups.
  7. Set the threshold at the 15th percentile of the "known good pairs" (so 85% of known good pairs pass the threshold).

### Step 2: Run Calibration
- Execute `calibrate.py` within the `ml-service` virtual environment.
- Note the computed threshold and the separation in the histograms.

### Step 3: Implement Threshold in ML Service
- **File**: `ml-service/main.py`
- **Logic**:
  - Read `RECOMMENDATION_THRESHOLD` from the environment (defaulting to the calibrated value).
  - Filter `hybrid_results` where the RRF score `>= THRESHOLD`.
  - Check the length of `final_results`. If `< 5`, fall back to padding with popular researchers from the database.

## Verification
- The calibration script should show a visible separation between good pairs (high scores) and random pairs (low scores).
- `main.py` must correctly filter results and gracefully fall back to database popularity if strict ML matches aren't found.
