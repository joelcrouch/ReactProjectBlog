---
title: "Whats a vector anyways?"
date: 2026-03-28
summary: Vectors and matrices are the language every ML model is written in. Learn the dot product, matrix multiplication, and the one equation that explains every neural network layer — no chalkboard required.
---
#  Post 1: What's a vector anyways?

## Vectors, matrices, and why are they everywhere in ML

##  What's a vector anyways?
Your linear algebra book will describe vectors in a much more formal method, but for just this once, forget about all the arrows on a chalkboard, magnitude, force-all that.  Goodbye. I already forgot already.  

In ML a vector is just a list of numbers that describes something.  

It can describe a house [1400, 3, 2, 1987], with square footage, bedrooms, bathrooms, year built.  The sklearn python book that I learned from (maybe this one:    Hands-on-Machine-Learning-with-Scikit-Learn-Keras-and-TensorFlow) had a rental example in NYC, that described location, rent cost, square footage, beds, baths ...[longitude, latitude, 7999, 1000, 1, 0] (dont live there!).  Both of these are vectors. Every row in your training data is a vector. Every model's prediction is a vector.  The weights of a neural network layer are packed into vectors.  So you gotta understand vectors at a basic level to do ML/data science.

If you have a vector, you can math that vector.  You can measure how similar two things are. You can transform a vector into another vector.  Math is magic. (expellius vectoriaaaa!)  That is the name of the game. 

### MATHING
#### Dot product: measuring similarity

Given two vectors **a** and **b**, the dot product is:

**a · b = a₁b₁ + a₂b₂ + ... + aₙbₙ**   

So what does that even mean? Lets do a little example.  Imagine you are rating how much you care about two things in a movie: action and romance:  (I love them both: True Lies. Say no more) But lets say your taste in movies as a viewer could be expressed as a vector: 

YOU: [8, 2] : love action, meh on romance

Movie A(action film), say Predator "Git to dee choppah!"  [9,1] 

Movie B(romance film),say "I’m just a girl, standing in front of a boy, asking him to love her" Notting Hill [2,9]

Compute the dot product for each:

You · Movie A=(8x9)+(2x1)=72+2=74

You · Movie B=(8x2) +(2x9)= 16+18=34

That number (74 vs 34) tells you that movie A is the better recomendation.  No complex logic, just multiply element-by-element and sum.  It is how NetFlix does it's recomendation.  **KISS**.

The pattern is always the same: paired features get multiplied together (action × action, romance × romance), then everything gets summed into one score. Features where both vectors are high contribute a lot. Features where one is low contribute almost nothing. The result captures overall alignment in a single number.

Multiply element-by-element, then sum. That's it. What does it tell you? How much the two vectors "point in the same direction." If the result is large and positive, they're similar. If it's near zero, they're unrelated. If it's negative, they're opposite.

This is literally how recomendation systems work. Netflix probably uses an algorithm like this to suggest your next movie. Your user preference vector dotted with an item vector gives you a relevance score. It's how attention in transformers works — queries and keys are dotted together to decide what to focus on.  

#### Matrix multiplication: transformation in one shot

A matrix is essentially a stack of vectors, but when you multiply a matrix by a vector, you get a transformation.

**W · x = y**  
Where **x** is your input vector, **W** is a matrix of weights, and **y** is the output. Every linear layer in a neural network is this operation. You're taking your input and rotating, stretching, and projecting it into a new space.
The canonical equation is y=mx +b, but lets keep it even simpler.

The rule: to multiply a (m × n) matrix by a vector of length n, you compute the dot product of each row of the matrix with the input vector. The result is a vector of length m.

Let's do a simple example

```
    [1 0 2            [1         [3 
     0 3 1]         ·  2    =     7]
 w(2X3 weights)        1]
                    x(input)   y(ouput)


```
Each output value is just a dot product of one row of W with the input. This is the fundamental computation inside every dense layer of a neural network, every time.

**The three things that matter for ML**

These are the linear algebra moves you'll encounter constantly:

1. **Vectors as data points.** Your dataset is a matrix: each row is one observation, each column is one feature. Shape: (n_samples × n_features). Every sklearn fit(X, y) call takes this.

2. **Matrix multiplication as learned transformation.**
 A neural network layer is y = W·x + b. The weights W are learned. The bias b shifts the output. Stack enough of these and you can approximate any function — that's the universal approximation theorem in one sentence.

3. **Dot product as similarity.** Cosine similarity between two vectors is their dot product divided by the product of their magnitudes. Used in: word embeddings, semantic search, attention mechanisms, recommendation engines, image retrieval.

**The one equation to remember**

If someone asks you in an interview to describe what a linear layer does, write this:

**y = W·x + b**  

It is the fundamental equation that you learn about in probably almost any linear algebra class.

Then explain: x is your input (a vector of features), W is a matrix of learned weights, b is a bias vector, and y is the transformed output. That's a linear transformation, and it's the atom that everything else in deep learning is built from.  This will all start to coalesce as I start building different models, and determining which one is best.

But that doesn't really explain what a linear layer does, does it? (HA! that is awkward wording-take that. perfectly made LLM articles.  Also chekc out all my tpyos! )

**"Okay, but what is it REALLY doing?"**

Imagine your input x is a bunch of pixels from a photo. The weight matrix W is like a set of high-tech stencils. One row of W might be a stencil for "horizontal lines," another for "round shapes."

When we do W⋅x, we are pressing all those stencils against our pixels. The output y tells us where the lines and circles are. A linear layer transforms raw data into high-level features. It takes the "What" (pixels) and turns it into the "So What" (shapes).

The +b (bias) is just a "threshold." It’s the layer's way of saying, "I don't care about these circles unless they are this bright.  Its kinda like the sum of action potentials that are being applied to a synapse, just not as complex.

#### The Linear Trap: Why one layer isn't enough

Here’s the secret: if you just stack y = Wx + b on top of itself forever, you don’t get a "Deep" Neural Network. You just get one giant, expensive linear equation. Because of how matrix math works, two linear layers in a row can always be simplified back down into one. It’s like doubling a number and then tripling it—you could have just multiplied by six from the start.
To make a model "smart" enough to recognize a face, we have to "break" the math with an **Activation Function** (like **ReLU**). We take the straight lines and fold them. That "break" is where the magic happens. But before we get to the breaking, we need to understand how to make these transformations efficient—which leads us to the "DNA" of a matrix: Eigenvectors

**What comes next**

The natural follow-up question is: what's special about certain weight matrices? Some matrices, when they transform a vector, just scale it — they don't rotate it. Those scaling directions are eigenvectors, and the scaling factors are eigenvalues. That's what Post 2 is about, and it's the key to understanding PCA and why dimensionality reduction works at all.


#### For more reading/viewing/learning, I recommend:

Start here — the classic: 

Gilbert Strang's MIT 18.06 on MIT OpenCourseWare — ocw.mit.edu/courses/18-06sc-linear-algebra-fall-2011. 35 full lecture videos, plus 36 short problem-solving help videos by teaching assistants — all free. Strang has a gift for making the geometry click before the formalism lands. For this post, Lectures 1–4 are your target. The man gave his final lecture in 2023 after decades of teaching this course — watch it knowing you're getting the distilled version of that whole career.  Mitocw is one of, if not the best thing on the internet.  (mike drop!)

For visual intuition: 3Blue1Brown's Essence of Linear Algebra — 3blue1brown.com/topics/linear-algebra. Watch this alongside Strang, not instead of it. Strang gives you rigor; 3Blue1Brown gives you the pictures in your head. Chapter 3 (linear transformations) and Chapter 9 (dot products) map directly to this post.

For hands-on code: Introduction to Linear Algebra for Applied ML with Python — every concept implemented in NumPy. Good for connecting what Strang teaches to what you'll actually type on the job.

The free book: Mathematics for Machine Learning by Deisenroth, Faisal, and Ong — mml-book.github.io. Chapter 2 is linear algebra. Denser than this blog but the reference you'll want when intuition isn't enough.

For drilling mechanics: Khan Academy's linear algebra section. Won't teach you the ML angle, but it makes matrix multiplication and dot products feel automatic — which matters when you're in an interview.  I am not as familiar as I should be with Khan academy, but it seems like a great resource.

You can pick up almost any linear algebra book for next to nothing at any used book store and learn all you want!

