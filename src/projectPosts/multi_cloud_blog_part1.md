---
title: "Building a Resilient Future: Our Journey into Multi-Cloud Distributed Systems"
date: "2025-09-19"
summary: "Can you deploy instances on different cloud providers?  What happens?"
---


> "Evaluation aims to mitigate risk and uncover opportunities. To mitigate risks, you first need to identify the places where your system is likely to fail and design your system to enhance visibility into its failures. Often, this may require redesigning your system to enhance visibility into its failures. Without a clear understanding of where your system fails, no amount of evaluation metrics or tools can make the system robust."  
> — C. Huhen, *AI Engineering*


# Building a Resilient Future: Our Journey into Multi-Cloud Distributed Systems (Part 1: Laying the Foundation)


## The Promise of the Cloud, Multiplied

In today's digital landscape, relying on a single cloud provider, while convenient, can introduce risks. What if a region goes down? What if pricing changes drastically? What if you need specialized services only available from another vendor? These questions lead us to the exciting, yet complex, world of **multi-cloud distributed systems**.


Our project, "MultiCloudDistSys," is an ambitious endeavor to build a robust, fault-tolerant distributed system that seamlessly operates across multiple cloud providers – specifically, AWS and Google Cloud Platform (GCP).


# High-Performance Data Pipeline Orchestrator


## Project Overview & Technical Specification


### 🎯 **What This System Actually Does**

The Data Pipeline Orchestrator is a **distributed system that coordinates the movement and processing of large-scale ML training data across multiple compute nodes**. Think of it as the "air traffic control" for your ML training data.


**Real-World Problem It Solves:**

- When training large ML models (like GPT, Claude, etc.), you need to move terabytes of training data efficiently across hundreds/thousands of machines
- Data needs to be ingested, preprocessed, distributed to training nodes, and stored reliably
- If any node fails, the system must automatically recover without losing data or stopping training
- Engineers need visibility into performance bottlenecks to optimize training speed


Imagine Anthropic is training Claude 5 using 1000 GPUs. The training data is 50TB and needs to be:

    Pulled from storage and preprocessed
    Distributed to all 1000 GPUs efficiently
    Kept flowing even if 50 GPUs fail during training
    Monitored in real-time so engineers can spot problems instantly


That's exactly what this orchestrator does - it's the "mission control" for ML training data.


### 📋 **Functional Requirements**


#### **Core Data Movement Operations**

1. **Data Ingestion**: Pull training data from multiple sources (S3, HDFS, local storage)
2. **Data Processing**: Transform, validate, and chunk data for distributed training
3. **Data Distribution**: Efficiently route processed data to available training nodes
4. **Data Persistence**: Store checkpoints and processed data with fault tolerance


#### **System Management**

1. **Node Discovery**: Automatically detect and register new compute nodes
2. **Load Balancing**: Distribute workload based on node capacity and network topology
3. **Failure Detection**: Monitor node health and trigger automatic failover
4. **Performance Optimization**: Dynamic routing and resource allocation


#### **Observability & Control**

1. **Real-time Metrics**: Track throughput, latency, and system efficiency
2. **Centralized Logging**: Aggregate logs from all nodes for debugging
3. **Pipeline Control**: Start/stop/pause operations across the entire cluster
4. **Alert Management**: Notify operators of performance degradation or failures


## Why Go Multi-Cloud? The Motivation Behind the Madness (Revisited)

While the core problem is data orchestration, our solution leverages a multi-cloud approach for critical advantages:

- **Enhanced Resilience & Disaster Recovery:** Distributing across clouds reduces single points of failure.
- **Cost Optimization:** Leveraging the best pricing for each component.
- **Avoiding Vendor Lock-in:** Maintaining flexibility and freedom.
- **Leveraging Best-of-Breed Services:** Utilizing unique strengths of different providers.
- **Research & Experimentation:** Exploring the complexities of heterogeneous distributed systems.


Our ultimate goal is to create a system that can dynamically adapt, self-heal, and maintain high availability regardless of individual cloud provider performance or failures.


## Sprint 1: From Concept to Cloud-Ready

Our first sprint was all about laying a rock-solid foundation. We moved from initial concept to a fully configured local environment, ready to deploy our distributed system components to the cloud.


### Core Software Foundation

We began by establishing a clean project structure and a reproducible development environment. Our focus was on Test-Driven Development (TDD), ensuring every core component was built with a strong suite of unit tests. Key components developed and tested include:

- **`UnifiedAuthManager`**: To handle authentication seamlessly across different cloud identities.
- **`MultiCloudNodeRegistry`**: A crucial component for tracking all nodes in our distributed system, regardless of their cloud host, and monitoring their health.
- **`CrossCloudCommunicationProtocol`**: The backbone for inter-node messaging, designed to handle the complexities of cross-cloud communication.
- **`ConfigurationManager`**: For loading and validating system settings from various sources.


### Local Cloud Environment Setup: Bridging the Gap

A significant part of Sprint 1 involved configuring our local machine to interact with both AWS and GCP. This was a journey of its own:

- **AWS CLI Configuration**: We set up an AWS IAM user with a least-privilege policy, generated access keys, and configured the AWS CLI with a default region (`us-east-1`) and output format (`json`). We also prepared an EC2 Key Pair for secure SSH access.
- **GCP CLI Configuration**: We installed the `gcloud` CLI, navigated through its interactive `init` process, created a new GCP project, and enabled the necessary Compute Engine API. We also configured default compute regions and zones (`us-central1`, `us-central1-a`).
- **Automated Provisioning & Teardown Scripts**: To streamline deployment and cost management, we developed shell scripts (`provision_aws.sh`, `provision_gcp.sh`, `teardown_aws.sh`, `teardown_gcp.sh`). These scripts automate the creation and deletion of our 6-node cluster (3 on AWS, 3 on GCP), including setting up necessary firewall rules and deploying our application code via startup scripts.


### Current Status & The Road Ahead

We've successfully tested the GCP provisioning, bringing up three `e2-micro` instances, deploying our code, and then tearing them down to save costs. Our AWS provisioning is currently on hold, awaiting account verification from AWS.

Once AWS verification is complete, our immediate next steps are:

1. Provision the AWS instances.
2. Re-provision the GCP instances.
3. The exciting part: **Verify inter-cloud communication** between all 6 nodes, ensuring our `CrossCloudCommunicationProtocol` truly lives up to its name!

Looking further ahead, our architecture is designed to be extensible, with future plans to integrate other major cloud providers such as Microsoft Azure, IBM Cloud, and potentially even emerging platforms like Ubuntu Cloud, further enhancing our system's resilience and flexibility.

This first sprint has laid a robust groundwork. We've tackled the initial complexities of multi-cloud setup, and we're now poised to bring our distributed system to life across the cloud frontier.

## Deep thoughts


Is this just a fancy wrapper to watch and make sure data gets moved around the Internet, ensuring delivery (looking at you UDP/TCP), on the application layer of the Internet? Well, yeah, but also it acts as an intelligent wrapper and orchestrator that operates at the application level. It primarily watches for the state of the distributed system, and ensures data is moved reliably and efficiently according to the defined pipeline, even across different cloud environments.

This will let ML researchers do what they do best: frog around on PyTorch or TensorFlow and mess about with fine-tuning hyperparameters.