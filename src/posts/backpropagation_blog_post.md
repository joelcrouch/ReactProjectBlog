---
title: Understanding Backpropagation: A Deep Dive into Neural Network Learning
date: 2025-07-10
summary: Trying to understand the Rumerlhart paper
---


# Understanding Backpropagation: A Deep Dive into Neural Network Learning

*Demystifying the foundational algorithm that powers modern AI*

---

If you've ever wondered how artificial neural networks actually learn, you've come to the right place. Today I am diving deep into backpropagation—the algorithm that makes it possible for machines to recognize faces, translate languages, and beat humans at complex games. This post will walk you through the core concepts using the seminal 1986 paper "Learning Representations by Back-Propagating Errors" by Rumelhart, Hinton, and Williams.  It is a core paper in ML/AI.  Not too complicated.

## What Exactly Is Backpropagation?

At its heart, backpropagation is an elegant solution to a fundamental problem: how do you teach a complex network of interconnected nodes to produce the output you want?

Think of it as a sophisticated trial-and-error process with mathematical precision. The network makes a prediction, measures how wrong it was, then systematically adjusts every connection to get closer to the right answer. I like to think it is like tuning a massive, multi-dimensional instrument where every knob affects the final sound or finding just the right key to make a mix in-you gotta try out a bunch. But the actual algorithm is a little more precise than my ears that have been abused over the years.

## The Forward Pass: Information Flows Forward

Before we can understand backpropagation, we need to understand how information flows through a neural network in the forward direction.

### The Basic Calculation
(Aside-please pardon the math tooling, i am currently too lazy to setup a LaTeX document
to make this prettier)
For any unit (node) j in the network, the total input it receives is:

```
x_j = Σ(y_i × w_ji)
```

Where:
- `y_i` is the output of unit i (connected to unit j)
- `w_ji` is the weight of the connection from unit i to unit j
- `x_j` is the weighted sum of all inputs to unit j

This weighted sum then gets passed through a sigmoid function to produce the unit's output:

```
y_j = σ(x_j) = 1/(1 + e^(-x_j))
```

### A Simple Example

Let's trace through a tiny network with concrete numbers:

**Network:** 2 inputs → 2 hidden units → 1 output

**Input:** [0.5, 0.8]
**Target:** 0.7

**Weights (input to hidden):**
- Input 1 to Hidden 1: 0.2
- Input 1 to Hidden 2: 0.4
- Input 2 to Hidden 1: 0.3
- Input 2 to Hidden 2: 0.1

**Step 1: Calculate Hidden Layer**
- Hidden 1: x₁ = (0.5 × 0.2) + (0.8 × 0.3) = 0.34 → y₁ = σ(0.34) = 0.584
- Hidden 2: x₂ = (0.5 × 0.4) + (0.8 × 0.1) = 0.28 → y₂ = σ(0.28) = 0.570

**Step 2: Calculate Output**
With hidden-to-output weights of 0.6 and 0.5:
- Output: x_out = (0.584 × 0.6) + (0.570 × 0.5) = 0.635 → y_out = σ(0.635) = 0.654

**Step 3: Calculate Error**
- Target: 0.7
- Actual: 0.654
- Error: 0.046

The network is close, but not perfect. This is where backpropagation comes in.

## The Backward Pass: Learning from Mistakes

Now comes the clever part. Backpropagation calculates how much each weight contributed to the final error and adjusts them accordingly.

### The Mathematical Foundation

The key insight is using the chain rule of calculus to compute partial derivatives. For each weight w_ji, we calculate:

```
∂E/∂w_ji = ∂E/∂y_j × ∂y_j/∂x_j × ∂x_j/∂w_ji
```

This tells us: "If I change this weight by a tiny amount, how much does the total error change?"

### The Weight Update Rule

Once we have the gradient (partial derivative), we update each weight:

```
new_weight = old_weight - (learning_rate × gradient)
```

The learning rate controls how big steps we take. Too big, and we might overshoot; too small, and learning crawls.

## The Iterative Process: Gradual Improvement

Here's the crucial insight that many people miss: **backpropagation doesn't solve the problem in one step**. Instead, it's an iterative process:

1. **Forward pass:** Calculate outputs with current weights
2. **Calculate error:** Compare to desired output
3. **Backward pass:** Calculate gradients for all weights
4. **Update weights:** Adjust every weight slightly
5. **Repeat:** Until error is acceptably small

This might take hundreds, thousands, or even millions of iterations. Each iteration moves the network a little closer to the desired behavior.

### Why So Many Iterations?

Think of it like learning to hit a target with a bow and arrow:
- After each shot, you adjust your aim slightly
- You don't expect to hit the bullseye on the first try
- Each adjustment is small to avoid overcorrection
- Gradually, your accuracy improves

## The Overshoot Problem

What happens when the learning rate is too high? The network can overshoot the target and start oscillating or even diverging away from the solution.

**Signs of overshooting:**
- Error bounces up and down instead of steadily decreasing
- Network performance gets worse instead of better
- Training becomes unstable

**Solutions:**
- Reduce the learning rate  => super important, don't just concentrate on weights and inputs, this term and tuning it will make your world change.
- Use adaptive learning rates that decrease over time
- Add momentum to smooth out the updates

## Momentum: The Improved Version

The original paper discusses an enhancement called momentum, which helps stabilize training:

```
Δw_ji(t) = -ε × ∂E/∂w_ji + α × Δw_ji(t-1)  (1)
```

This adds "memory" to the weight updates:
- `ε` is the learning rate
- `α` is the momentum coefficient (0 to 1)
- `Δw_ji(t-1)` is the previous weight change

Momentum helps the network:
- Smooth out oscillations
- Accelerate in consistent directions
- Escape small local minima

It's like adding inertia to your weight updates—if you've been consistently moving in one direction, you keep some of that momentum going.  This actually makes way more sense than all the rest, and really cemented to me how it works.  Here is my $0.2:

Here is the sequence:

Forward pass first: Calculate outputs through the entire network
Compare with desired output: Calculate the total error
Then backpropagate: Calculate partial derivatives for each edge based on that error
Update weights: Apply the momentum equation (gradient + previous change) to each edge
Repeat: Next iteration starts with forward pass using the new weights

The key point: You don't compare with the desired output during the weight update step. The comparison happens first (to calculate the error), then that error information gets propagated backwards through the network to determine how much each individual weight contributed to that error.
So it's more like:

Forward pass → Compare to target → Calculate all gradients → Update all weights → Repeat

The partial derivatives for each edge are calculated based on how that specific edge contributed to the final error you measured at the output.

## Every Connection Matters

One important detail: **every single weight in the network gets updated in each iteration**. For a network with thousands of connections, that's thousands of partial derivatives being calculated and thousands of weight updates happening simultaneously.

This is why:
- Training neural networks is computationally expensive
- GPUs are essential for large networks
- The learning process affects the entire network, not just individual parts

## When to Stop: The Convergence Question

Unlike solving a math equation, neural network training doesn't have a single "correct" answer. So when do you stop?

**Common stopping criteria:**
- **Error threshold:** Stop when error < 0.01
- **Validation performance:** Stop when performance on test data stops improving
- **Diminishing returns:** Stop when error reduction becomes negligible
- **Time limits:** Stop after a fixed number of iterations or training time

**Industry standards vary widely:**
- Medical diagnosis, stocks, cost vs time, so there is no one answer for how close the result vector needs to be to the desired vector.

## Conclusion Why is this paper so important?
### The Core Problem It Solved

Before 1986: Training multi-layer neural networks was essentially impossible. People knew that single-layer networks (perceptrons) were too limited, but nobody had figured out how to efficiently train deeper networks. This was called the "credit assignment problem" - how do you know which weights in the middle layers are responsible for the final error?

The breakthrough: Rumelhart, Hinton, and Williams provided the mathematical framework to systematically train networks with hidden layers using gradient descent.
Why This Was Revolutionary

1. Made Deep Learning Possible

    Without backpropagation, we'd still be stuck with shallow networks
    This algorithm scales to networks with dozens or hundreds of layers
    Every modern deep learning architecture (CNNs, RNNs, Transformers) depends on this foundation

2. Provided Mathematical Rigor

    Before this, neural network training was mostly heuristic and ad-hoc
    Backpropagation gave the field a principled, mathematically sound approach
    It connected neural networks to well-established optimization theory

3. Demonstrated Learning Complex Representations

    The paper showed that hidden layers could learn meaningful internal representations
    This was crucial for tasks like image recognition, language processing, and pattern recognition
    It proved that networks could discover hierarchical features automatically

### Historical Impact

The AI Winter Context:

    The 1970s-80s was a period of AI pessimism
    Many researchers had given up on neural networks
    This paper helped revive the field by showing neural networks could actually learn complex tasks

Empirical Success:

    The paper included compelling examples (like the family tree relationships)
    It wasn't just theory - it showed real learning on real problems
    This convinced skeptics that the approach was viable

Direct Lineage to Modern AI

Everything traces back to this paper:

    Computer Vision: CNNs use backpropagation to learn visual features
    Natural Language Processing: Modern language models (GPT, BERT) are trained with backpropagation
    Game AI: AlphaGo, chess engines, and game-playing AIs all use this algorithm
    Recommendation Systems: Netflix, Amazon, and social media algorithms
    Autonomous Vehicles: Self-driving cars rely on neural networks trained with backpropagation

### The Three Key Insights

1. Differentiable Programming: The idea that you can automatically compute gradients through complex computational graphs became the foundation of modern deep learning frameworks (TensorFlow, PyTorch).

2. End-to-End Learning: Instead of hand-crafting features, you can learn representations directly from raw data. This eliminated the need for extensive feature engineering in many domains.

3. Scalable Optimization: The algorithm works regardless of network size, making it possible to train networks with millions or billions of parameters.
Why Hinton, LeCun, and Bengio Won the Turing Award

Geoffrey Hinton (co-author of this paper) shared the 2018 Turing Award specifically for work related to deep learning. This 1986 paper was central to that recognition because it:

    Launched the modern era of neural networks
    Provided the mathematical foundation for deep learning
    Enabled the AI revolution we're experiencing today

The Ripple Effect

Academic Impact:

    Thousands of papers build directly on this work
    Entire research fields (deep learning, representation learning) emerged from it
    It's one of the most cited papers in computer science

Industrial Impact:

    Enabled the creation of trillion-dollar AI companies
    Powers the technology behind Google search, Facebook's news feed, Amazon's recommendations
    Made possible the current AI boom in everything from healthcare to finance

What Makes It Timeless

Unlike many technical papers that become obsolete, this one remains relevant because:

    The mathematical principles are fundamental and universal
    The algorithm is still used in virtually every modern neural network
    The insights about learning representations continue to guide research

Bottom Line: This paper didn't just solve a technical problem - it unlocked an entire field of study and enabled the AI technologies that define our modern world. Without backpropagation, we wouldn't have smartphones that recognize speech, cars that drive themselves, or AI systems that can generate art and write code.  You can argue wether those are good things or not, but they do exist because of this paper.

References:
1. These slides were very helpful in helping me to understand the paper: https://cepdnaclk.github.io/co542-neural-networks-reading-group-e15/slides/03.pdf  

And of course:
2. Rumelhart, D. E., Hinton, G. E., & Williams, R. J. (1986). Learning representations by back-propagating errors. Nature, 323(6088), 533-536. https://doi.org/10.1038/323533a0