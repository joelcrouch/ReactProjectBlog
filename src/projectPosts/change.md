---
title: "Fail early, fail quickly, find another way"
date: "2025-10-17"
summary: "Changing the architecture of the multi-cloud Test bed."
---

## Scrapping the Monolith: Why We Pivoted to Go and Python for Cross-Cloud Orchestration

In the world of cloud engineering, sometimes the clues stack up until they force a complete architectural pivot. Our goal was simple: orchestrate complex data analysis across ephemeral nodes split between AWS and GCP, ensuring ultra-reliable gRPC communication.

Initially, we explored a single-language, unified approach. It seemed simpler, but the cracks started to show almost immediately. This is the story of why we scrapped that iteration and adopted a Go and Python hybrid model, designed for speed, concurrency, and powerful data processing.

### The Clues That Forced the Pivot

The signs that our original design wouldn't scale weren't catastrophic failures; they were insidious performance bottlenecks and unacceptable complexity in the control plane.

1. The Super Orchestrator Problem

Our core need was to manage the control plane: simultaneously monitoring thousands of worker nodes, coordinating data file transfers, and handling immediate status updates across the high-latency cross-cloud tunnel.

Actually we did not even get to the test phase with data.. We were just rubber-ducking it to ourselves, and some things were not adding up. We thought about how we would get data for ML model experiments to the nodes, and maintain some sense of reliability, and consensus. We could not find that .

2. The Data-Movement Latency Tax

Data transfer is a fundamental tax in cross-cloud ops. We needed to be able to fire and forget tasks, knowing the orchestrator could handle concurrent I/O waits and retries without grinding to a halt. The previous stack was too heavy for this I/O-bound work, leading to unnecessary delays in task completion. 3. "Get Data to the Nodes" Complexity

The simplest instruction, "get the data to the nodes," became a Gordian knot. We realized that the mechanism for triggering a data pipeline needed to be separate and far more performant than the mechanism for executing the data pipeline. We needed a fast messenger (Go) to wake up the heavy lifters (Python). We needed to use Raft and make sure it was part of our plan from the beginning.

### The New Architecture: Go's Brain, Python's Muscle

The solution was to split the responsibilities based on the core strengths of the languages. We didn't need a single language to do everything; we needed the right tool for the right job.
The Brain: Go as the Super Orchestrator

Go (Golang) is now the heart of our control plane.

    Concurrency Dominance: Thanks to goroutines, Go can manage hundreds of thousands of simultaneous connections and tasks with ease. It is perfectly suited to constantly poll, monitor, and manage the state of every VM in both AWS and GCP.

    Also, selfishly I have been comparing go to rust to java to c++ and go is verbose compared to java, but far less than rust. The two other are relatively the same.  So even if Claude/gemini/chat are doing alot of the code writing, I will have fewer lines of code to understand and test.

    Speed for the Control Plane: Go's compiled speed means our core orchestration logic, scheduling decisions, and API calls happen in milliseconds, minimizing latency across the VPN tunnel.

    gRPC Native: Go’s native support for gRPC makes setting up a robust, high-throughput communication layer trivial.

    There are also two main libraries for the Raft algorithm that we can use. One is a little easier to use than the other, so for the first time around, we will be using the basic library, not the etcd(kub8) library.

The Muscle: Python for Data Processing

Python is now the dedicated engine for our data plane.

    Irreplaceable Ecosystem: Our data science and machine learning logic relies heavily on libraries like NumPy, Pandas, and Scikit-learn. Trying to port this logic to another language would have been a monumental waste of time and stability.

    Execution Focus: Python workers now simply receive a compact instruction set from the Go orchestrator, execute the data processing job, and report the result back. This isolates the heavy computational work from the delicate orchestration logic.

### Synergy: The Handshake

In this new design, Go is the root process. It handles all cross-cloud communication, authentication, and state management. When it's time to process data, the Go orchestrator sends an RPC command over gRPC to the Python worker's endpoint, triggering a lightweight local script to run the heavy analytics.

We will be running a classic distributed load (matrix multiplication), to see if it works, where we are running into errors, etc. Thew we have 3 different real ML models to train: a kaggle competition, a chatbot, and cnn image identifier. Three relatively different loads that could be characteristic of ML loads used in the wild.

By splitting the workload, we maximize our performance budget: Go ensures speed and reliability for the control layer, and Python ensures power and flexibility for the data layer. This hybrid model ensures our project is now built for scale, performance, and future iteration.
