---
title: Active learning
type: concept
category: ml
---

# Active learning

Active learning is a machine learning strategy in which the model itself chooses
which unlabeled examples a human should annotate next, rather than labeling data at
random. The goal is to reach a target accuracy with far fewer labels by focusing
annotation effort on the most informative points. This makes it especially valuable
in domains where raw data is plentiful but expert labeling is slow or expensive —
medical imaging, legal text, low-resource languages, and scientific datasets.

Common query strategies include uncertainty sampling (label the examples the model
is least confident about, e.g. closest to a decision boundary), query-by-committee
(label points where an ensemble of models disagrees most), and diversity- or
density-based methods that avoid picking redundant, clustered examples. These are
often combined, and modern deep active learning adds batch-aware acquisition so a
whole batch of diverse, informative examples is selected per labeling round.

Active learning matters because labeling is frequently the dominant cost of a
supervised project, and smarter selection can cut that cost several-fold. Its main
risks are sampling bias — the labeled set drifts away from the true data
distribution — and the overhead of repeated model retraining between rounds, so it
is usually paired with careful evaluation on a held-out random test set.
