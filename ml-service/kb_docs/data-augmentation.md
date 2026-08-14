---
title: Data augmentation
type: concept
category: ml
---

# Data augmentation

Data augmentation expands a training set by creating modified copies of existing
examples through label-preserving transformations, so a model sees more variation
without new data collection. It is a standard regularizer that improves
generalization and reduces overfitting, and it is especially useful when labeled
data is scarce or class-imbalanced.

The transformations are domain-specific. In computer vision they include flips,
crops, rotations, color jitter, and mixing methods such as Mixup and CutMix. In
natural language processing they include synonym replacement, back-translation
(translating text to another language and back), and paraphrasing with a language
model. In audio they include time-stretching, pitch shifting, and adding background
noise. More recently, generative models are used to synthesize entirely new training
examples, and automated pipelines such as AutoAugment learn which augmentation
policies work best for a given dataset.

Data augmentation matters because it is a cheap, widely applicable way to make models
more robust to real-world variation and is a core ingredient of self-supervised and
contrastive learning, where two augmented views of the same input are pulled together
in representation space. The main caveat is that augmentations must preserve the label
and stay realistic — overly aggressive transforms can distort meaning and hurt
accuracy.
