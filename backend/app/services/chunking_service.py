"""
Chunking service — splits raw text into retrieval-sized pieces.

Chunk size matters more than it looks: too large and a query about one
detail retrieves (and dilutes context with) an entire project description;
too small and you lose surrounding context the LLM needs to answer well.
200-400 tokens per chunk (roughly 800-1600 characters) is the sweet spot
this app targets, per the ADR.

This is a simple sentence-aware splitter, not a recursive/semantic
chunker — appropriate for a project of this scale (single-digit KB of
text per project, not a document corpus).
"""

import re

CHUNK_CHAR_TARGET = 1200  # ~300 tokens
CHUNK_CHAR_OVERLAP = 150  # keeps context continuous across chunk boundaries

_SENTENCE_SPLIT_RE = re.compile(r"(?<=[.!?])\s+")


def split_into_chunks(text: str, chunk_size: int = CHUNK_CHAR_TARGET, overlap: int = CHUNK_CHAR_OVERLAP) -> list[str]:
    """
    Splits on sentence boundaries, packing sentences into chunks up to
    `chunk_size` characters, with the last `overlap` characters of each
    chunk repeated at the start of the next one.

    Short texts (a headline, a one-line summary) return as a single chunk
    unchanged — no point splitting something already under the target size.
    """
    text = text.strip()
    if not text:
        return []

    if len(text) <= chunk_size:
        return [text]

    sentences = _SENTENCE_SPLIT_RE.split(text)
    chunks: list[str] = []
    current = ""

    for sentence in sentences:
        candidate = f"{current} {sentence}".strip() if current else sentence

        if len(candidate) <= chunk_size:
            current = candidate
        else:
            if current:
                chunks.append(current)
            # start the next chunk with overlap from the end of the previous one,
            # so a fact split across a chunk boundary isn't lost to retrieval
            overlap_text = current[-overlap:] if current and len(current) > overlap else current
            current = f"{overlap_text} {sentence}".strip() if overlap_text else sentence

    if current:
        chunks.append(current)

    return chunks


def build_project_chunks(title: str, full_description: str) -> list[str]:
    """
    Prefixes each chunk with the project title so retrieval on a chunk
    alone (without joining back to the projects table) still carries
    enough context for the LLM to know what it's reading about.
    """
    raw_chunks = split_into_chunks(full_description)
    return [f"Project: {title}\n\n{chunk}" for chunk in raw_chunks]
