---
title: "How I Built a Research-Grade RAG System (And Survived Three Technical Meltdowns)"
date: "2026-1-30"
summary: "8,341 semantic sections. 22,369 chunks. Zero API costs. The technical pivots and architectural decisions behind building a research-grade RAG pipeline on local hardware."
---


# Beyond the Vibe: Building a Research-Grade RAG Pipeline from My Laptop

**The trials, tribulations, and technical pivots of Sprint 0**

---
"What if engineers could upload any technical documentation, experiment with different chunking strategies and embedding models, and find the perfect RAG configuration for their specific use case? That's the vision. This is Sprint 0.

I am making a postgress information RAG system.  It is essentially a proof of concept idea. Eventually the goal is to create  a platform that users can isnert their documents into, experiment with chunking strategies and different LLM's and see which combinations fit their purposes best.  I made a long winded sprint plan for the whole thing (I know, pretty ambitous, huh, nothing will surely change during implementation-Ha!), and started on sprint zero, which is getting the framework, and essentially the mvp working. Cool. No problem.

Sprint 0 was supposed to be straightforward: set up a Python environment, install LangChain, connect to OpenAI, and build a simple RAG assistant for PostgreSQL documentation. Nothing fancy. Just get the basics working.

Instead, it became a masterclass in software engineering under pressure—a transition from exploratory "vibe coding" to building what I now call a "modular lab prototype." By the end, the pipeline successfully transformed a monolithic PDF into **8,341 semantic sections** and **22,369 chunks**, all while running fully local and GPU-accelerated.

This is the story of Sprint 0: the pivots, the crashes, and the architectural decisions that turned a weekend project into portfolio gold.

---

## The Original Plan

The goal was simple: build a production-ready Retrieval-Augmented Generation (RAG) assistant to help engineers navigate complex technical documentation. The starting stack was straightforward:

- **Python** for the core logic
- **LangChain** for orchestration
- **OpenAI (GPT-4)** for embeddings and generation
- **PostgreSQL documentation** as the knowledge base
- **FAISS or Chroma** for vector storage
- **Gemini** for embeddings.(maybe)
It was supposed to be boring and solid. A proven stack. Nothing experimental.

Spoiler alert: that's not what happened.

---

## The Three Pivots That Changed Everything

### Pivot 1: Local LLM Integration

**What changed:** Moving away from exclusive dependence on OpenAI APIs in favor of local, free models.

**The catalyst:** API costs were going to go up, and I realized my laptop's NVIDIA RTX 500 Ada could handle smaller local models without breaking a sweat.  So goodbye OpenAI.  

**The new direction:** Implementing Hugging Face Sentence Transformers (specifically `all-MiniLM-L6-v2`) for local, GPU-accelerated embeddings. This meant I could iterate endlessly without worrying about burning through API credits.

### Pivot 2: Architecture Abstraction (The "Sidequest")

**What changed:** Pausing the vector store setup to build a formal `LLMInterface` and `EmbedderInterface`.

**The catalyst:** A mid-sprint realization that the system was becoming too tightly coupled with specific vendors (OpenAI/Gemini), making unit testing impossible without live API calls.

The exact moment the sidequest was born:

> **Me:** "mybe I need to go on a sidequest, and install the llm now, b/c the functioon calls openai api calls. and I dont want to do that (yet)".
>
> **Also ME** "Exactly — this is a classic sidequest moment...  can't unit test this properly without a live API call".

**The new direction:** Developing a provider-agnostic abstraction layer using a Registry pattern, allowing the system to swap between Mock, OpenAI, Gemini, and Local providers without changing core logic.
I can use the Mock for unit testing, and hugging face for embedding.  First I thought gemini embedding model would be fine, but the postgres documentation is not small, so that would be too much invested. Also the gemini embedder has 3072 dimensions, which is probably too much. The hugging face embedder has 764, I think, which should capture the nuances and return a solid result.  I think the way to descibe it might be if you want to differentiate between two coffee shops.  The 3072 dimension analysis will tell tell you what time they are open, all the branches, the color of the wallpaper, the number of tiles in  all the bathrooms, how many employees have brown hair, the number of empty cups on the counter, while the 764 dimension vector differentiates what you really need to know.  Is it open? Is it coffee shop? Cost of a black coffee?  Sometimes less is more. 

**Long-term benefits:**
- **Provider agnosticism:** Swap between OpenAI, Claude, Gemini, or local models without touching core logic
- **Cost and rate-limit control:** Full pipeline testing without spending API credits
- **Test stability:** Deterministic unit tests with no network dependency
- **Decoupled architecture:** Vendor-specific weirdness isolated to adapter classes
- **Research flexibility:** Side-by-side comparison of different embedding models

This single decision shifted the project from "vibe coding" to strategic software engineering.
I think I am using 'vibe-coding' correctly.

### Pivot 3: Document Format Shift (HTML → PDF)

**What changed:** Abandoning the ingestion of HTML files in favor of a monolithic PDF.

**The catalyst:** Initial retrieval tests on HTML files yielded irrelevant results. The vector store was returning navigation bars and footer text instead of actual technical content.
The embeddings worked and I did manage to populate a database with one chunking strategy, but the results were gibberish. The query was 'how do i create tables in postgres?'  Easy-cheesy.  But the results were no where near what I wanted. 

So, despite having a function that supposedly cleared all the html nav/div/p/body tags, it wasn't working.

**Why HTML failed:**
1. **Boilerplate pollution:** Navigation bars, footers, and sidebars introduced excessive semantic noise
2. **Loss of technical context:** Standard HTML loaders stripped out tables, SQL code blocks, and preformatted text
3. **Context-blind splitting:** Character-based chunking cut through the middle of sentences, separating headings from their content

**The new direction:** Implementing intelligent section-splitting for PDFs to preserve semantic structure.

---

## 💡 Pro-Tip: The Magic of PDF Section-Splitting

The breakthrough came from moving to a monolithic PDF and implementing **intelligent semantic segmentation** rather than simple page-based loading.  Dowloading the docs in pdf form gives one monolithic pdf-not so useful.

**The logic:** Instead of treating the PDF as a sequence of pages, the pipeline used regex to detect logical headers (e.g., "Chapter 5" or "Section 5.1") to merge and split text into 8,341 semantic sections.

**The secret sauce:** Title reinforcement—repeating the section title both in the metadata and as a natural language header within the chunk content.

**The result:** By adding markers like "Section: CREATE TABLE" directly into the text, the embedder was "forced" to associate those specific tokens with the chunk, ensuring that queries about those topics ranked exactly where they belonged.

This approach effectively turned one massive file into thousands of high-signal mini-documents, making retrieval far more accurate than the original HTML-based strategy.

Now when I query "how do i create TABLES in postgres', the results were relevant and the actual result I wanted was the #3 result. Great, and also an opportunity for optimizing. Can I get that to be the # 1 result?  Probably.

---

## Trials and Tribulations: The Technical Hurdles

Building "boring and solid" infrastructure meant surviving several high-friction crashes. Here are the three moments where progress ground to a complete halt.

### Crisis 1: The Conda/Mamba Environment Meltdown

**The vibe:** Desperate and "frozen." Every command crashed with the same error.
I always think conda/mamba is the way to go, especially when I will be using any ML adjacent libraries and/or the gpu.  

**The symptom:**
```
Error while loading conda entry point: conda-libmamba-solver 
(module 'libmambapy' has no attribute 'QueryFormat')
```

Every conda command—even unrelated tasks like `conda update` or `conda config`—triggered this fatal error. I was locked out of my entire base environment.

**The hidden cause:** A version mismatch between the `libmambapy` library and the installed version of Conda. Because my configuration had set `libmamba` as the default dependency solver, Conda attempted to automatically import the broken library on every launch.

**The fix:** A three-step manual recovery process:

1. **Manual filesystem deletion:** Since conda itself was broken, I had to manually remove the offending library from the site-packages directory
2. **Environment variable override:** Force Conda to use the classic solver for the repair session:
   ```bash
   CONDA_SOLVER=classic conda install ...
   ```
3. **Permanent configuration reset:** Edit `.condarc` to permanently remove the reference to the unstable solver

**The "Aha!" moment:**
> **ME to ME**"Perfect — that actually solves my problem entirely in the simplest way... Yes, I can just drop Mamba, use plain old conda, and everything works."

**Key takeaway:** In production environments, keep the base environment minimal. Always have a fallback strategy (like `CONDA_SOLVER=classic`) for recovering from dependency cycles that crash the management tools themselves.

### Crisis 2: The Pydantic Validation Wall

**The vibe:** Cyclical frustration. Fixed one problem, immediately hit another.

**The symptom:** Unit tests were failing during collection—before the test logic could even execute. No matter how I tried to mock the API keys, Pydantic's `BaseSettings` enforced mandatory fields.

**The hidden cause:** Pydantic v2 handles environment files differently than v1. The configuration strategy and the test strategy were out of sync.

**The fix:** Stop trying to mock the `.env` file. Instead, inject environment variables directly into the tests:

```python
@pytest.fixture
def mock_env(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "mock-key")
```

**The "Aha!" moment:**
> "This is actually a good failure — my tests are correctly telling you that my configuration + test strategy are slightly out of sync... Never mock env_file. Always set environment variables directly.

Turns out I could actually just make the Open_api_key and gemini_key optional. 



### Crisis 3: The Hugging Face "Finish Line" Dependency Break

**The vibe:** Man.  I might just finish sprint0 and get to bed on the same day! 

**The symptom:** At the very end of Sprint 0, after successfully dockerizing the pipeline and moving to local embeddings, the containers crashed immediately with an `ImportError` deep within the `sentence_transformers` library.

**The hidden cause:** The newest version of `huggingface_hub` had removed a function (`cached_download`) that `sentence-transformers` expected.

**The fix:** Pin to a very specific version:
```python
huggingface_hub==0.16.4  # Last version with cached_download
```

**The "Aha!" moment:**
> "Yep — I am  one dependency mismatch away from victory... This is a classic SentenceTransformers / HuggingFace Hub breakage. Nothing conceptually wrong with the  pipeline."


But, and here's a big but- i found out I actually didn't need to use docker to make the databases anyways. WHAAAT! Yeah!  I can just run a script and change the chunking/overlap and run a test retrieval afterwards. I will be able to spin up multiple vector databases, run the same script against them with the same queries and compare the results.  Take that, Docker errors!

---

## Current Status: Research-Ready

Sprint 0 is officially complete. The project has achieved the following milestones:

✅ **Successful ingestion:** The system processes a monolithic PostgreSQL PDF into 8,341 semantic sections and 22,369 chunks

✅ **Stable pipeline:** A local-first, GPU-accelerated pipeline using Hugging Face embeddings and a disk-backed FAISS vector store

✅ **Proven retrieval:** Baseline retrieval tests show the system correctly identifies relevant sections within the top 3 results for complex technical queries

✅ **Unit Testing:** Currently there are 74 unit tests. They take about a minute to run, since there is actual embedding happening.  Little mix of integration in there, for sure.  


✅ **Research-ready architecture:** The system supports multi-database experiments, allowing systematic comparison of different chunking strategies and embedding models

By "nosing around" technical nuances like chunk size and dimensionality early, I've built a modular lab prototype that other engineers can clone and seed with their own data.

---

## What's Next: Sprint 1

The path forward is clear:

- **Automated retrieval evaluation:** Build a systematic framework for testing retrieval quality
- **Metrics collection:** Quantify performance across different configurations
- **VectorStoreManager abstraction:** Enable seamless multi-database experiments
- **Hybrid search exploration:** Investigate whether BM25 + semantic search improves top-3 results

The foundation is solid. The infrastructure is boring (in the best way). Now it's time to make it smart.

---

## Lessons for Other Developers

If you're building a RAG system, here's what I learned the hard way:

1. **Abstract early, not late.** The "sidequest" to build provider-agnostic interfaces felt like a detour, but it paid off immediately in testing speed and cost savings.

2. **Semantic splitting > character splitting.** Don't let your chunker cut through the middle of a SQL query. Respect document structure.

3. **Title reinforcement works.** Repeating section titles in both metadata and content dramatically improves retrieval precision.

4. **Keep your base environment minimal.** When your package manager crashes, you'll thank yourself for having a clean fallback.

5. **Pin your dependencies.** Especially in fast-moving ecosystems like Hugging Face, version mismatches will bite you on your face at the worst possible moment.

6. **Test without APIs.** If your tests require network calls, you're not testing your logic—you're testing the network.

---

## Final Thoughts

Sprint 0 taught me that the difference between "vibe coding" and software engineering isn't about being clever—it's about being intentional. It's about building systems that are predictable, testable, and adaptable.

Yes, it took longer than expected. Yes, I hit multiple dead ends. But the result is a pipeline I can actually trust, iterate on, and show to recruiters without cringing.


---

*Built with: Python, LangChain, Hugging Face Transformers, FAISS, Docker, and an unhealthy amount of coffee.*

*Hardware: NVIDIA RTX 500 Ada (proving you don't need a server farm to build serious ML infrastructure)*